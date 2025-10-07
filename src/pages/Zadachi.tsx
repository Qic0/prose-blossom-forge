import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import TaskDetailsDialog from "@/components/TaskDetailsDialog";
import { useState } from "react";

const Zadachi = () => {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const { data: zadachi, isLoading, refetch } = useQuery({
    queryKey: ['zadachi'],
    queryFn: async () => {
      // Получаем задачи
      const { data: tasks, error: tasksError } = await supabase
        .from('zadachi')
        .select('*')
        .order('id_zadachi', { ascending: false });
      
      if (tasksError) throw tasksError;
      
      // Получаем заказы
      const { data: orders, error: ordersError } = await supabase
        .from('zakazi')
        .select('id_zakaza, title, client_name');
      
      if (ordersError) throw ordersError;
      
      // Получаем пользователей
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('uuid_user, full_name');
      
      if (usersError) throw usersError;
      
      // Создаем карту пользователей и заказов
      const usersMap = new Map(users?.map(user => [user.uuid_user, user.full_name]) || []);
      const ordersMap = new Map(orders?.map(order => [order.id_zakaza, order]) || []);
      
      // Обогащаем задачи данными о пользователях
      const enrichedTasks = tasks?.map(task => {
        const taskWithOrder = task as any;
        const order = taskWithOrder.zakaz_id ? ordersMap.get(taskWithOrder.zakaz_id) : null;
        return {
          ...task,
          responsible_user_name: task.responsible_user_id ? usersMap.get(task.responsible_user_id) : null,
          order_title: order ? `${order.title} (${order.client_name})` : null
        };
      }) || [];
      
      // Сортируем так, чтобы завершенные задачи были внизу
      const sortedTasks = enrichedTasks.sort((a, b) => {
        // Если одна задача завершена, а другая нет
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // Если обе задачи имеют одинаковый статус, сортируем по ID (новые сверху)
        return b.id_zadachi - a.id_zadachi;
      });
      
      return sortedTasks;
    },
  });

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleTaskDialogClose = () => {
    setIsTaskDialogOpen(false);
    setSelectedTask(null);
  };

  const columns = [
    { key: 'id_zadachi', header: 'ID' },
    { key: 'title', header: 'Задача' },
    { 
      key: 'order_title', 
      header: 'Заказ',
      render: (value: any) => value || '—'
    },
    { 
      key: 'responsible_user_name', 
      header: 'Ответственный',
      render: (value: any) => value || '—'
    },
    { key: 'status', header: 'Статус' },
    { key: 'priority', header: 'Приоритет' },
    { key: 'salary', header: 'Зарплата' },
    { key: 'remaining_time', header: 'Осталось времени' },
    { key: 'due_date', header: 'Срок' },
    { key: 'created_at', header: 'Создана' },
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
            title="Задачи"
            description="Управление задачами по всем заказам"
            gradient={true}
            actions={[
              {
                label: "Фильтр",
                icon: Filter,
                onClick: () => {},
                variant: "outline",
                size: "sm"
              },
              {
                label: "Обновить",
                icon: RefreshCw,
                onClick: () => refetch(),
                variant: "outline",
                size: "sm"
              },
              {
                label: "Новая задача",
                icon: Plus,
                onClick: () => setCreateTaskOpen(true),
                variant: "default"
              }
            ]}
          />
          
          <motion.div variants={itemVariants}>
            <DataTable
              title="Все задачи"
              data={zadachi || []}
              columns={columns}
              loading={isLoading}
              emptyMessage="Задачи не найдены. Создайте первую задачу."
              onRowClick={handleTaskClick}
            />
          </motion.div>

          <TaskDetailsDialog
            task={selectedTask}
            isOpen={isTaskDialogOpen}
            onClose={handleTaskDialogClose}
            onTaskUpdated={() => refetch()}
          />
          
          <CreateTaskDialog 
            open={createTaskOpen}
            onOpenChange={setCreateTaskOpen}
          />
        </div>
      </motion.main>
    </div>
  );
};

export default Zadachi;