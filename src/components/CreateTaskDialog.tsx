import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Removed date-fns-tz import - now working with UTC directly

const taskSchema = z.object({
  title: z.string().trim().min(1, "Название задачи обязательно").max(255, "Название слишком длинное"),
  description: z.string().trim().max(1000, "Описание слишком длинное").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  responsible_user_id: z.string().min(1, "Выберите ответственного"),
  zakaz_id: z.string().min(1, "Выберите заказ"),
  due_date: z.string().min(1, "Укажите срок выполнения"),
  salary: z.string().min(1, "Укажите зарплату").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    "Зарплата должна быть положительным числом"
  ),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateTaskDialog = ({ trigger, open, onOpenChange }: CreateTaskDialogProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      responsible_user_id: "",
      zakaz_id: "",
      due_date: "",
      salary: "",
    },
  });

  // Fetch users for responsible selection
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('uuid_user, full_name, role')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders for order selection
  const { data: orders } = useQuery({
    queryKey: ['zakazi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zakazi')
        .select('id_zakaza, title, client_name')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      // Get the next ID
      const { data: lastTask } = await supabase
        .from('zadachi')
        .select('id_zadachi')
        .order('id_zadachi', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextId = lastTask ? lastTask.id_zadachi + 1 : 1;

      // Work with UTC directly
      const utcDateString = new Date(taskData.due_date).toISOString();

      // For manually created tasks, we don't set dispatcher_id/dispatcher_percentage
      // They will be set only for automatically created tasks via automation
      
      // Create the task with the zakaz_id foreign key
      const { data: newTask, error: taskError } = await supabase
        .from('zadachi')
        .insert([{
          id_zadachi: nextId,
          title: taskData.title,
          description: taskData.description || null,
          priority: taskData.priority,
          responsible_user_id: taskData.responsible_user_id,
          due_date: utcDateString,
          original_deadline: utcDateString,
          author_id: null,
          zakaz_id: parseInt(taskData.zakaz_id),
          salary: parseFloat(taskData.salary),
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      // Update the zakaz vse_zadachi array with the new task ID
      const zakazId = parseInt(taskData.zakaz_id);
      const { data: currentZakaz, error: zakazError } = await supabase
        .from('zakazi')
        .select('vse_zadachi')
        .eq('id_zakaza', zakazId)
        .single();

      if (zakazError) throw zakazError;

      // Add new task ID to the array
      const currentTasks = currentZakaz?.vse_zadachi || [];
      const updatedTasks = [...currentTasks, nextId];

      // Update zakaz with new task array
      const { error: updateError } = await supabase
        .from('zakazi')
        .update({ vse_zadachi: updatedTasks })
        .eq('id_zakaza', zakazId);

      if (updateError) throw updateError;

      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zadachi'] });
      queryClient.invalidateQueries({ queryKey: ['zakazi'] });
      queryClient.invalidateQueries({ queryKey: ['zakazi-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['orderTasks'] });
      toast({
        title: "Задача создана",
        description: "Новая задача успешно добавлена и привязана к заказу",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      });
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating task:', error);
      }
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button className="micro-lift">
            <Plus className="h-4 w-4 mr-2" />
            Новая задача
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-display text-xl font-bold">
            Создать новую задачу
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название задачи *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Введите название задачи"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Введите описание задачи"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zakaz_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заказ *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите заказ" />
                      </SelectTrigger>
                      <SelectContent>
                        {orders?.map((order) => (
                          <SelectItem key={order.id_zakaza} value={order.id_zakaza.toString()}>
                            {order.title} - {order.client_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Приоритет</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите приоритет" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                        <SelectItem value="urgent">Срочно</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="responsible_user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ответственный *</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ответственного" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((user) => {
                          const roleLabels: Record<string, string> = {
                            'admin': 'Администратор',
                            'manager': 'Менеджер',
                            'edger': 'Кромление',
                            'otk': 'ОТК',
                            'packer': 'Упаковщик',
                            'painter': 'Маляр',
                            'grinder': 'Шлифовка',
                            'additive': 'Присадка',
                            'sawyer': 'Распил',
                          };
                          
                          return (
                            <SelectItem key={user.uuid_user} value={user.uuid_user}>
                              {user.full_name} ({roleLabels[user.role] || user.role})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Зарплата *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Введите размер зарплаты"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок выполнения *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Создание..." : "Создать задачу"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};