import { useState } from "react";
import { motion } from "framer-motion";
import KanbanColumn from "./KanbanColumn";
import { useKanbanOrders, type KanbanOrder, type ColumnType, productionStages } from "@/hooks/useKanbanOrders";

export type { KanbanOrder as Order, ColumnType };

const KanbanBoard = () => {
  const {
    orders,
    isLoading,
    updateOrderStatus
  } = useKanbanOrders();

  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);

  // Используем этапы производства для колонок
  const columns = productionStages.map(stage => ({
    id: stage.id as ColumnType,
    title: stage.name,
    count: orders[stage.id as ColumnType]?.length || 0
  }));

  const updateColumnTitle = (columnId: ColumnType, newTitle: string) => {
    // Заголовки этапов производства нельзя изменить
      if (process.env.NODE_ENV === 'development') {
        console.log('Production stage titles cannot be changed');
      }
  };
  const moveOrder = async (orderId: string, fromColumn: ColumnType, toColumn: ColumnType) => {
    try {
      // Находим заказ для получения дополнительных данных
      const order = orders[fromColumn]?.find(o => o.id === orderId);
      
      if (!order) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Order not found for automation task creation');
        }
        return;
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Moving order:', {orderId, fromColumn, toColumn, order: order.title, numericId: order.numericId});
      }
      
      await updateOrderStatus(
        orderId, 
        toColumn, 
        order.numericId, 
        order.title
      );
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update order status:', error);
      }
    }
  };
  const handleDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };
  const handleDragEnd = () => {
    setDraggedOrder(null);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, toColumn: ColumnType) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    const fromColumn = e.dataTransfer.getData('application/column') as ColumnType;
    if (fromColumn && fromColumn !== toColumn) {
      moveOrder(orderId, fromColumn, toColumn);
    }
    setDraggedOrder(null);
  };
  // Показываем загрузку только в самом начале, но всегда рендерим основную структуру
  const showLoadingSpinner = isLoading && Object.values(orders).every(columnOrders => columnOrders.length === 0);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div 
      className="kanban-container pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto">
        {showLoadingSpinner ? (
          <motion.div 
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.p 
              className="text-minimalist-muted text-lg max-w-2xl mx-auto mb-8 font-classical-sans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Загрузка заказов...
            </motion.p>
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div className="w-6 h-6 border-2 border-minimalist-accent/20 border-t-minimalist-accent rounded-full animate-spin" />
            </motion.div>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <motion.div 
              className="flex gap-3 min-w-max justify-center"
              variants={containerVariants}
            >
              {columns.map((column, index) => (
                <motion.div 
                  key={column.id} 
                  className="w-56 flex-shrink-0"
                  variants={columnVariants}
                  custom={index}
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <KanbanColumn 
                    column={column} 
                    orders={orders[column.id] || []} 
                    onMoveOrder={moveOrder} 
                    onDragOver={handleDragOver} 
                    onDrop={handleDrop} 
                    onUpdateColumnTitle={updateColumnTitle} 
                    draggedOrder={draggedOrder} 
                    onDragStart={handleDragStart} 
                    onDragEnd={handleDragEnd}
                    columnIndex={index}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default KanbanBoard;