import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Briefcase } from "lucide-react";
import { WorkerDetailsDialog } from "@/components/WorkerDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface WorkerProfileProps {
  user: {
    id: string;
    full_name?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
  };
  isOnline: boolean;
}

const WorkerProfile = ({ user, isOnline }: WorkerProfileProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Загружаем данные пользователя с completed_tasks
  const { data: enrichedUserData } = useQuery({
    queryKey: ['worker-details', user.id],
    queryFn: async () => {
      // Получаем данные пользователя с completed_tasks и salary
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('salary, completed_tasks, phone, last_seen')
        .eq('uuid_user', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      if (!userData?.completed_tasks || userData.completed_tasks.length === 0) {
        return {
          ...userData,
          completed_tasks: []
        };
      }

      // Получаем ID задач из completed_tasks
      const taskIds = userData.completed_tasks.map((task: any) => task.task_id);
      
      // Получаем детали задач с информацией о заказах
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

      if (tasksError) {
        console.error('Error fetching task details:', tasksError);
        return userData;
      }

      // Обогащаем completed_tasks названиями задач и заказов
      const enrichedCompletedTasks = userData.completed_tasks.map((completedTask: any) => {
        const taskDetails = tasks?.find(task => task.id_zadachi === completedTask.task_id);
        return {
          ...completedTask,
          task_title: taskDetails?.title,
          order_title: taskDetails?.zakazi?.title,
          completed_date: taskDetails?.completed_at,
          execution_time_seconds: taskDetails?.execution_time_seconds
        };
      });

      return {
        ...userData,
        completed_tasks: enrichedCompletedTasks
      };
    },
    enabled: dialogOpen && !!user.id
  });

  // Адаптируем данные пользователя к формату Worker
  const workerData = {
    uuid_user: user.id,
    full_name: user.full_name || 'Сотрудник',
    email: user.email || '',
    phone: enrichedUserData?.phone,
    role: user.role || 'worker',
    avatar_url: user.avatar_url,
    salary: enrichedUserData?.salary,
    created_at: new Date().toISOString(),
    last_online: enrichedUserData?.last_seen,
    completed_tasks: enrichedUserData?.completed_tasks || []
  };

  return (
    <>
      <Card className="border-2 cursor-pointer hover:shadow-lg transition-all duration-200" onClick={() => setDialogOpen(true)}>
        <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Аватар с индикатором онлайн */}
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user.avatar_url} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-primary/10">
                {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`
                absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-background
                ${isOnline ? 'bg-green-500' : 'bg-gray-400'}
              `}
            />
          </div>

          {/* Имя */}
          <div>
            <h3 className="text-2xl font-bold mb-1">
              {user.full_name || 'Сотрудник'}
            </h3>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              <span className="capitalize text-sm">
                {user.role || 'Работник'}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <WorkerDetailsDialog
      worker={workerData}
      open={dialogOpen}
      onOpenChange={setDialogOpen}
    />
    </>
  );
};

export default WorkerProfile;
