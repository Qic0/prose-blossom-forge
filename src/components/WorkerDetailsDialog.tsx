import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, parseISO, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { 
  Mail, 
  Phone, 
  Calendar as CalendarIcon, 
  Coins, 
  Briefcase,
  User,
  CheckCircle,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import TaskDetailsDialog from "@/components/TaskDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  uuid_user: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  salary?: number;
  avatar_url?: string;
  created_at: string;
  last_seen?: string;
  current_task?: string;
  completed_tasks?: Array<{
    task_id: number;
    payment: number;
    has_penalty?: boolean;
    task_title?: string;
    order_title?: string;
    completed_date?: string;
    execution_time_seconds?: number;
    is_review?: boolean;
  }>;
}

interface WorkerDetailsDialogProps {
  worker: Worker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WorkerDetailsDialog = ({ worker, open, onOpenChange }: WorkerDetailsDialogProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const { toast } = useToast();
  
  if (!worker) return null;

  // Проверка онлайн статуса на основе last_seen
  const isWorkerOnline = () => {
    if (!worker.last_seen) return false;
    
    const lastSeen = new Date(worker.last_seen).getTime();
    const now = new Date().getTime();
    const diffInMinutes = (now - lastSeen) / (1000 * 60);
    
    return diffInMinutes <= 1;
  };

  const getWorkerStatus = (): 'online' | 'offline' => {
    return isWorkerOnline() ? 'online' : 'offline';
  };

  const formatExecutionTime = (seconds?: number) => {
    if (!seconds) return null;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else {
      return `${minutes}м`;
    }
  };

  // Get working days from completed tasks and add test data
  const getWorkingDays = () => {
    const allTasks = worker.completed_tasks || [];
    
    const realWorkingDays = allTasks
      .filter(task => task.completed_date)
      .map(task => parseISO(task.completed_date!))
      .filter(date => !isNaN(date.getTime()));

    // Add test working days for demonstration
    const testDates = [
      new Date(2024, 8, 2),   // 2 сентября 2024
      new Date(2024, 8, 3),   // 3 сентября 2024
      new Date(2024, 8, 5),   // 5 сентября 2024
      new Date(2024, 8, 9),   // 9 сентября 2024
      new Date(2024, 8, 10),  // 10 сентября 2024
      new Date(2024, 8, 12),  // 12 сентября 2024
      new Date(2024, 8, 16),  // 16 сентября 2024
      new Date(2024, 8, 17),  // 17 сентября 2024
      new Date(2024, 8, 19),  // 19 сентября 2024
      new Date(2024, 8, 23),  // 23 сентября 2024
      new Date(2024, 8, 24),  // 24 сентября 2024
      new Date(2024, 8, 26),  // 26 сентября 2024
      new Date(2024, 8, 30),  // 30 сентября 2024
      new Date(2024, 9, 1),   // 1 октября 2024
      new Date(2024, 9, 3),   // 3 октября 2024
      new Date(2024, 9, 7),   // 7 октября 2024
      new Date(2024, 9, 8),   // 8 октября 2024
      new Date(2024, 9, 10),  // 10 октября 2024
      new Date(2024, 9, 14),  // 14 октября 2024
      new Date(2024, 9, 15),  // 15 октября 2024
      new Date(2024, 9, 17),  // 17 октября 2024
      new Date(2024, 9, 21),  // 21 октября 2024
      new Date(2024, 9, 22),  // 22 октября 2024
      new Date(2024, 9, 24),  // 24 октября 2024
      new Date(2024, 9, 28),  // 28 октября 2024
    ];

    // Combine real data with test data, remove duplicates
    const allDates = [...realWorkingDays, ...testDates];
    const uniqueDates = allDates.filter((date, index, self) => 
      index === self.findIndex(d => isSameDay(d, date))
    );

    return uniqueDates.sort((a, b) => a.getTime() - b.getTime());
  };

  const workingDays = getWorkingDays();

  // Custom day content to highlight working days
  const customDayContent = (day: Date) => {
    const isWorkingDay = workingDays.some(workDay => isSameDay(workDay, day));
    
    return (
      <div className={`
        w-full h-full flex items-center justify-center text-sm
        ${isWorkingDay ? 'bg-primary text-primary-foreground rounded-md font-semibold' : ''}
      `}>
        {day.getDate()}
      </div>
    );
  };

  const getRoleConfig = (role: string) => {
    const roleConfigs: Record<string, { label: string; className: string }> = {
      'admin': { 
        label: 'Администратор', 
        className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      },
      'dispatcher': { 
        label: 'Диспетчер', 
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      },
      'edger': { 
        label: 'Кромление', 
        className: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      },
      'otk': { 
        label: 'ОТК', 
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      },
      'packer': { 
        label: 'Упаковщик', 
        className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      },
      'painter': { 
        label: 'Маляр', 
        className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
      },
      'grinder': { 
        label: 'Шлифовка', 
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      },
      'additive': { 
        label: 'Присадка', 
        className: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800'
      },
      'sawyer': { 
        label: 'Распил', 
        className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
      },
    };
    
    return roleConfigs[role] || { 
      label: role, 
      className: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
    };
  };

  const roleConfig = getRoleConfig(worker.role);

  const handleTaskClick = async (completedTask: any) => {
    try {
      // Загружаем задачу без джойнов (нет FK) и параллельно подтягиваем связанные данные
      const { data: taskRow, error: taskError } = await supabase
        .from('zadachi')
        .select('*')
        .eq('id_zadachi', completedTask.task_id)
        .maybeSingle();

      if (taskError) {
        console.error('Error fetching task:', taskError);
        throw taskError;
      }

      if (!taskRow) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Задача не найдена"
        });
        return;
      }

      // Параллельно получаем имя ответственного и название заказа (если есть ссылки)
      const [userRes, orderRes] = await Promise.all([
        taskRow.responsible_user_id
          ? supabase
              .from('users')
              .select('full_name')
              .eq('uuid_user', taskRow.responsible_user_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any),
        taskRow.zakaz_id
          ? supabase
              .from('zakazi')
              .select('title, client_name')
              .eq('id_zakaza', taskRow.zakaz_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null } as any)
      ]);

      if (userRes.error) console.warn('Failed to load user for task:', userRes.error);
      if (orderRes.error) console.warn('Failed to load order for task:', orderRes.error);

      const responsible_user_name = userRes.data?.full_name as string | undefined;
      const order_title = orderRes.data ? `${orderRes.data.title}${orderRes.data.client_name ? ` (${orderRes.data.client_name})` : ''}` : undefined;

      // Преобразуем данные в формат для TaskDetailsDialog
      const task = {
        id_zadachi: taskRow.id_zadachi,
        uuid_zadachi: taskRow.uuid_zadachi,
        title: taskRow.title,
        description: taskRow.description,
        status: taskRow.status,
        priority: taskRow.priority,
        due_date: taskRow.due_date,
        created_at: taskRow.created_at,
        completed_at: taskRow.completed_at,
        execution_time_seconds: taskRow.execution_time_seconds,
        responsible_user_name,
        responsible_user_id: taskRow.responsible_user_id,
        zakaz_id: taskRow.zakaz_id,
        salary: taskRow.salary,
        checklist_photo: taskRow.checklist_photo,
        order_title
      };

      setSelectedTask(task);
      setIsTaskDialogOpen(true);
    } catch (error) {
      console.error('Error loading task details:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить детали задачи"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Информация о сотруднике
          </DialogTitle>
          <DialogDescription>
            Подробная информация о сотруднике: контакты, роль и рабочие данные
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="p-6 animate-fade-in hover-scale">
              <div className="flex items-start gap-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-32 w-32 ring-2 ring-background shadow-lg">
                      <AvatarImage 
                        src={worker.avatar_url} 
                        alt={worker.full_name} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-3xl">
                        {worker.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online Status Indicator */}
                    <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-background ${
                      isWorkerOnline() ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  {/* Last Activity Info */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Последняя активность</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {worker.last_seen ? (() => {
                        const utcDate = parseISO(worker.last_seen);
                        const moscowDate = toZonedTime(utcDate, 'Europe/Moscow');
                        const match = format(moscowDate, 'yyyy-MM-dd HH:mm').match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
                        if (!match) return worker.last_seen;
                        const [, year, month, day, hour, minute] = match;
                        const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
                        return `${day} ${months[parseInt(month) - 1]} ${year}, ${hour}:${minute}`;
                      })() : 'Нет данных'}
                    </span>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {worker.full_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${roleConfig.className} px-3 py-1 text-xs`}>
                        <User className="h-3 w-3 mr-1" />
                        {roleConfig.label}
                      </Badge>
                      <Badge className={`px-3 py-1 text-xs ${
                        getWorkerStatus() === 'online' 
                          ? 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                          : 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                      }`}>
                        {getWorkerStatus() === 'online' ? 'Онлайн' : 'Офлайн'}
                      </Badge>
                    </div>
                  </div>

                  {/* Salary - Prominently Displayed */}
                  {worker.salary && (
                    <div className="py-3">
                      <div className="flex items-baseline gap-2">
                        <Coins className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Зарплата</p>
                          <p className="text-4xl font-bold text-primary">
                            {Number(worker.salary).toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-border/50" />

                  {/* Compact Contact Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate text-xs">{worker.email}</span>
                    </div>
                    
                    {worker.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{worker.phone}</span>
                      </div>
                    )}
                  </div>

                  {worker.current_task && (
                    <div className="p-2.5 rounded-lg bg-primary/5 border-l-2 border-primary">
                      <div className="flex items-start gap-2">
                        <Briefcase className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-primary">Текущая задача</p>
                          <p className="text-xs text-muted-foreground">{worker.current_task}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Рабочая информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Рабочая информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {worker.salary && (
                <div className="flex items-center gap-3">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Зарплата:</span>
                  <span>{Number(worker.salary).toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              
              {worker.current_task && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Текущая задача:</span>
                    <p className="text-sm text-muted-foreground mt-1">{worker.current_task}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Последняя активность:</span>
                <span>
                  {worker.last_seen ? (() => {
                    const utcDate = parseISO(worker.last_seen);
                    const moscowDate = toZonedTime(utcDate, 'Europe/Moscow');
                    const match = format(moscowDate, 'yyyy-MM-dd HH:mm').match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
                    if (!match) return worker.last_seen;
                    const [, year, month, day, hour, minute] = match;
                    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                    return `${day} ${months[parseInt(month) - 1]} ${year}, ${hour}:${minute}`;
                  })() : 'Нет данных'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* График работы */}
          <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        График работы
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-sm px-3 py-1 font-medium bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          {workingDays.length} рабочих дней
                        </Badge>
                        <Badge className="text-sm px-3 py-1 font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          {worker.completed_tasks?.length || 0} {worker.role === 'dispatcher' ? 'проверено' : 'выполнено'} задач
                        </Badge>
                      </div>
                    </div>
                    {isCalendarOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Отмеченные дни показывают когда сотрудник выполнял задачи
                    </p>
                    <div className="flex justify-center">
                      <Calendar
                        mode="multiple"
                        selected={workingDays}
                        className="rounded-md border pointer-events-auto"
                        components={{
                          DayContent: ({ date }) => customDayContent(date)
                        }}
                        disabled={false}
                        defaultMonth={new Date(2024, 8)} // Показать сентябрь 2024 по умолчанию
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary rounded-md"></div>
                        <span className="text-muted-foreground">Рабочие дни ({workingDays.length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-muted-foreground rounded-md"></div>
                        <span className="text-muted-foreground">Выходные</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Статистика работы:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Всего рабочих дней:</span>
                          <div className="font-semibold">{workingDays.length}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{worker.role === 'dispatcher' ? 'Проверено' : 'Выполнено'} задач:</span>
                          <div className="font-semibold">{worker.completed_tasks?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* История выполненных/проверенных задач */}
          {worker.completed_tasks && worker.completed_tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {worker.role === 'dispatcher' ? 'История проверенных задач' : 'История выполненных задач'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(worker.completed_tasks || [])
                    .slice()
                    .sort((a, b) => {
                      // Сортировка по дате завершения (новые сверху)
                      if (a.completed_date && b.completed_date) {
                        return new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime();
                      }
                      // Если нет даты, сортируем по ID задачи (новые сверху)
                      return (b.task_id || 0) - (a.task_id || 0);
                    })
                    .map((task, index) => (
                    <div 
                      key={`${task.task_id}-${index}`} 
                      className="bg-card border border-card-border rounded-lg p-6 micro-lift hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                              Задача №{task.task_id} - {task.task_title || `Задача без названия`}
                            </span>
                          </div>
                          
                          {task.order_title && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <Briefcase className="h-4 w-4" />
                              <span className="font-body text-base">Заказ: {task.order_title}</span>
                            </div>
                          )}
                          
                          {task.execution_time_seconds && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-body text-sm">
                                Время выполнения: {formatExecutionTime(task.execution_time_seconds)}
                              </span>
                            </div>
                          )}
                          
                          {task.completed_date && (
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <CalendarIcon className="h-4 w-4" />
                              <span className="font-body text-sm">
                                Дата начисления: {format(new Date(task.completed_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-4 space-y-2">
                          <div className="space-y-2">
                            <Badge className="bg-success/10 text-success border-success/20 font-display font-semibold text-lg px-4 py-2">
                              +{Number(task.payment).toLocaleString('ru-RU')} ₽
                            </Badge>
                            {task.has_penalty && (
                              <Badge variant="destructive" className="block text-xs">
                                Оплата со штрафом 10%
                              </Badge>
                            )}
                            {task.is_review && (
                              <Badge className="block text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200">
                                Вознаграждение за проверку
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      <TaskDetailsDialog
        task={selectedTask}
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onTaskUpdated={() => {
          // Можно добавить обновление данных работника если нужно
        }}
      />
    </Dialog>
  );
};