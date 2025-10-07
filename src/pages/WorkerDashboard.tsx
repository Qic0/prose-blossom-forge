import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, User, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// Working with UTC time directly
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import WorkerTaskCard from '@/components/worker/WorkerTaskCard';
import WorkerProfile from '@/components/worker/WorkerProfile';
import WorkerMetrics from '@/components/worker/WorkerMetrics';
import CompletedTasksList from '@/components/worker/CompletedTasksList';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
type Task = Database['public']['Tables']['zadachi']['Row'] & {
  zakazi?: {
    title: string;
    client_name: string;
  };
};

const WorkerDashboard = () => {
  const {
    user,
    isUserOnline
  } = useAuth();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<'all' | 'current' | 'completed'>('current');
  const [sortBy, setSortBy] = useState<'deadline' | 'salary'>('deadline');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Обновление времени каждую секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Получение задач работника с realtime обновлениями
  const {
    data: tasks = [],
    isLoading
  } = useQuery({
    queryKey: ['worker-tasks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data,
        error
      } = await supabase.from('zadachi').select(`
          *,
          zakazi(title, client_name)
        `).eq('responsible_user_id', user.id).order('due_date', {
        ascending: true
      });
      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      return data as Task[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000 // Обновление каждые 30 секунд
  });

  // Realtime подписка на изменения задач
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('worker-tasks-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'zadachi',
      filter: `responsible_user_id=eq.${user.id}`
    }, () => {
      queryClient.invalidateQueries({
        queryKey: ['worker-tasks', user.id]
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Получение данных пользователя
  const {
    data: userData
  } = useQuery({
    queryKey: ['worker-user-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const {
        data,
        error
      } = await supabase.from('users').select('salary, completed_tasks').eq('uuid_user', user.id).single();
      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id
  });

  // Фильтрация и сортировка задач
  const filteredAndSortedTasks = tasks.filter(task => {
    if (filterStatus === 'current') return task.status !== 'completed';
    if (filterStatus === 'completed') return task.status === 'completed';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'deadline') {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    } else {
      return (b.salary || 0) - (a.salary || 0);
    }
  });
  const currentTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Расчет метрик
  const metrics = {
    totalInProgressSum: currentTasks.reduce((sum, task) => sum + (task.salary || 0), 0),
    totalEarned: userData?.salary || 0,
    currentTasksCount: currentTasks.length,
    completedTodayCount: completedTasks.filter(task => {
      if (!task.completed_at) return false;
      const completedDate = new Date(task.completed_at);
      const today = new Date();
      return completedDate.toDateString() === today.toDateString();
    }).length
  };
  const sidebarContent = (
    <div className="space-y-6">
      {user && <WorkerProfile user={user} isOnline={isUserOnline(user.id)} />}
      <WorkerMetrics metrics={metrics} />
      <CompletedTasksList tasks={completedTasks} />
    </div>
  );

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>;
  }

  return <div className="min-h-screen bg-background pt-14">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Мобильная кнопка для открытия drawer */}
          {isMobile && (
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold flex-1 text-center">Мои задачи</h1>
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
              <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                  <DrawerTitle>Профиль и статистика</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4 pb-6">
                  {sidebarContent}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Левая колонка - список задач */}
          <div className="lg:col-span-2 space-y-4">
            {/* Список карточек задач */}
            <div className="space-y-3 sm:space-y-4">
              {filteredAndSortedTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg sm:text-xl">Нет задач для отображения</p>
                </div>
              ) : (
                filteredAndSortedTasks.map((task, index) => (
                  <WorkerTaskCard
                    key={task.uuid_zadachi}
                    task={task}
                    currentTime={currentTime}
                    onClick={() => setSelectedTask(task)}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>

          {/* Правая колонка - профиль и метрики (только desktop) */}
          {!isMobile && (
            <div className="hidden lg:block space-y-6">
              {sidebarContent}
            </div>
          )}
        </div>
      </div>

      {/* Диалог деталей задачи */}
      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask as any}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={() => {
            queryClient.invalidateQueries({
              queryKey: ['worker-tasks', user?.id]
            });
            queryClient.invalidateQueries({
              queryKey: ['worker-user-data', user?.id]
            });
          }}
        />
      )}
    </div>;
};
export default WorkerDashboard;