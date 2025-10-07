import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/FileUpload';
import { useOrderAttachments } from '@/hooks/useOrderAttachments';
import { Separator } from '@/components/ui/separator';

const orderSchema = z.object({
  title: z.string().min(1, 'Название заказа обязательно').max(100, 'Максимум 100 символов'),
  client_name: z.string().min(1, 'Имя клиента обязательно').max(100, 'Максимум 100 символов'),
  client_phone: z.string().optional(),
  client_email: z.string().email('Неверный формат email').optional().or(z.literal('')),
  description: z.string().optional(),
  total_amount: z.string().optional(),
  due_date: z.date().optional(),
  responsible_user: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrderDialog({ open, onOpenChange }: CreateOrderDialogProps) {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { uploadFiles, isUploading } = useOrderAttachments();

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

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      title: '',
      client_name: '',
      client_phone: '',
      client_email: '',
      description: '',
      total_amount: '',
      responsible_user: '',
    },
  });

  const createOrder = useMutation({
    mutationFn: async (data: OrderFormData) => {
      // Generate a unique id_zakaza
      const id_zakaza = Math.floor(Math.random() * 1000000);
      
      const orderData = {
        id_zakaza,
        title: data.title,
        client_name: data.client_name,
        client_phone: isAdmin ? (data.client_phone || null) : null,
        client_email: isAdmin ? (data.client_email || null) : null,
        description: data.description || null,
        total_amount: data.total_amount ? parseFloat(data.total_amount) : 0,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        status: 'new',
      };

      const { data: result, error } = await supabase
        .from('zakazi')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: async (result) => {
      setCreatedOrderId(result.uuid_zakaza);
      
      // Upload files if any were selected
      if (selectedFiles.length > 0) {
        try {
          await uploadFiles({ files: selectedFiles, orderId: result.uuid_zakaza });
        } catch (error) {
          console.error('Error uploading files:', error);
          toast({
            title: 'Частичная ошибка',
            description: 'Заказ создан, но не все файлы загружены',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Заказ создан',
        description: 'Новый заказ успешно добавлен в систему',
      });
      queryClient.invalidateQueries({ queryKey: ['zakazi'] });
      queryClient.invalidateQueries({ queryKey: ['zakazi-kanban'] });
      form.reset();
      setSelectedFiles([]);
      setCreatedOrderId(null);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating order:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать заказ. Попробуйте еще раз.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      await createOrder.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async (files: File[]) => {
    // Files will be uploaded after order creation
    return Promise.resolve();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display text-xl font-bold">
            Создать новый заказ
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о новом заказе
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название заказа *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите название заказа" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя клиента *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите имя клиента" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact fields only for admins */}
            {isAdmin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="total_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Сумма</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="client_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Non-admin users only see total amount */}
            {!isAdmin && (
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сумма</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок выполнения</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "d MMMM yyyy", { locale: ru })
                          ) : (
                            <span>Выберите дату</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsible_user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ответственный</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ответственного" />
                      </SelectTrigger>
                    </FormControl>
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
                      placeholder="Дополнительная информация о заказе"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-6" />
            
            {/* File Upload Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Прикрепить файлы
              </h3>
              <FileUpload
                onFilesSelected={handleFilesSelected}
                onUpload={handleUpload}
                maxFiles={5}
                maxFileSize={10}
                disabled={isSubmitting || isUploading}
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? 'Создание...' : isUploading ? 'Загрузка файлов...' : 'Создать заказ'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}