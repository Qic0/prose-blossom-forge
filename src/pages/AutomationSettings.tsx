import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, Loader2, Settings, Users, DollarSign, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAutomationSettings, AutomationSetting } from '@/hooks/useAutomationSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AutomationSettings = () => {
  const { settings, isLoading, isEditing, setIsEditing, updateSettings, isUpdating } = useAutomationSettings();
  const [localSettings, setLocalSettings] = useState<AutomationSetting[]>([]);

  // Загружаем список пользователей
  const { data: users = [] } = useQuery({
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

  // Синхронизируем локальные настройки с данными из хука
  React.useEffect(() => {
    if (settings && settings.length > 0) {
      setLocalSettings([...settings]);
    }
  }, [settings]);

  const handleEdit = () => {
    setLocalSettings([...settings]);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleCancel = () => {
    setLocalSettings([...settings]);
    setIsEditing(false);
  };

  const updateLocalSetting = (index: number, field: keyof AutomationSetting, value: any) => {
    const updated = [...localSettings];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSettings(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Загрузка настроек...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 pt-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Настройки автоматизации
            </h1>
            <p className="text-muted-foreground">
              Управление автоматическим созданием задач при переносе заказов между этапами
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <Button onClick={handleEdit} variant="outline" size="lg">
              <Edit3 className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button onClick={handleCancel} variant="outline" size="lg">
                Отмена
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isUpdating}
                size="lg"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Этапы производства</span>
            </CardTitle>
            <CardDescription>
              Настройте автоматическое создание задач для каждого этапа производства
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold text-foreground">Этап</th>
                    <th className="text-left p-4 font-semibold text-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Ответственный</span>
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Диспетчер</span>
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>% Диспетчера</span>
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground">Название задачи</th>
                    <th className="text-left p-4 font-semibold text-foreground">Описание</th>
                    <th className="text-left p-4 font-semibold text-foreground">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Оплата</span>
                      </div>
                    </th>
                    <th className="text-left p-4 font-semibold text-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Срок (дни)</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {localSettings.map((setting, index) => (
                    <motion.tr
                      key={setting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-foreground">
                          {setting.stage_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {setting.stage_id}
                        </div>
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Select
                            value={setting.responsible_user_id || 'unassigned'}
                            onValueChange={(value) => 
                              updateLocalSetting(index, 'responsible_user_id', value === 'unassigned' ? null : value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите ответственного" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Не назначен</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.uuid_user} value={user.uuid_user}>
                                  {user.full_name} ({user.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-foreground">
                            {setting.responsible_user_id 
                              ? users.find(u => u.uuid_user === setting.responsible_user_id)?.full_name || 'Пользователь не найден'
                              : 'Не назначен'
                            }
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Select
                            value={setting.dispatcher_id || 'unassigned'}
                            onValueChange={(value) => 
                              updateLocalSetting(index, 'dispatcher_id', value === 'unassigned' ? null : value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите диспетчера" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Не назначен</SelectItem>
                              {users.map((user) => (
                                <SelectItem key={user.uuid_user} value={user.uuid_user}>
                                  {user.full_name} ({user.role})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-foreground">
                            {setting.dispatcher_id 
                              ? users.find(u => u.uuid_user === setting.dispatcher_id)?.full_name || 'Пользователь не найден'
                              : 'Не назначен'
                            }
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={setting.dispatcher_percentage}
                            onChange={(e) => 
                              updateLocalSetting(index, 'dispatcher_percentage', Number(e.target.value))
                            }
                            placeholder="0"
                            className="w-20"
                          />
                        ) : (
                          <div className="text-sm text-foreground font-medium">
                            {setting.dispatcher_percentage}%
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Input
                            value={setting.task_title_template}
                            onChange={(e) => 
                              updateLocalSetting(index, 'task_title_template', e.target.value)
                            }
                            placeholder="Название задачи"
                            className="min-w-[200px]"
                          />
                        ) : (
                          <div className="text-sm text-foreground max-w-[200px] truncate" 
                               title={setting.task_title_template}>
                            {setting.task_title_template}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Textarea
                            value={setting.task_description_template}
                            onChange={(e) => 
                              updateLocalSetting(index, 'task_description_template', e.target.value)
                            }
                            placeholder="Описание задачи"
                            className="min-w-[250px] min-h-[60px]"
                            rows={2}
                          />
                        ) : (
                          <div className="text-sm text-foreground max-w-[250px] line-clamp-2" 
                               title={setting.task_description_template}>
                            {setting.task_description_template}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={setting.payment_amount}
                            onChange={(e) => 
                              updateLocalSetting(index, 'payment_amount', Number(e.target.value))
                            }
                            placeholder="0"
                            className="w-24"
                          />
                        ) : (
                          <div className="text-sm text-foreground font-medium">
                            {setting.payment_amount.toLocaleString()} ₽
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            value={setting.duration_days}
                            onChange={(e) => 
                              updateLocalSetting(index, 'duration_days', Number(e.target.value))
                            }
                            className="w-20"
                          />
                        ) : (
                          <div className="text-sm text-foreground">
                            {setting.duration_days}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-muted/30 rounded-lg p-4"
      >
        <div className="text-sm text-muted-foreground">
          <h3 className="font-semibold mb-2">Как это работает:</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li>При переносе заказа на новый этап автоматически создается задача</li>
            <li>Задача назначается выбранному ответственному работнику</li>
            <li>В название и описание подставляется номер заказа вместо #{`{order_id}`}</li>
            <li>Срок выполнения рассчитывается от текущей даты + указанное количество дней</li>
            <li>Оплата автоматически устанавливается согласно настройкам</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default AutomationSettings;