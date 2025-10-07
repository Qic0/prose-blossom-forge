import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AutomationSetting = {
  id: string;
  stage_id: string;
  stage_name: string;
  responsible_user_id: string | null;
  dispatcher_id: string | null;
  dispatcher_percentage: number;
  task_title_template: string;
  task_description_template: string;
  payment_amount: number;
  duration_days: number;
  created_at: string;
  updated_at: string;
};

export const useAutomationSettings = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['automation-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_settings')
        .select('*')
        .order('stage_id');
      
      if (error) throw error;
      return data as AutomationSetting[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedSettings: AutomationSetting[]) => {
      const promises = updatedSettings.map(setting => 
        supabase
          .from('automation_settings')
          .update({
            responsible_user_id: setting.responsible_user_id,
            dispatcher_id: setting.dispatcher_id,
            dispatcher_percentage: setting.dispatcher_percentage,
            task_title_template: setting.task_title_template,
            task_description_template: setting.task_description_template,
            payment_amount: setting.payment_amount,
            duration_days: setting.duration_days,
          })
          .eq('id', setting.id)
      );

      const results = await Promise.all(promises);
      
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Ошибка обновления: ${errors[0].error?.message}`);
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] });
      toast.success('Настройки автоматизации успешно сохранены');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Error updating automation settings:', error);
      toast.error('Ошибка при сохранении настроек');
    },
  });

  const updateSettings = (updatedSettings: AutomationSetting[]) => {
    updateMutation.mutate(updatedSettings);
  };

  return {
    settings,
    isLoading,
    isEditing,
    setIsEditing,
    updateSettings,
    isUpdating: updateMutation.isPending,
  };
};