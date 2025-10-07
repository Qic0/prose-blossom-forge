import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Paperclip } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import OrderDetailsDialog from "./OrderDetailsDialog";
import { Order, ColumnType } from "./KanbanBoard";
import { productionStages } from "@/hooks/useKanbanOrders";
import { useOrderAttachments } from "@/hooks/useOrderAttachments";

interface OrderCardProps {
  order: Order;
  columnId: ColumnType;
  onMoveOrder: (orderId: string, fromColumn: ColumnType, toColumn: ColumnType) => void;
  onDragStart: (orderId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  orderIndex?: number;
}

const getPriorityColor = (priority: Order['priority']) => {
  const colors = {
    low: 'bg-minimalist-platinum text-minimalist-muted border-border',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    high: 'bg-red-50 text-red-600 border-red-200'
  };
  return colors[priority];
};

const getPriorityText = (priority: Order['priority']) => {
  const texts = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий'
  };
  return texts[priority];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(dateString));
};

const formatOrderId = (numericId: number) => {
  return numericId.toString().padStart(6, '0');
};

const OrderCard = ({ order, columnId, onMoveOrder, onDragStart, onDragEnd, isDragging, orderIndex = 0 }: OrderCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const { attachments } = useOrderAttachments(order.id);

  const handleDoubleClick = () => {
    const stageIds = productionStages.map(stage => stage.id as ColumnType);
    const currentIndex = stageIds.indexOf(columnId);
    const nextIndex = (currentIndex + 1) % stageIds.length;
    const nextColumn = stageIds[nextIndex];
    
    onMoveOrder(order.id, columnId, nextColumn);
  };

  const handleClick = () => {
    setShowDetails(true);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', order.id);
    e.dataTransfer.setData('application/column', columnId);
    onDragStart(order.id);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ 
          opacity: isDragging ? 0.7 : 1, 
          y: 0, 
          scale: isDragging ? 0.95 : 1,
          rotate: isDragging ? 2 : 0
        }}
        whileHover={{ 
          y: -2,
          scale: 1.02,
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: orderIndex * 0.05
        }}
        layoutId={`card-${order.id}`}
      >
        <Card 
          className={`kanban-card group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] shadow-lg border border-black/20 ${isDragging ? 'dragging' : ''}`}
          onDoubleClick={handleDoubleClick}
          onClick={handleClick}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <CardContent className="p-3 space-y-2">
            {/* Заголовок заказа */}
            <motion.div 
              className="flex items-start justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="kanban-card-title font-classical-sans text-base flex-1">
                {order.title}
              </h4>
              
              {/* Индикатор файлов */}
              {attachments && attachments.length > 0 && (
                <motion.div
                  className="flex items-center space-x-1 ml-2 text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="text-xs font-mono">{attachments.length}</span>
                </motion.div>
              )}
            </motion.div>

            {/* Клиент */}
            <motion.p 
              className="kanban-card-meta text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              {order.client}
            </motion.p>

            {/* Дата под клиентом */}
            <motion.div 
              className="flex items-center space-x-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Clock className="w-3 h-3 text-minimalist-muted" />
              <span className="kanban-card-meta text-xs">
                {formatDate(order.dueDate)}
              </span>
            </motion.div>

            {/* Описание (если есть) */}
            {order.description && (
              <motion.p 
                className="kanban-card-meta text-sm line-clamp-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {order.description}
              </motion.p>
            )}

            {/* Стоимость */}
            <motion.div 
              className="flex items-center justify-between pt-2 border-t border-border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div 
                className="flex items-center space-x-1"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="font-classical-sans font-semibold text-minimalist-accent">
                  {formatCurrency(order.value)}
                </span>
                <span className="text-minimalist-muted font-semibold">₽</span>
              </motion.div>
            </motion.div>

            {/* Исполнитель */}
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <User className="w-3 h-3 text-minimalist-muted" />
              <span className="kanban-card-meta text-xs">
                {order.assignee}
              </span>
            </motion.div>

            {/* Прогресс по этапам производства */}
            <motion.div 
              className="flex items-center justify-center space-x-1 pt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {productionStages.map((stage, index) => {
                const isCompleted = stage.order < order.currentStage;
                const isCurrent = stage.order === order.currentStage;
                
                return (
                  <motion.div
                    key={stage.id}
                    className={`w-2 h-2 rounded-sm transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 shadow-sm' 
                        : isCurrent
                        ? 'bg-minimalist-accent shadow-sm'
                        : 'bg-minimalist-platinum border border-border'
                    } hover:scale-110`}
                    title={stage.name}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      delay: 0.5 + index * 0.05, 
                      type: "spring", 
                      stiffness: 200 
                    }}
                    whileHover={{ scale: 1.2 }}
                  />
                );
              })}
            </motion.div>

            {/* Приоритет и ID заказа внизу */}
            <motion.div 
              className="flex justify-between items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Badge 
                  variant="secondary" 
                  className={`kanban-badge ${getPriorityColor(order.priority)} text-xs`}
                >
                  {getPriorityText(order.priority)}
                </Badge>
              </motion.div>
              <motion.span 
                className="text-xs text-minimalist-muted/60 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                #{formatOrderId(order.numericId)}
              </motion.span>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <OrderDetailsDialog 
        order={order}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
};

export default OrderCard;