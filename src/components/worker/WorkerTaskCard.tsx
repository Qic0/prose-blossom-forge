import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, User, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { differenceInSeconds } from 'date-fns';

interface WorkerTaskCardProps {
  task: {
    uuid_zadachi: string;
    title: string;
    description: string | null;
    salary: number | null;
    due_date: string;
    priority: string | null;
    status: string | null;
    is_locked?: boolean;
    review_returns?: any;
    zakazi?: {
      title: string;
      client_name: string;
    };
  };
  currentTime: Date;
  onClick: () => void;
  index?: number;
}

// Working with UTC time directly

const getPriorityColor = (priority: string | null) => {
  const colors = {
    low: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    urgent: 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[priority as keyof typeof colors] || colors.low;
};

const getPriorityText = (priority: string | null) => {
  const texts = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно'
  };
  return texts[priority as keyof typeof texts] || 'Обычный';
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const WorkerTaskCard = ({ task, currentTime, onClick, index = 0 }: WorkerTaskCardProps) => {
  // Working with UTC time directly
  const dueDate = new Date(task.due_date);
  
  const diffSeconds = differenceInSeconds(dueDate, currentTime);
  
  const isOverdue = diffSeconds <= 0;
  const isCritical = diffSeconds > 0 && diffSeconds < 3600; // меньше часа
  
  const days = Math.floor(Math.abs(diffSeconds) / 86400);
  const hours = Math.floor((Math.abs(diffSeconds) % 86400) / 3600);
  const minutes = Math.floor((Math.abs(diffSeconds) % 3600) / 60);
  const seconds = Math.floor(Math.abs(diffSeconds) % 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={`
          cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
          ${isOverdue ? 'border-red-500 border-2 bg-red-50/50 animate-pulse shadow-lg shadow-red-500/50' : 'border-border'}
        `}
        onClick={onClick}
      >
        <motion.div
          animate={isOverdue ? {
            boxShadow: [
              '0 0 0 0 rgba(239, 68, 68, 0.7)',
              '0 0 0 10px rgba(239, 68, 68, 0)',
              '0 0 0 0 rgba(239, 68, 68, 0)'
            ]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">
            {/* Левый блок - информация */}
            <div className="flex-1 w-full space-y-2 sm:space-y-3 md:space-y-4">
              {/* Заголовок */}
              <div>
                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-2xl line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Заказ и клиент */}
              {task.zakazi && (
                <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-xl text-muted-foreground flex-wrap">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 flex-shrink-0" />
                  <span className="font-medium">{task.zakazi.title}</span>
                  <span className="mx-1">·</span>
                  <span className="italic">{task.zakazi.client_name}</span>
                </div>
              )}

              {/* Приоритет */}
              <div>
                <Badge className={`${getPriorityColor(task.priority)} text-xs sm:text-sm lg:text-lg px-2 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2`}>
                  {getPriorityText(task.priority)}
                </Badge>
              </div>

              {/* Статус */}
              <div className="flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-xl text-muted-foreground">
                <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 flex-shrink-0" />
                <span>
                  {task.status === 'in_progress' && 'В работе'}
                  {task.status === 'pending' && 'Ожидает'}
                  {task.status === 'completed' && 'Завершено'}
                  {task.status === 'under_review' && (
                    <Badge className="bg-warning text-warning-foreground">
                      На проверке
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            {/* Правый блок - оплата и таймер */}
            <div className="w-full lg:w-auto lg:flex-shrink-0 space-y-3 sm:space-y-4">
              {/* Оплата - ОЧЕНЬ крупная */}
              <motion.div 
                className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border ${
                  isOverdue 
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 uppercase tracking-wider text-center lg:text-left">
                  Оплата
                </div>
                {isOverdue ? (
                  <div className="space-y-1 text-center lg:text-right">
                    <div className="font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl text-red-400 line-through">
                      {formatCurrency(task.salary || 0)}
                      <span className="text-sm sm:text-base lg:text-xl ml-1">₽</span>
                    </div>
                    <div className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-red-700">
                      {formatCurrency((task.salary || 0) * 0.9)}
                      <span className="text-lg sm:text-xl lg:text-3xl ml-1">₽</span>
                    </div>
                  </div>
                ) : (
                  <div className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-green-700 text-center lg:text-right">
                    {formatCurrency(task.salary || 0)}
                    <span className="text-lg sm:text-xl lg:text-3xl ml-1">₽</span>
                  </div>
                )}
              </motion.div>

              {/* Таймер */}
              <motion.div 
                className={`
                  rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border-2
                  ${isOverdue 
                    ? 'bg-red-100 border-red-500 animate-pulse' 
                    : isCritical 
                    ? 'bg-orange-100 border-orange-500 animate-pulse'
                    : 'bg-blue-50 border-blue-200'}
                `}
                animate={isCritical ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {isOverdue && (
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 text-red-700">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-bold uppercase">Просрочено</span>
                  </div>
                )}
                
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-2 uppercase tracking-wider flex items-center justify-center lg:justify-start gap-1">
                  <Clock className="w-3 h-3" />
                  {isOverdue ? 'Просрочено на' : 'Осталось'}
                </div>
                
                <div className={`
                  font-mono font-bold text-2xl sm:text-3xl md:text-4xl text-center lg:text-left
                  ${isOverdue ? 'text-red-700' : isCritical ? 'text-orange-700' : 'text-blue-700'}
                `}>
                  {days > 0 && <span>{days}д </span>}
                  {String(hours).padStart(2, '0')}:
                  {String(minutes).padStart(2, '0')}:
                  {String(seconds).padStart(2, '0')}
                </div>
              </motion.div>

              {/* Срок (дата) */}
              <div className="text-[10px] sm:text-xs text-muted-foreground text-center">
                {format(dueDate, 'dd MMM yyyy, HH:mm', { locale: ru })}
              </div>
            </div>
          </div>
        </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default WorkerTaskCard;
