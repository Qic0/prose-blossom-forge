import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "./KanbanBoard";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Calendar, User, Phone, Mail, Building, MessageSquare, Clock, FileText, Tag, CheckCircle, Circle, PlayCircle, Check, Hammer, Scissors, Drill, Wrench, Brush, Palette, Paperclip, Plus } from "lucide-react";
import { FileAttachmentsList } from '@/components/FileAttachmentsList';
import { FileUpload } from '@/components/FileUpload';
import { useOrderAttachments } from '@/hooks/useOrderAttachments';
import { motion, AnimatePresence } from 'framer-motion';
interface OrderDetailsDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}
const getPriorityColor = (priority: Order['priority']) => {
  const colors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-warning/10 text-warning-foreground',
    high: 'bg-destructive/10 text-destructive'
  };
  return colors[priority];
};
const getPriorityText = (priority: Order['priority']) => {
  const texts = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  };
  return texts[priority];
};
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Стадии производства
const productionStages = [{
  id: 'cutting',
  name: 'Распил',
  order: 1
}, {
  id: 'edging',
  name: 'Кромление',
  order: 2
}, {
  id: 'drilling',
  name: 'Присадка',
  order: 3
}, {
  id: 'sanding',
  name: 'Шлифовка',
  order: 4
}, {
  id: 'priming',
  name: 'Грунт',
  order: 5
}, {
  id: 'painting',
  name: 'Покраска',
  order: 6
}];

// Моковые данные для дат завершения этапов
const stageCompletionDates = {
  1: '2025-01-12T14:30:00Z',
  // завершен
  2: '2025-01-15T16:45:00Z',
  // текущий этап (прогноз)
  3: '2025-01-18T10:00:00Z',
  // прогноз
  4: '2025-01-22T12:30:00Z',
  // прогноз
  5: '2025-01-25T09:15:00Z',
  // прогноз
  6: '2025-01-28T15:00:00Z' // прогноз
};

// Моковые данные для дат передачи между этапами
const transferDates = {
  1: '2025-01-12T15:00:00Z',
  // передано на кромление
  2: '2025-01-15T17:00:00Z',
  // прогноз передачи на присадку
  3: '2025-01-18T10:30:00Z',
  // прогноз передачи на шлифовку
  4: '2025-01-22T13:00:00Z',
  // прогноз передачи на грунт
  5: '2025-01-25T09:45:00Z' // прогноз передачи на покраску
};
const mockHistory = [{
  id: '1',
  action: 'Заказ создан',
  user: 'Администратор',
  date: '2025-01-10T10:00:00Z'
}, {
  id: '2',
  action: 'Задача "Создать чертеж" создана',
  user: 'Менеджер',
  date: '2025-01-10T14:30:00Z'
}, {
  id: '3',
  action: 'Задача "Создать чертеж" завершена',
  user: 'Иван Петров',
  date: '2025-01-12T16:45:00Z'
}, {
  id: '4',
  action: 'Задача "Подготовить материалы" создана',
  user: 'Менеджер',
  date: '2025-01-13T09:15:00Z'
}];
const OrderDetailsDialog = ({
  order,
  isOpen,
  onClose
}: OrderDetailsDialogProps) => {
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { attachments, isLoading: attachmentsLoading, downloadFile, deleteFile, uploadFiles, isUploading } = useOrderAttachments(order?.id);
  
  if (!order) return null;

  // Запрос для получения реальных задач по ID из vse_zadachi
  const {
    data: tasks = [],
    isLoading: tasksLoading
  } = useQuery({
    queryKey: ['orderTasks', order.id],
    queryFn: async () => {
      if (!order.vse_zadachi || order.vse_zadachi.length === 0) {
        return [];
      }

      // Получаем задачи
      const {
        data: tasksData,
        error: tasksError
      } = await supabase.from('zadachi').select('*').in('id_zadachi', order.vse_zadachi);
      if (tasksError) throw tasksError;

      // Получаем данные пользователей
      const userIds = tasksData?.filter(task => task.responsible_user_id).map(task => task.responsible_user_id) || [];
      let usersData = [];
      if (userIds.length > 0) {
        const {
          data,
          error: usersError
        } = await supabase.from('users').select('uuid_user, full_name').in('uuid_user', userIds);
        if (usersError) throw usersError;
        usersData = data || [];
      }

      // Создаем карту пользователей
      const usersMap = new Map(usersData.map(user => [user.uuid_user, user.full_name]));
      return tasksData?.map(task => ({
        id: task.id_zadachi.toString(),
        title: task.title,
        status: task.status,
        assignee: task.responsible_user_id ? usersMap.get(task.responsible_user_id) || 'Не назначен' : 'Не назначен',
        dueDate: task.due_date,
        priority: task.priority
      })) || [];
    },
    enabled: isOpen && !!order.vse_zadachi && order.vse_zadachi.length > 0
  });

  // Определяем текущую стадию на основе статуса заказа (как в канбане)
  const getStageFromStatus = (status: string): number => {
    switch (status) {
      case 'cutting':
        return 1;
      case 'edging':
        return 2;
      case 'drilling':
        return 3;
      case 'sanding':
        return 4;
      case 'priming':
        return 5;
      case 'painting':
        return 6;
      default:
        return 1;
      // По умолчанию - первый этап
    }
  };
  const currentStage = getStageFromStatus(order.status || 'cutting');
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  // Расчет прогресса на основе этапов: текущий этап / общее количество этапов * 100
  const progressPercentage = currentStage / productionStages.length * 100;
  const getStageIcon = (stageOrder: number) => {
    if (stageOrder < currentStage) {
      return <CheckCircle className="w-4 h-4 text-primary" />;
    } else if (stageOrder === currentStage) {
      return <PlayCircle className="w-4 h-4 text-warning" />;
    } else {
      return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };
  const getStageColor = (stageOrder: number) => {
    if (stageOrder < currentStage) {
      return "text-primary font-semibold";
    } else if (stageOrder === currentStage) {
      return "text-warning font-semibold";
    } else {
      return "text-muted-foreground";
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1200px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-2xl tracking-tight">
            {order.title}
          </DialogTitle>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={`${getPriorityColor(order.priority)} font-display font-bold`}>
              {getPriorityText(order.priority)} приоритет
            </Badge>
          </div>
        </DialogHeader>

        {/* Этапы производства */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display font-bold text-lg">Этапы производства</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Прогресс-бар */}
            <div className="flex items-center justify-between">
              <Progress value={progressPercentage} className="flex-1" />
              <span className="text-sm font-mono text-muted-foreground ml-4">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            
            {/* Этапы производства */}
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="flex justify-between items-center min-w-[800px] px-2 py-4">
                  {productionStages.map((stage, index) => <div key={stage.id} className="flex items-center">
                      {/* Этап */}
                      <div className="flex flex-col items-center min-w-[100px]">
                        {/* Круг статуса */}
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${stage.order < currentStage ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : stage.order === currentStage ? 'bg-orange-100 border-2 border-orange-400 text-orange-600 shadow-lg shadow-orange-400/20' : 'bg-background border border-border/50 text-muted-foreground'}`}>
                            {stage.order < currentStage ? <Check className="w-4 h-4" /> : stage.order === currentStage ? <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div> : <Circle className="w-3 h-3" />}
                          </div>
                        </div>
                      
                        {/* Название этапа и даты */}
                        <div className="mt-2 text-center">
                          <span className={`text-xs font-medium block whitespace-nowrap ${stage.order < currentStage ? 'text-green-600' : stage.order === currentStage ? 'text-orange-600 font-semibold' : 'text-muted-foreground/60'}`}>
                            {stage.name}
                          </span>
                          
                          {/* Даты Run и End */}
                          <div className="mt-1 space-y-0.5">
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              Run: {new Intl.DateTimeFormat('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(transferDates[stage.order] || stageCompletionDates[stage.order]))}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              End: {new Intl.DateTimeFormat('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).format(new Date(stageCompletionDates[stage.order]))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Стрелка между этапами */}
                      {index < productionStages.length - 1 && <div className="flex items-center mx-3">
                          <div className={`h-1 rounded-full transition-all duration-700 ${stage.order < currentStage ? 'bg-gradient-to-r from-green-500 to-green-400 shadow-sm' : stage.order === currentStage - 1 ? 'bg-gradient-to-r from-green-500 via-yellow-400 to-muted-foreground/20' : 'bg-muted-foreground/20'}`} style={{
                      width: '30px'
                    }} />
                          
                          <div className={`w-0 h-0 transition-all duration-700 ${stage.order < currentStage ? 'border-l-[6px] border-l-green-400 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent' : stage.order === currentStage - 1 ? 'border-l-[6px] border-l-yellow-400 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent animate-pulse' : 'border-l-[6px] border-l-muted-foreground/20 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent'}`} />
                        </div>}
                    </div>)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Левая колонка */}
          <div className="space-y-6">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display font-bold text-lg">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Клиент</p>
                      <p className="font-semibold">{order.client}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Tag className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Стоимость</p>
                      <p className="font-semibold text-lg font-display">
                        {formatCurrency(order.value)} ₽
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ответственный</p>
                      <p className="font-semibold">{order.assignee}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Дедлайн</p>
                      <p className="font-semibold">{formatDate(order.dueDate)}</p>
                    </div>
                  </div>
                </div>

                {order.description && <div className="pt-4 border-t">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Описание</p>
                        <p className="text-sm leading-relaxed mt-1">{order.description}</p>
                      </div>
                    </div>
                  </div>}
              </CardContent>
            </Card>

            {/* Прикрепленные файлы */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display font-bold text-lg flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Прикрепленные файлы
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadOpen(!isUploadOpen)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatePresence>
                  {isUploadOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <FileUpload
                        onFilesSelected={setSelectedFiles}
                        onUpload={async (files) => {
                          if (order?.id) {
                            await uploadFiles({ files, orderId: order.id });
                            setSelectedFiles([]);
                            setIsUploadOpen(false);
                          }
                        }}
                        maxFiles={10}
                        maxFileSize={20}
                        acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx', '.xls', '.xlsx', '.dwg', '.dxf']}
                        disabled={isUploading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {attachmentsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Загрузка файлов...
                  </div>
                ) : (
                  <FileAttachmentsList
                    files={attachments}
                    onDownload={downloadFile}
                    onDelete={deleteFile}
                    readonly={false}
                  />
                )}
              </CardContent>
            </Card>

          </div>

          {/* Правая колонка */}
          <div className="space-y-6">
            {/* Задачи */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display font-bold text-lg">Задачи по заказу</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasksLoading ? <div className="text-center py-4 text-muted-foreground">
                      Загрузка задач...
                    </div> : tasks.length === 0 ? <div className="text-center py-4 text-muted-foreground">
                      Нет связанных задач
                    </div> : tasks.map(task => <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.assignee}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs">
                            {task.status === 'completed' ? 'Завершена' : task.status === 'in_progress' ? 'В работе' : task.status === 'pending' ? 'Ожидает' : task.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.dueDate ? formatDate(task.dueDate) : '—'}
                          </p>
                        </div>
                      </div>)}
                 </div>
                 <Button variant="outline" className="w-full mt-4" onClick={() => setIsCreateTaskDialogOpen(true)}>
                   Добавить задачу
                 </Button>
                 
                 <CreateTaskDialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen} />
              </CardContent>
            </Card>

            {/* История */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display font-bold text-lg">История изменений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {mockHistory.map(entry => <div key={entry.id} className="border-l-2 border-primary/20 pl-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">{entry.user}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Действия */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
          <Button variant="default">
            Редактировать заказ
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};
export default OrderDetailsDialog;