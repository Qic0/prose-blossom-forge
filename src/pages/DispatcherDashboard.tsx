import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, AlertTriangle, User, Building } from 'lucide-react';
import DispatcherReviewDialog from '@/components/DispatcherReviewDialog';

const DispatcherDashboard = () => {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['dispatcher-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Получаем задачи на проверке для текущего диспетчера
      const { data: tasksData, error: tasksError } = await supabase
        .from('zadachi')
        .select('*')
        .eq('dispatcher_id', user.id)
        .eq('status', 'under_review')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Получаем данные о работниках
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('uuid_user, full_name');

      if (usersError) throw usersError;

      // Получаем данные о заказах
      const { data: orders, error: ordersError } = await supabase
        .from('zakazi')
        .select('id_zakaza, title, client_name');

      if (ordersError) throw ordersError;

      const usersMap = new Map(users?.map(u => [u.uuid_user, u.full_name]) || []);
      const ordersMap = new Map(orders?.map(o => [o.id_zakaza, o]) || []);

      return tasksData?.map(task => ({
        ...task,
        responsible_user_name: task.responsible_user_id ? usersMap.get(task.responsible_user_id) : null,
        order_title: task.zakaz_id ? 
          (() => {
            const order = ordersMap.get(task.zakaz_id);
            return order ? `${order.title} (${order.client_name})` : null;
          })() : null
      })) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const overdueCount = tasks.filter(t => 
    t.original_deadline && new Date(t.original_deadline) < new Date()
  ).length;

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.main 
        className="pt-14"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto purposeful-space">
          <PageHeader
            title="Проверка задач"
            description="Задачи, ожидающие проверки диспетчера"
            gradient={true}
            actions={[
              {
                label: "Обновить",
                icon: RefreshCw,
                onClick: () => refetch(),
                variant: "outline",
                size: "sm"
              }
            ]}
          />

          {/* Статистика */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Всего на проверке
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{tasks.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Просрочено
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{overdueCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  В срок
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-status-done">{tasks.length - overdueCount}</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Список задач */}
          <motion.div variants={itemVariants}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    Нет задач на проверке
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task, index) => {
                  const isOverdue = task.original_deadline && new Date(task.original_deadline) < new Date();
                  const returnsCount = Array.isArray(task.review_returns) ? task.review_returns.length : 0;
                  
                  return (
                    <motion.div
                      key={task.uuid_zadachi}
                      variants={itemVariants}
                      custom={index}
                    >
                      <Card 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          isOverdue ? 'border-destructive border-2' : ''
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{task.title}</h3>
                                {isOverdue && (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Просрочено
                                  </Badge>
                                )}
                                {returnsCount > 0 && (
                                  <Badge variant="outline" className="gap-1">
                                    Возвратов: {returnsCount}
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                {task.order_title && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building className="w-4 h-4" />
                                    <span>{task.order_title}</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <User className="w-4 h-4" />
                                  <span>{task.responsible_user_name || '—'}</span>
                                </div>

                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  <span>Срок: {formatDate(task.original_deadline || task.due_date)}</span>
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task);
                              }}
                              size="sm"
                            >
                              Проверить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </motion.main>

      <DispatcherReviewDialog
        task={selectedTask}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={() => refetch()}
      />
    </div>
  );
};

export default DispatcherDashboard;
