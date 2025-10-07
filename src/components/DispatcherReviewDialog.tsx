import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, FileText, Banknote, Clock, Building, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Task {
  id_zadachi: number;
  uuid_zadachi: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  completed_at?: string;
  execution_time_seconds?: number;
  responsible_user_name?: string;
  responsible_user_id?: string;
  order_title?: string;
  zakaz_id?: number;
  salary?: number;
  is_locked?: boolean;
  dispatcher_id?: string;
  dispatcher_percentage?: number;
  dispatcher_reward_amount?: number;
  dispatcher_reward_applied?: boolean;
  review_returns?: Array<{
    return_number: number;
    comment: string;
    returned_at: string;
  }>;
  original_deadline?: string;
}

interface DispatcherReviewDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const DispatcherReviewDialog = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}: DispatcherReviewDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [returnComment, setReturnComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  if (!task) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // 1. Начислить зарплату диспетчера
      if (!task.dispatcher_reward_applied && task.dispatcher_id && task.dispatcher_percentage && task.salary) {
        const dispatcherReward = (task.salary * task.dispatcher_percentage) / 100;
        
        // Получить текущую зарплату диспетчера
        const { data: dispatcherData, error: fetchError } = await supabase
          .from('users')
          .select('salary')
          .eq('uuid_user', task.dispatcher_id)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!dispatcherData) {
          throw new Error('Диспетчер не найден');
        }

        const currentSalary = dispatcherData?.salary || 0;
        const newSalary = currentSalary + dispatcherReward;

        // Обновить зарплату диспетчера
        const { error: salaryError } = await supabase
          .from('users')
          .update({ salary: newSalary })
          .eq('uuid_user', task.dispatcher_id);

        if (salaryError) throw salaryError;

        // 2. Начислить зарплату работнику используя функцию с SECURITY DEFINER
        if (task.responsible_user_id && task.salary) {
          try {
            const isOverdue = task.original_deadline && new Date(task.original_deadline) < new Date();
            const actualPayment = isOverdue ? Math.round(task.salary * 0.9) : task.salary;

            const { error: workerSalaryError } = await supabase.rpc('add_completed_task_and_salary', {
              p_worker_id: task.responsible_user_id,
              p_task_id: task.id_zadachi,
              p_payment: actualPayment,
              p_has_penalty: isOverdue
            });

            if (workerSalaryError) {
              console.error('Не удалось начислить зарплату работнику:', workerSalaryError);
              toast({
                variant: "destructive",
                title: "Предупреждение",
                description: "Задача подтверждена, но зарплата работнику не начислена"
              });
            }
          } catch (err) {
            console.error('Ошибка при начислении зарплаты работнику:', err);
            toast({
              variant: "destructive",
              title: "Предупреждение", 
              description: "Задача подтверждена, но зарплата работнику не начислена"
            });
          }
        }

        // 3. Обновить задачу
        const { error: taskError } = await supabase
          .from('zadachi')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            dispatcher_reward_amount: dispatcherReward,
            dispatcher_reward_applied: true,
            dispatcher_reward_applied_at: new Date().toISOString()
          })
          .eq('id_zadachi', task.id_zadachi);

        if (taskError) throw taskError;

        toast({
          title: "Задача подтверждена",
          description: `Задача завершена. Вознаграждение диспетчера: ${dispatcherReward.toFixed(2)} ₽`
        });
      }

      queryClient.invalidateQueries({ queryKey: ['dispatcher-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['zadachi'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onTaskUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось подтвердить задачу"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async () => {
    if (!returnComment.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Комментарий обязателен при возврате на доработку"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const currentReturns = task.review_returns || [];
      const newReturn = {
        return_number: currentReturns.length + 1,
        comment: returnComment.trim(),
        returned_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('zadachi')
        .update({
          status: 'in_progress',
          is_locked: false,
          review_returns: [...currentReturns, newReturn]
        })
        .eq('id_zadachi', task.id_zadachi);

      if (error) throw error;

      toast({
        title: "Задача возвращена",
        description: "Задача отправлена работнику на доработку"
      });

      queryClient.invalidateQueries({ queryKey: ['dispatcher-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['zadachi'] });
      queryClient.invalidateQueries({ queryKey: ['worker-tasks'] });
      onTaskUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error returning task:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось вернуть задачу на доработку"
      });
    } finally {
      setIsProcessing(false);
      setShowReturnDialog(false);
      setReturnComment("");
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showReturnDialog} onOpenChange={onClose}>
        <DialogContent className="w-[800px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-2xl tracking-tight">
              Проверка задачи: {task.title}
            </DialogTitle>
            <Badge variant="secondary" className="bg-warning text-warning-foreground w-fit">
              На проверке
            </Badge>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display font-bold text-lg">Информация о задаче</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Описание</p>
                      <p className="font-medium whitespace-pre-wrap">{task.description}</p>
                    </div>
                  </div>
                )}

                {task.order_title && (
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Заказ</p>
                      <p className="font-semibold">{task.order_title}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ответственный работник</p>
                    <p className="font-semibold">{task.responsible_user_name || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Banknote className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Оплата работника</p>
                    <p className="font-semibold">{task.salary ? `${task.salary} ₽` : '—'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Срок выполнения</p>
                    <p className="font-semibold">{formatDate(task.original_deadline || task.due_date)}</p>
                    {task.original_deadline && new Date(task.original_deadline) < new Date() && (
                      <Badge variant="destructive" className="mt-1">Просрочено</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* История возвратов */}
            {task.review_returns && task.review_returns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    История возвратов на доработку
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.review_returns.map((returnItem) => (
                    <div key={returnItem.return_number} className="border-l-4 border-warning pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">Возврат #{returnItem.return_number}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(returnItem.returned_at)}
                        </span>
                      </div>
                      <p className="text-sm">{returnItem.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Кнопки действий */}
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 bg-status-done hover:bg-status-done/90"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Всё верно
              </Button>
              <Button
                onClick={() => setShowReturnDialog(true)}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Вернуть на доработку
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог возврата с комментарием */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Возврат на доработку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Комментарий для работника <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={returnComment}
                onChange={(e) => setReturnComment(e.target.value)}
                placeholder="Укажите, что необходимо исправить..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleReturn}
                disabled={isProcessing || !returnComment.trim()}
                className="flex-1"
                variant="destructive"
              >
                Отправить на доработку
              </Button>
              <Button
                onClick={() => {
                  setShowReturnDialog(false);
                  setReturnComment("");
                }}
                variant="outline"
                className="flex-1"
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DispatcherReviewDialog;
