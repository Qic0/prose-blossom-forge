import React from 'react';
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
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Briefcase,
  User,
  CheckCircle,
  FileText,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface TaskDetails {
  task_id: number;
  payment: number;
  task_title?: string;
  order_title?: string;
  completed_date?: string;
  execution_time_seconds?: number;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog = ({ open, onOpenChange }: UserProfileDialogProps) => {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [completedTasksDetails, setCompletedTasksDetails] = useState<TaskDetails[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user details and completed tasks when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchUserDetails();
    }
  }, [open, user]);

  const fetchUserDetails = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch complete user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('uuid_user', user.id)
        .single();

      setUserDetails(userProfile);

      // Fetch details for completed tasks if they exist
      if (userProfile?.completed_tasks?.length > 0) {
        const taskIds = userProfile.completed_tasks.map((task: any) => task.task_id);
        
        const { data: taskDetails } = await supabase
          .from('zadachi')
          .select(`
            id_zadachi,
            title,
            completed_at,
            execution_time_seconds,
            zakaz_id,
            zakazi!inner(title)
          `)
          .in('id_zadachi', taskIds);

        // Combine payment info with task details
        const enrichedTasks = userProfile.completed_tasks.map((task: any) => {
          const details = taskDetails?.find((detail: any) => detail.id_zadachi === task.task_id);
          return {
            task_id: task.task_id,
            payment: task.payment,
            task_title: details?.title,
            order_title: details?.zakazi?.title,
            completed_date: details?.completed_at,
            execution_time_seconds: details?.execution_time_seconds
          };
        });

        setCompletedTasksDetails(enrichedTasks);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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

  const getRoleConfig = (role: string) => {
    const roleConfigs: Record<string, { label: string; className: string }> = {
      'admin': { 
        label: 'Администратор', 
        className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
      },
      'manager': { 
        label: 'Менеджер', 
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

  const roleConfig = getRoleConfig(userDetails?.role || user.role || 'employee');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Мой профиль
          </DialogTitle>
          <DialogDescription>
            Информация о вашем профиле и рабочих данных
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Основная информация */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userDetails?.avatar_url || user.avatar_url} alt={userDetails?.full_name || user.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold text-xl">
                    {(userDetails?.full_name || user.full_name)?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || user.email?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{userDetails?.full_name || user.full_name || user.email}</h3>
                  <Badge className={`mt-2 ${roleConfig.className}`}>
                    {roleConfig.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Контактная информация */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
            </CardContent>
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
              {userDetails?.salary && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Зарплата:</span>
                  <span>{Number(userDetails.salary).toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              
              {userDetails?.current_task && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <span className="font-medium">Текущая задача:</span>
                    <p className="text-sm text-muted-foreground mt-1">{userDetails.current_task}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Дата регистрации:</span>
                <span>
                  {format(new Date(user.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* История выполненных задач */}
          {!loading && completedTasksDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  История выполненных задач
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedTasksDetails
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
                    <div key={`${task.task_id}-${index}`} className="bg-card border border-card-border rounded-lg p-6 micro-lift hover:shadow-md transition-all duration-200">
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
                              <Calendar className="h-4 w-4" />
                              <span className="font-body text-sm">
                                Дата начисления: {format(new Date(task.completed_date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <Badge className="bg-success/10 text-success border-success/20 font-display font-semibold text-lg px-4 py-2">
                            +{Number(task.payment).toLocaleString('ru-RU')} ₽
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Загрузка истории задач...
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};