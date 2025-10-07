import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, FileText, Tag, CheckCircle, Clock, Building, Banknote, Camera, Timer, AlertTriangle, Trash2, XCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

// Component to display dispatcher info
const DispatcherInfo = ({ dispatcherId, dispatcherPercentage }: { dispatcherId: string, dispatcherPercentage?: number }) => {
  const { data: dispatcher } = useQuery({
    queryKey: ['dispatcher', dispatcherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('uuid_user', dispatcherId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!dispatcherId
  });

  return (
    <div className="flex items-center space-x-3">
      <Shield className="w-5 h-5 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">Проверяет диспетчер</p>
        <p className="font-semibold">
          {dispatcher?.full_name || '—'}
          {dispatcherPercentage && <span className="text-sm text-muted-foreground ml-2">({dispatcherPercentage}%)</span>}
        </p>
      </div>
    </div>
  );
};
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
  checklist_photo?: string;
  is_locked?: boolean;
  dispatcher_id?: string;
  dispatcher_percentage?: number;
  dispatcher_reward_amount?: number;
  dispatcher_reward_applied?: boolean;
  review_returns?: any;
  original_deadline?: string;
  penalty_applied?: boolean;
}
interface TaskDetailsDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}
const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-muted text-foreground',
    medium: 'bg-warning/10 text-warning-foreground',
    high: 'bg-destructive/10 text-destructive'
  };
  return colors[priority as keyof typeof colors] || 'bg-muted text-foreground';
};
const getPriorityText = (priority: string) => {
  const texts = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  };
  return texts[priority as keyof typeof texts] || priority;
};
const getStatusColor = (status: string) => {
  const colors = {
    pending: 'bg-warning text-warning-foreground',
    in_progress: 'bg-status-progress text-white',
    completed: 'bg-status-done text-white',
    under_review: 'bg-warning/70 text-warning-foreground'
  };
  return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
};
const getStatusText = (status: string) => {
  const texts = {
    pending: 'Ожидает',
    in_progress: 'В работе',
    completed: 'Выполнено',
    under_review: 'На проверке'
  };
  return texts[status as keyof typeof texts] || status;
};
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

const formatRemainingTime = (task: Task) => {
  // Для завершенных задач показываем время выполнения
  if (task.status === 'completed' && task.execution_time_seconds) {
    const hours = Math.floor(task.execution_time_seconds / 3600);
    const minutes = Math.floor((task.execution_time_seconds % 3600) / 60);
    
    if (hours > 0) {
      return `Выполнено за ${hours}ч ${minutes}м`;
    } else {
      return `Выполнено за ${minutes}м`;
    }
  }
  
  // Для незавершенных задач показываем оставшееся время
  if (!task.created_at || !task.due_date) return '—';
  
  try {
    const createdDate = new Date(task.created_at);
    const dueDate = new Date(task.due_date);
    
    if (!isValid(createdDate) || !isValid(dueDate)) return '—';
    
    const totalMs = dueDate.getTime() - createdDate.getTime();
    const currentMs = Date.now() - createdDate.getTime();
    const remainingMs = totalMs - currentMs;
    
    if (remainingMs <= 0) {
      const overdueMs = Math.abs(remainingMs);
      const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let overdueText = '';
      if (overdueHours > 0) {
        overdueText = `${overdueHours}ч ${overdueMinutes}м`;
      } else {
        overdueText = `${overdueMinutes}м`;
      }
      
      return `Просрочено на ${overdueText}`;
    }
    
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${remainingHours}ч ${remainingMinutes}м`;
  } catch {
    return '—';
  }
};
const TaskDetailsDialog = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}: TaskDetailsDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPenalizing, setIsPenalizing] = useState(false);
  if (!task) return null;
  const handleCompleteTask = async () => {
    setIsCompleting(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Completing task:', task.id_zadachi, 'responsible_user_id:', task.responsible_user_id, 'salary:', task.salary);
      }
      
      // Prepare update data
      const updateData: any = {
        status: 'under_review',
        is_locked: true
      };

      // Save original_deadline if not set yet (for penalty calculation)
      if (!task.original_deadline && task.due_date) {
        updateData.original_deadline = task.due_date;
      }

      // Get dispatcher info from automation_settings if not already assigned
      if (!task.dispatcher_id && task.zakaz_id) {
        // Get order status to find the right automation setting
        const { data: orderData, error: orderError } = await supabase
          .from('zakazi')
          .select('status')
          .eq('id_zakaza', task.zakaz_id)
          .single();

        if (!orderError && orderData) {
          // Get automation settings for this stage
          const { data: settingsData, error: settingsError } = await supabase
            .from('automation_settings')
            .select('dispatcher_id, dispatcher_percentage')
            .eq('stage_id', orderData.status)
            .single();

          if (!settingsError && settingsData) {
            updateData.dispatcher_id = settingsData.dispatcher_id;
            updateData.dispatcher_percentage = settingsData.dispatcher_percentage;
          }
        }
      }

      // Update task to under_review status
      const { error: taskError } = await supabase
        .from('zadachi')
        .update(updateData)
        .eq('id_zadachi', task.id_zadachi);

      if (taskError) throw taskError;

      // Salary will be paid after dispatcher approval, not here
      
      toast({
        title: "Задача отправлена на проверку",
        description: "Задача отправлена диспетчеру на проверку. Зарплата будет начислена после подтверждения."
      });
      
      onTaskUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось завершить задачу. Попробуйте еще раз."
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.')) {
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Если задача была завершена, вернуть зарплату пользователю
      if (task.status === 'completed' && task.responsible_user_id && task.salary && task.salary > 0) {
        const { data: userData, error: userFetchError } = await supabase
          .from('users')
          .select('salary, completed_tasks')
          .eq('uuid_user', task.responsible_user_id)
          .single();

        if (!userFetchError && userData) {
          const currentSalary = userData?.salary || 0;
          const newSalary = Math.max(0, currentSalary - task.salary);
          
          // Удалить задачу из completed_tasks
          const currentCompletedTasks = (userData as any)?.completed_tasks || [];
          const updatedCompletedTasks = currentCompletedTasks.filter(
            (t: any) => t.task_id !== task.id_zadachi
          );

          await supabase
            .from('users')
            .update({ 
              salary: newSalary,
              completed_tasks: updatedCompletedTasks
            } as any)
            .eq('uuid_user', task.responsible_user_id);
        }
      }

      // 2. Удалить задачу из массива vse_zadachi в заказе
      if (task.zakaz_id) {
        const { data: zakazData, error: zakazFetchError } = await supabase
          .from('zakazi')
          .select('vse_zadachi')
          .eq('id_zakaza', task.zakaz_id)
          .single();

        if (!zakazFetchError && zakazData) {
          const currentTasks = zakazData?.vse_zadachi || [];
          const updatedTasks = currentTasks.filter((id: number) => id !== task.id_zadachi);

          await supabase
            .from('zakazi')
            .update({ vse_zadachi: updatedTasks })
            .eq('id_zakaza', task.zakaz_id);
        }
      }

      // 3. Удалить саму задачу
      const { error: deleteError } = await supabase
        .from('zadachi')
        .delete()
        .eq('id_zadachi', task.id_zadachi);

      if (deleteError) throw deleteError;

      toast({
        title: "Задача удалена",
        description: "Задача успешно удалена из системы."
      });

      // Инвалидировать все связанные запросы
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['zadachi'] });
      queryClient.invalidateQueries({ queryKey: ['zakazi'] });
      queryClient.invalidateQueries({ queryKey: ['zakazi-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['orderTasks'] });
      
      onTaskUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить задачу. Попробуйте еще раз."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDispatcherPenalty = async () => {
    if (!task.dispatcher_reward_applied || !task.dispatcher_reward_amount) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Невозможно применить штраф. Начисление диспетчеру не производилось."
      });
      return;
    }

    if (task.penalty_applied) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Штраф уже был применён для этой задачи."
      });
      return;
    }

    if (!confirm(`Вы уверены, что хотите оштрафовать диспетчера на ${(task.dispatcher_reward_amount * 2).toFixed(2)} ₽?`)) {
      return;
    }

    setIsPenalizing(true);
    try {
      const penaltyAmount = task.dispatcher_reward_amount * 2;
      
      // Получить текущую зарплату диспетчера
      const { data: dispatcherData, error: fetchError } = await supabase
        .from('users')
        .select('salary')
        .eq('uuid_user', task.dispatcher_id)
        .single();

      if (fetchError) throw fetchError;

      const currentSalary = dispatcherData?.salary || 0;
      const newSalary = currentSalary - penaltyAmount;

      // Обновить зарплату диспетчера
      const { error: salaryError } = await supabase
        .from('users')
        .update({ salary: newSalary })
        .eq('uuid_user', task.dispatcher_id);

      if (salaryError) throw salaryError;

      // Записать в лог штрафа
      const { error: logError } = await supabase
        .from('admin_penalty_log')
        .insert({
          task_id: task.id_zadachi,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          dispatcher_id: task.dispatcher_id,
          penalty_amount: penaltyAmount,
          reason: 'Ошибка диспетчера'
        });

      if (logError) throw logError;

      // Обновить задачу
      const { error: taskError } = await supabase
        .from('zadachi')
        .update({ penalty_applied: true })
        .eq('id_zadachi', task.id_zadachi);

      if (taskError) throw taskError;

      toast({
        title: "Штраф применён",
        description: `Диспетчер оштрафован на ${penaltyAmount.toFixed(2)} ₽`
      });

      queryClient.invalidateQueries({ queryKey: ['zadachi'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onTaskUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error applying penalty:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось применить штраф"
      });
    } finally {
      setIsPenalizing(false);
    }
  };

  const isCompleted = task.status === 'completed' || task.completed_at;
  const isUnderReview = task.status === 'under_review';
  const reviewReturns = Array.isArray(task.review_returns) ? task.review_returns : [];
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[800px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-2xl tracking-tight">
            {task.title}
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={`${getPriorityColor(task.priority)} font-display font-bold`}>
              {getPriorityText(task.priority)} приоритет
            </Badge>
            <Badge variant="secondary" className={`${getStatusColor(task.status)} font-medium`}>
              {getStatusText(task.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Основная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display font-bold text-lg">Информация о задаче</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {task.order_title && <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Заказ</p>
                      <p className="font-semibold">{task.order_title}</p>
                    </div>
                  </div>}

                <div className="flex items-center space-x-3">
                  <Banknote className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Зарплата</p>
                    {task.salary ? (
                      task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date() ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-muted-foreground line-through">{task.salary} ₽</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-xs">Штраф 10%</Badge>
                            <p className="font-semibold text-destructive">{Math.round(task.salary * 0.9)} ₽</p>
                          </div>
                        </div>
                      ) : (
                        <p className="font-semibold">{task.salary} ₽</p>
                      )
                    ) : (
                      <p className="font-semibold">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ответственный</p>
                    <p className="font-semibold">{task.responsible_user_name || '—'}</p>
                  </div>
                </div>

                {/* Dispatcher info - shown for admin and when task is under review or completed */}
                {(isAdmin || isUnderReview || isCompleted) && task.dispatcher_id && (
                  <DispatcherInfo dispatcherId={task.dispatcher_id} dispatcherPercentage={task.dispatcher_percentage} />
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Срок выполнения</p>
                    <p className="font-semibold">{formatDate(task.due_date)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    task.due_date && new Date(task.due_date) < new Date() ? (
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Timer className="w-5 h-5 text-muted-foreground" />
                    )
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {task.status === 'completed' ? 'Время выполнения' : 'Осталось времени'}
                    </p>
                    <p className={`font-semibold ${
                      task.status === 'completed' 
                        ? 'text-green-600' 
                        : task.due_date && new Date(task.due_date) < new Date() 
                          ? 'text-destructive' 
                          : 'text-muted-foreground'
                    }`}>
                      {formatRemainingTime(task)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Создана</p>
                    <p className="font-semibold">{formatDate(task.created_at)}</p>
                  </div>
                </div>

                {task.completed_at && <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Завершена</p>
                      <p className="font-semibold text-green-600">{formatDate(task.completed_at)}</p>
                    </div>
                  </div>}
              </div>

              {task.description && <div className="pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Описание</p>
                      <p className="text-sm leading-relaxed mt-1">{task.description}</p>
                    </div>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Completion Photo */}
          {task.checklist_photo && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Фото выполненной работы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={task.checklist_photo}
                  alt="Фото выполненной работы"
                  className="w-full max-w-md h-64 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.open(task.checklist_photo, '_blank')}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Нажмите для увеличения
                </p>
              </CardContent>
            </Card>
          )}

          {/* История возвратов на доработку */}
          {reviewReturns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  История возвратов на доработку
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviewReturns.map((returnItem: any) => (
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

          {/* Сообщение о проверке */}
          {isUnderReview && (
            <Card className="bg-warning/10 border-warning">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-semibold text-warning-foreground">Задача на проверке у диспетчера</p>
                    <p className="text-sm text-muted-foreground">
                      Зарплата будет начислена после подтверждения диспетчером
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Действия */}
        <div className="sticky bottom-0 flex justify-between items-center pt-6 border-t bg-background z-10 -mx-6 px-6 pb-6 -mb-6">
          <div className="flex gap-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
            
            {/* Кнопка штрафа диспетчера (только для админов и завершенных задач) */}
            {isAdmin && isCompleted && task.dispatcher_reward_applied && !task.penalty_applied && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDispatcherPenalty}
                disabled={isPenalizing}
              >
                <XCircle className="w-3 h-3 mr-1" />
                {isPenalizing ? "Применение..." : "Ошибка диспетчера"}
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Закрыть
            </Button>
            {!isCompleted && !isUnderReview && (
              <Button 
                onClick={handleCompleteTask}
                disabled={isCompleting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isCompleting ? "Отправка..." : "Отправить на проверку"}
              </Button>
            )}
          </div>
        </div>
        
      </DialogContent>
    </Dialog>;
};
export default TaskDetailsDialog;