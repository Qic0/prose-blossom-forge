import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { DataTable } from "@/components/DataTable";
import { WorkerDetailsDialog } from "@/components/WorkerDetailsDialog";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const Workers = () => {
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { onlineUsers, isUserOnline, getUserStatus, refreshOnlineUsers } = useAuth();

  const { data: workers, isLoading, refetch } = useQuery({
    queryKey: ['workers', 'users', 'last-online'],
    queryFn: async () => {
      // First, get all users with their completed_tasks
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) throw usersError;
      if (!users) return [];

      // For each user, fetch task and order details
      const enrichedUsers = await Promise.all(
        users.map(async (user) => {
          // Для обычных работников - загружаем completed_tasks
          let enrichedCompletedTasks = [];
          if (user.completed_tasks && user.completed_tasks.length > 0) {
            const taskIds = user.completed_tasks.map((task: any) => task.task_id);
            
            const { data: tasks, error: tasksError } = await supabase
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

            if (!tasksError && tasks) {
              enrichedCompletedTasks = user.completed_tasks.map((completedTask: any) => {
                const taskDetails = tasks?.find(task => task.id_zadachi === completedTask.task_id);
                return {
                  ...completedTask,
                  task_title: taskDetails?.title,
                  order_title: taskDetails?.zakazi?.title,
                  completed_date: taskDetails?.completed_at,
                  execution_time_seconds: taskDetails?.execution_time_seconds
                };
              });
            }
          }

          // Для диспетчеров (dispatcher) - загружаем проверенные задачи в completed_tasks
          if (user.role === 'dispatcher') {
            const { data: dispatcherTasks, error: dispatcherError } = await supabase
              .from('zadachi')
              .select(`
                id_zadachi,
                title,
                completed_at,
                execution_time_seconds,
                dispatcher_reward_amount,
                dispatcher_reward_applied_at,
                zakaz_id,
                zakazi(title)
              `)
              .eq('dispatcher_id', user.uuid_user)
              .eq('dispatcher_reward_applied', true)
              .order('dispatcher_reward_applied_at', { ascending: false });

            if (!dispatcherError && dispatcherTasks) {
              enrichedCompletedTasks = dispatcherTasks.map((task: any) => ({
                task_id: task.id_zadachi,
                payment: task.dispatcher_reward_amount || 0,
                has_penalty: false,
                task_title: task.title,
                order_title: task.zakazi?.title,
                completed_date: task.dispatcher_reward_applied_at || task.completed_at,
                execution_time_seconds: task.execution_time_seconds,
                is_review: true
              }));
            }
          }

          return {
            ...user,
            completed_tasks: enrichedCompletedTasks
          };
        })
      );

      return enrichedUsers;
    },
  });

  // Отладка для workers и онлайн статуса  
  useEffect(() => {
    if (workers && workers.length > 0) {
      console.log('Workers - First worker UUID:', workers[0]?.uuid_user);
      console.log('Workers - All worker UUIDs:', workers.map(w => w.uuid_user));
      workers.forEach(worker => {
        const isOnline = isUserOnline(worker.uuid_user);
        const status = getUserStatus(worker.uuid_user);
        console.log(`Worker ${worker.full_name} (${worker.uuid_user}): online=${isOnline}, status=${status}`);
      });
    }
  }, [workers, onlineUsers, isUserOnline, getUserStatus]);

  const columns = [
    { 
      key: 'avatar', 
      header: 'Фото',
      render: (value: string, row: any) => (
        <div className="relative">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={row.avatar_url} alt={row.full_name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-display font-semibold">
              {row.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
            </AvatarFallback>
          </Avatar>
          {/* Онлайн индикатор */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
            (() => {
              const lastSeen = row.last_seen ? new Date(row.last_seen).getTime() : 0;
              const now = new Date().getTime();
              const diffInMinutes = (now - lastSeen) / (1000 * 60);
              return diffInMinutes > 1 ? 'bg-gray-400' : (isUserOnline(row.uuid_user) ? 'bg-green-500' : 'bg-gray-400');
            })()
          }`} />
        </div>
      )
    },
    { key: 'full_name', header: 'ФИО' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Телефон', render: (value: string) => value || '—' },
    {
      key: 'online_status',
      header: 'Статус',
      render: (value: string, row: any) => {
        // Проверяем, была ли активность более минуты назад
        const lastSeen = row.last_seen ? new Date(row.last_seen).getTime() : 0;
        const now = new Date().getTime();
        const diffInMinutes = (now - lastSeen) / (1000 * 60);
        
        // Если прошло более минуты с последней активности - офлайн
        let status: 'online' | 'away' | 'offline';
        if (diffInMinutes > 1) {
          status = 'offline';
        } else {
          // Иначе используем статус из базы или контекста
          const dbStatus = row.status;
          const contextStatus = getUserStatus(row.uuid_user);
          status = dbStatus === 'online' ? 'online' : contextStatus;
        }
        
        const statusConfig = {
          online: { label: 'Онлайн', className: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' },
          away: { label: 'Отошел', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' },
          offline: { label: 'Офлайн', className: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800' }
        };
        
        const config = statusConfig[status];
        
        return (
          <Badge className={`${config.className} transition-all duration-300`}>
            {config.label}
          </Badge>
        );
      }
    },
    { 
      key: 'role', 
      header: 'Роль',
      render: (value: string) => {
        const roleConfig: Record<string, { label: string; variant: string; className: string; hoverClassName: string }> = {
          'admin': { 
            label: 'Администратор', 
            variant: 'default', 
            className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
            hoverClassName: 'hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300'
          },
          'dispatcher': { 
            label: 'Диспетчер', 
            variant: 'secondary', 
            className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
            hoverClassName: 'hover:bg-blue-500/10 hover:text-blue-700 dark:hover:text-blue-300'
          },
          'edger': { 
            label: 'Кромление', 
            variant: 'outline', 
            className: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
            hoverClassName: 'hover:bg-green-500/10 hover:text-green-700 dark:hover:text-green-300'
          },
          'otk': { 
            label: 'ОТК', 
            variant: 'outline', 
            className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
            hoverClassName: 'hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300'
          },
          'packer': { 
            label: 'Упаковщик', 
            variant: 'outline', 
            className: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
            hoverClassName: 'hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-300'
          },
          'painter': { 
            label: 'Маляр', 
            variant: 'outline', 
            className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
            hoverClassName: 'hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-cyan-300'
          },
          'grinder': { 
            label: 'Шлифовка', 
            variant: 'outline', 
            className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
            hoverClassName: 'hover:bg-yellow-500/10 hover:text-yellow-700 dark:hover:text-yellow-300'
          },
          'additive': { 
            label: 'Присадка', 
            variant: 'outline', 
            className: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
            hoverClassName: 'hover:bg-pink-500/10 hover:text-pink-700 dark:hover:text-pink-300'
          },
          'sawyer': { 
            label: 'Распил', 
            variant: 'outline', 
            className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
            hoverClassName: 'hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300'
          },
        };
        
        const config = roleConfig[value] || { 
          label: value, 
          variant: 'outline', 
          className: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
          hoverClassName: 'hover:bg-gray-500/10 hover:text-gray-700 dark:hover:text-gray-300'
        };
        
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Badge className={`${config.className} ${config.hoverClassName} transition-all duration-300`}>
              {config.label}
            </Badge>
          </motion.div>
        );
      }
    },
    { key: 'salary', header: 'Зарплата' },
    { 
      key: 'last_seen', 
      header: 'Последняя активность',
      render: (value: string) => {
        if (!value) return null;
        const date = new Date(value);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) return null;
        
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        
        if (diffInSeconds < 60) return `${diffInSeconds} сек назад`;
        if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`;
        
        const diffInDays = Math.floor(diffInMinutes / 1440);
        if (diffInDays === 1) return 'Вчера';
        if (diffInDays < 7) return `${diffInDays} дн назад`;
        
        return date.toLocaleDateString('ru-RU', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    },
  ];

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
            title="Сотрудники"
            description="Управление командой и персоналом"
            gradient={true}
            actions={[
              {
                label: "Обновить",
                icon: RefreshCw,
                onClick: async () => {
                  await refetch();
                  await refreshOnlineUsers();
                },
                variant: "outline",
                size: "sm"
              },
              {
                label: "Пригласить",
                icon: UserPlus,
                onClick: () => {},
                variant: "default"
              }
            ]}
          />
          
          <motion.div 
            variants={itemVariants}
          >
            <DataTable
              title="Команда"
              data={workers?.sort((a, b) => {
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return 0;
              }) || []}
              columns={columns}
              loading={isLoading}
              emptyMessage="Сотрудники не найдены."
              onRowClick={(worker) => {
                setSelectedWorker(worker);
                setDialogOpen(true);
              }}
            />
          </motion.div>

          <WorkerDetailsDialog
            worker={selectedWorker}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </div>
      </motion.main>
    </div>
  );
};

export default Workers;