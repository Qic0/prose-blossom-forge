
import { useState } from "react";
import { motion } from "framer-motion";

import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { CreateOrderDialog } from "@/components/CreateOrderDialog";
import OrderDetailsDialog from "@/components/OrderDetailsDialog";
import { productionStages } from "@/hooks/useKanbanOrders";
import { useRealtimeZakazi } from "@/hooks/useRealtimeZakazi";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, format } from "date-fns";
import { ru } from "date-fns/locale";

// Компонент прогресс-бара для таблицы с улучшенными анимациями
const StatusProgressBar = ({ status }: { status: string }) => {
  const getStageFromStatus = (status: string): number => {
    switch (status) {
      case 'cutting': return 1;
      case 'edging': return 2;  
      case 'drilling': return 3;
      case 'sanding': return 4;
      case 'priming': return 5;
      case 'painting': return 6;
      default: return 1;
    }
  };

  const currentStage = getStageFromStatus(status || 'cutting');

  return (
    <div className="flex items-center justify-center space-x-1">
      {productionStages.map((stage, index) => {
        const isCompleted = stage.order < currentStage;
        const isCurrent = stage.order === currentStage;
        
        return (
          <motion.div
            key={stage.id}
            className={`w-2 h-2 rounded-sm transition-all duration-500 transform ${
              isCompleted 
                ? 'bg-green-500 shadow-md' 
                : isCurrent
                ? 'bg-orange-500 shadow-lg animate-pulse'
                : 'bg-muted/50 border border-border hover:bg-muted'
            }`}
            title={`${stage.name}${isCurrent ? ' (текущий этап)' : isCompleted ? ' (завершен)' : ''}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isCompleted ? 1.05 : isCurrent ? 1.1 : 1, 
              opacity: 1 
            }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.05,
              ease: "easeOut"
            }}
            whileHover={{ scale: 1.25 }}
            whileTap={{ scale: 0.9 }}
          />
        );
      })}
    </div>
  );
};

// Функция для вычисления оставшихся дней
const calculateRemainingDays = (dueDate: string, createdDate: string) => {
  if (!dueDate || !createdDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  const remainingDays = differenceInDays(due, now);
  
  return remainingDays;
};

const Zakazi = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const { isAdmin } = useAuth();
  
  // Используем унифицированный хук для real-time данных с синхронизацией с канбаном
  const { data: zakazi, isLoading, isFetching, refetch } = useRealtimeZakazi(
    ['zakazi-main'], 
    [['zakazi-kanban']] // Также обновляем канбан кэш
  );

  // Создаем колонки динамически в зависимости от роли пользователя
  const columns = [
    { key: 'id_zakaza', header: 'ID заказа' },
    { key: 'title', header: 'Название' },
    { key: 'client_name', header: 'Клиент' },
    // Показываем телефон только для админов
    ...(isAdmin ? [{ 
      key: 'client_phone', 
      header: 'Телефон', 
      render: (value: string) => value || '—' 
    }] : []),
    { key: 'status', header: 'Статус' },
    { 
      key: 'status', 
      header: 'Прогресс', 
      render: (status: string) => <StatusProgressBar status={status} />
    },
    { key: 'total_amount', header: 'Сумма' },
    { 
      key: 'due_date', 
      header: 'Срок выполнения',
      render: (dueDate: string, row: any) => {
        if (!dueDate) return '—';
        
        const formattedDate = format(new Date(dueDate), 'dd MMM', { locale: ru });
        const remainingDays = calculateRemainingDays(dueDate, row.created_at);
        
        if (remainingDays === null) return formattedDate;
        
        const daysText = remainingDays === 1 ? 'день' : 
                        remainingDays < 5 && remainingDays > 0 ? 'дня' : 'дней';
        
        const remainingText = remainingDays > 0 
          ? `осталось ${remainingDays} ${daysText}`
          : remainingDays === 0 
          ? 'сегодня'
          : `просрочено на ${Math.abs(remainingDays)} ${daysText}`;
        
        return (
          <div className="flex flex-col">
            <span>{formattedDate}</span>
            <span className={`text-xs ${
              remainingDays < 0 ? 'text-destructive' : 
              remainingDays === 0 ? 'text-warning' : 
              remainingDays <= 3 ? 'text-orange-500' : 
              'text-muted-foreground'
            }`}>
              ({remainingText})
            </span>
          </div>
        );
      }
    },
    { key: 'created_at', header: 'Создан' },
  ];

  const handleRowClick = (row: any) => {
    // Преобразуем данные заказа в формат, ожидаемый OrderDetailsDialog
    const order = {
      id: row.uuid_zakaza, // Используем правильный ID из базы данных
      title: row.title || 'Без названия',
      client: row.client_name || 'Неизвестен',
      description: row.description || '',
      value: row.total_amount || 0,
      priority: row.priority || 'medium',
      dueDate: row.due_date || null,
      assignee: row.assigned_to || 'Не назначен',
      status: row.status || 'cutting', // Добавляем статус для правильного отображения этапов
      currentStage: 1,
      vse_zadachi: row.vse_zadachi || []
    };
    setSelectedOrder(order);
    setShowOrderDetails(true);
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
            title="Заказы"
            description="Управление всеми заказами компании"
            gradient={true}
            actions={[
              {
                label: "Обновить",
                icon: RefreshCw,
                onClick: () => refetch(),
                variant: "outline",
                size: "sm"
              },
              {
                label: "Новый заказ",
                icon: Plus,
                onClick: () => setShowCreateDialog(true),
                variant: "default"
              }
            ]}
          />
          
          <motion.div variants={itemVariants}>
            <DataTable
              title="Все заказы"
              data={zakazi || []}
              columns={columns}
              loading={isLoading}
              isFetching={isFetching}
              emptyMessage="Заказы не найдены. Создайте первый заказ."
              onRowClick={handleRowClick}
            />
          </motion.div>
        </div>
        
        <CreateOrderDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
        
        {selectedOrder && (
          <OrderDetailsDialog 
            order={selectedOrder}
            isOpen={showOrderDetails}
            onClose={() => setShowOrderDetails(false)}
          />
        )}
      </motion.main>
    </div>
  );
};

export default Zakazi;