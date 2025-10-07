import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Этапы производства
export const productionStages = [
  { id: 'cutting', name: 'Распил', order: 1 },
  { id: 'edging', name: 'Кромление', order: 2 },
  { id: 'drilling', name: 'Присадка', order: 3 },
  { id: 'sanding', name: 'Шлифовка', order: 4 },
  { id: 'priming', name: 'Грунт', order: 5 },
  { id: 'painting', name: 'Покраска', order: 6 }
];

export type KanbanOrder = {
  id: string;
  numericId: number; // 6-значный числовой ID для отображения
  title: string;
  client: string;
  value: number;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
  description?: string;
  createdDate: string;
  phone?: string;
  email?: string;
  company?: string;
  source?: string;
  comments?: string[];
  status: string;
  currentStage: number; // Текущий этап производства
  vse_zadachi?: number[]; // Массив ID связанных задач
  tasks: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    completed: boolean;
  }>;
};

export type ColumnType = 'cutting' | 'edging' | 'drilling' | 'sanding' | 'priming' | 'painting';

export const useKanbanOrders = () => {
  const queryClient = useQueryClient();

  // Используем унифицированный хук для zakazi данных
  const { data: zakaziData = [], isLoading: zakaziLoading, isInitialLoading: zakaziInitialLoading } = useQuery({
    queryKey: ['zakazi-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zakazi')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Увеличиваем staleTime для консистентности
    gcTime: 10 * 60 * 1000, // Увеличиваем gcTime
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: [], // Заменяем keepPreviousData на placeholderData
  });

  const { data: zadachiData = [], isLoading: zadachiLoading } = useQuery({
    queryKey: ['zadachi-for-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zadachi')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes для канбана
    gcTime: 5 * 60 * 1000, // 5 minutes  
    refetchOnWindowFocus: false,
  });

  const isLoading = zakaziInitialLoading;

  // Transform zakazi data to kanban format
  const transformZakaziToKanbanOrder = (zakaz: Tables<'zakazi'>): KanbanOrder => {
    // Find tasks for this order
    const orderTasks = zadachiData
      .filter(task => task.zakaz_id === zakaz.id_zakaza)
      .map(task => ({
        id: task.uuid_zadachi,
        title: task.title,
        status: task.status as 'pending' | 'in_progress' | 'completed',
        completed: task.status === 'completed'
      }));

    // Определяем текущий этап на основе статуса заказа
    const getStageFromStatus = (status: string): number => {
      switch (status) {
        case 'cutting': return 1;
        case 'edging': return 2;
        case 'drilling': return 3;
        case 'sanding': return 4;
        case 'priming': return 5;
        case 'painting': return 6;
        default: return 1; // По умолчанию - первый этап
      }
    };

    return {
      id: zakaz.uuid_zakaza,
      numericId: zakaz.id_zakaza,
      title: zakaz.title,
      client: zakaz.client_name,
      value: zakaz.total_amount || 0,
      priority: 'medium', // Default priority, можно добавить в БД позже
      assignee: 'Не назначен', // Default assignee, можно добавить в БД позже
      dueDate: zakaz.due_date || '',
      description: zakaz.description || '',
      createdDate: zakaz.created_at || '',
      phone: zakaz.client_phone || '', // Will be null for non-admins, handled gracefully
      email: zakaz.client_email || '', // Will be null for non-admins, handled gracefully
      company: zakaz.client_name,
      source: 'База данных',
      comments: [],
      status: zakaz.status || 'cutting',
      currentStage: getStageFromStatus(zakaz.status || 'cutting'),
      vse_zadachi: zakaz.vse_zadachi || [],
      tasks: orderTasks
    };
  };

  // Group orders by production stage
  const groupOrdersByStage = (orders: KanbanOrder[]) => {
    const grouped: Record<ColumnType, KanbanOrder[]> = {
      cutting: [],
      edging: [],
      drilling: [],
      sanding: [],
      priming: [],
      painting: []
    };

    orders.forEach(order => {
      const stageId = order.status as ColumnType;
      if (grouped[stageId]) {
        grouped[stageId].push(order);
      } else {
        // Если статус не найден, помещаем в первый этап
        grouped.cutting.push(order);
      }
    });

    return grouped;
  };

  const kanbanOrders = (zakaziData || []).map(transformZakaziToKanbanOrder);
  const ordersByStage = groupOrdersByStage(kanbanOrders);

  // Update order status in database with multi-cache sync
  const updateOrderStatus = async (orderId: string, newStatus: string, orderNumericId?: number, orderTitle?: string) => {
    console.log(`Updating order ${orderId} status to ${newStatus}`);
    
    // Optimistic update - update caches immediately for instant UI feedback
    const optimisticUpdate = (oldData: any) => {
      if (!oldData) return [];
      return oldData.map((item: any) => 
        item.uuid_zakaza === orderId ? { ...item, status: newStatus } : item
      );
    };

    // Update both kanban and main table caches optimistically
    queryClient.setQueryData(['zakazi-kanban'], optimisticUpdate);
    queryClient.setQueryData(['zakazi-main'], optimisticUpdate);

    try {
      const { error } = await supabase
        .from('zakazi')
        .update({ status: newStatus })
        .eq('uuid_zakaza', orderId);

      if (error) {
        console.error('Error updating order status:', error);
        
        // Rollback optimistic updates on error
        queryClient.invalidateQueries({ queryKey: ['zakazi-kanban'] });
        queryClient.invalidateQueries({ queryKey: ['zakazi-main'] });
        
        throw error;
      }

      console.log(`Successfully updated order ${orderId} status to ${newStatus}`);
      
      // Создаем автоматическую задачу для нового этапа если есть данные
      console.log('Checking automation for stage:', newStatus, 'Order data:', {orderNumericId, orderTitle});
      
      if (orderNumericId && orderTitle) {
        try {
          // Загружаем настройки автоматизации
          const { data: automationSettings, error: settingsError } = await supabase
            .from('automation_settings')
            .select('*')
            .eq('stage_id', newStatus)
            .single();

          console.log('Automation settings for stage:', newStatus, automationSettings, settingsError);
          console.log('Dispatcher data from settings:', {
            dispatcher_id: automationSettings?.dispatcher_id,
            dispatcher_percentage: automationSettings?.dispatcher_percentage
          });

          if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Error loading automation settings:', settingsError);
            return;
          }

          if (automationSettings) {
            if (!automationSettings.responsible_user_id) {
              console.log(`Ответственный не назначен для этапа: ${newStatus}`);
              return;
            }

            // Заменяем плейсхолдеры в шаблонах
            const taskTitle = automationSettings.task_title_template.replace(/#{order_id}/g, orderNumericId.toString());
            const taskDescription = automationSettings.task_description_template.replace(/#{order_id}/g, orderNumericId.toString()) + ` (Заказ: ${orderTitle})`;

            // Вычисляем дату выполнения
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (automationSettings.duration_days || 1));

            // Получаем максимальный id_zadachi для инкремента
            const { data: maxIdData } = await supabase
              .from('zadachi')
              .select('id_zadachi')
              .order('id_zadachi', { ascending: false })
              .limit(1);

            const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id_zadachi + 1 : 1;

            console.log('Creating automatic task:', {
              taskTitle,
              taskDescription,
              responsible_user_id: automationSettings.responsible_user_id,
              dispatcher_id: automationSettings.dispatcher_id ?? automationSettings.responsible_user_id,
              dispatcher_percentage: automationSettings.dispatcher_percentage ?? 0,
              zakaz_id: orderNumericId,
              due_date: dueDate.toISOString(),
              salary: automationSettings.payment_amount
            });

            // Создаем задачу
            const { data: createdTask, error: taskError } = await supabase
              .from('zadachi')
              .insert({
                id_zadachi: nextId,
                title: taskTitle,
                description: taskDescription,
                responsible_user_id: automationSettings.responsible_user_id,
                dispatcher_id: automationSettings.dispatcher_id ?? automationSettings.responsible_user_id,
                dispatcher_percentage: automationSettings.dispatcher_percentage ?? 0,
                zakaz_id: orderNumericId,
                due_date: dueDate.toISOString(),
                salary: automationSettings.payment_amount || 0,
                priority: 'medium',
                status: 'in_progress'
              })
              .select()
              .single();

            if (taskError) {
              console.error('Error creating automatic task:', taskError);
            } else {
              console.log(`Автоматически создана задача для этапа ${newStatus}:`, createdTask);
            }
          } else {
            console.log(`Настройки автоматизации не найдены для этапа: ${newStatus}`);
          }
        } catch (autoTaskError) {
          console.error('Ошибка при создании автоматической задачи:', autoTaskError);
        }
      } else {
        console.warn('Missing order data for automation:', {orderNumericId, orderTitle});
      }
      
      // Real-time subscription will handle the final update, but we can also 
      // invalidate as backup to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['zakazi-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['zakazi-main'] });
      
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  // Set up real-time subscription for zadachi only (zakazi is handled by unified hook)
  useEffect(() => {
    const channel = supabase
      .channel('kanban-zadachi-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zadachi'
        },
        (payload) => {
          console.log('Kanban zadachi table changed:', payload);
          // Обновляем только задачи
          queryClient.setQueryData(['zadachi-for-kanban'], (oldData: any) => {
            if (!oldData) return [];
            
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new, ...oldData];
              case 'UPDATE':
                return oldData.map((item: any) => 
                  item.uuid_zadachi === payload.new.uuid_zadachi ? payload.new : item
                );
              case 'DELETE':
                return oldData.filter((item: any) => 
                  item.uuid_zadachi !== payload.old.uuid_zadachi
                );
              default:
                return oldData;
            }
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up kanban zadachi channel');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    orders: ordersByStage,
    isLoading,
    updateOrderStatus
  };
};