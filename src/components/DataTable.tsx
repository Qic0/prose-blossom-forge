import React from 'react';
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  loading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

// Helper functions for default rendering
const formatDate = (date: string) => {
  if (!date) return '—';
  try {
    const parsedDate = new Date(date);
    if (!isValid(parsedDate)) return '—';
    return format(parsedDate, 'dd.MM HH:mm', { locale: ru });
  } catch {
    return '—';
  }
};

const formatShortDate = (date: string) => {
  if (!date) return '—';
  try {
    const parsedDate = new Date(date);
    if (!isValid(parsedDate)) return '—';
    return format(parsedDate, 'dd.MM HH:mm', { locale: ru });
  } catch {
    return '—';
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    'cutting': 'bg-blue-100 text-blue-800 border-blue-200',
    'edging': 'bg-green-100 text-green-800 border-green-200', 
    'drilling': 'bg-purple-100 text-purple-800 border-purple-200',
    'sanding': 'bg-orange-100 text-orange-800 border-orange-200',
    'priming': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'painting': 'bg-pink-100 text-pink-800 border-pink-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'in_progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'pending': 'bg-gray-100 text-gray-800 border-gray-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
    'high': 'bg-red-100 text-red-800 border-red-200',
    'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'low': 'bg-green-100 text-green-800 border-green-200',
  };

  const statusLabels: Record<string, string> = {
    'cutting': 'Распил',
    'edging': 'Кромление',
    'drilling': 'Присадка',
    'sanding': 'Шлифовка',
    'priming': 'Грунтовка',
    'painting': 'Покраска',
    'completed': 'Завершен',
    'in_progress': 'В работе',
    'pending': 'Ожидает',
    'cancelled': 'Отменен',
    'high': 'Высокий',
    'medium': 'Средний',
    'low': 'Низкий',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.1 }}
    >
      <Badge className={`${variants[status] || variants['pending']} transition-all duration-200 whitespace-nowrap`}>
        {statusLabels[status] || status}
      </Badge>
    </motion.div>
  );
};

const getPriorityBadge = (priority: string) => {
  return getStatusBadge(priority);
};

const formatRemainingTime = (value: any, row: any) => {
  // Для завершенных задач показываем время выполнения
  if (row.status === 'completed' && row.execution_time_seconds) {
    const seconds = parseInt(row.execution_time_seconds);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let timeStr = '';
    if (hours > 0) {
      timeStr = `${hours}ч ${minutes}м ${remainingSeconds}с`;
    } else if (minutes > 0) {
      timeStr = `${minutes}м ${remainingSeconds}с`;
    } else {
      timeStr = `${remainingSeconds}с`;
    }
    
    // Проверяем, была ли задача просрочена
    const wasOverdue = row.due_date && new Date(row.due_date) < new Date();
    const colorClass = wasOverdue ? "text-destructive" : "text-green-600";
    
    return (
      <span className={`${colorClass} font-medium`}>
        Выполнено за {timeStr}
      </span>
    );
  }
  
  // Для незавершенных задач показываем оставшееся время
  if (!row.created_at || !row.due_date) return '—';
  
  try {
    const createdDate = new Date(row.created_at);
    const dueDate = new Date(row.due_date);
    
    if (!isValid(createdDate) || !isValid(dueDate)) return '—';
    
    const totalMs = dueDate.getTime() - createdDate.getTime();
    const currentMs = Date.now() - createdDate.getTime();
    const remainingMs = totalMs - currentMs;
    
    if (remainingMs <= 0) {
      const overdueMs = Math.abs(remainingMs);
      const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let overdueText = '';
      if (overdueHours > 0) {
        overdueText = `${overdueHours}ч ${overdueMinutes}м`;
      } else {
        overdueText = `${overdueMinutes}м`;
      }
      
      return <span className="text-destructive font-medium">Просрочено на {overdueText}</span>;
    }
    
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return (
      <span className="text-muted-foreground">
        {remainingHours}ч {remainingMinutes}м
      </span>
    );
  } catch {
    return '—';
  }
};

// Функция для рендеринга зарплаты с учетом просрочки
const formatSalaryWithOverdue = (value: number, row: any) => {
  if (!value) return '—';
  
  // Проверяем, просрочен ли заказ
  const isOverdue = (() => {
    if (!row.due_date) return false;
    
    try {
      const dueDate = new Date(row.due_date);
      if (!isValid(dueDate)) return false;
      
      return Date.now() > dueDate.getTime();
    } catch {
      return false;
    }
  })();
  
  if (isOverdue) {
    const reducedSalary = Math.round(value * 0.9); // 10% снижение
    return (
      <div className="space-y-1">
        <div className="text-destructive font-bold text-sm">
          {reducedSalary.toLocaleString('ru-RU')} ₽
        </div>
        <div className="text-destructive text-xs font-medium">
          Штраф 10%
        </div>
        <div className="line-through text-muted-foreground text-xs opacity-60">
          {value.toLocaleString('ru-RU')} ₽
        </div>
      </div>
    );
  }
  
  return `${value.toLocaleString('ru-RU')} ₽`;
};

// Default renders object
const defaultRenders: Record<string, (value: any, row?: any) => React.ReactNode> = {
  created_at: formatDate,
  updated_at: formatDate,
  due_date: formatShortDate,
  status: getStatusBadge,
  priority: getPriorityBadge,
  total_amount: (value: number) => value ? `${value.toLocaleString('ru-RU')} ₽` : '—',
  salary: formatSalaryWithOverdue,
  remaining_time: formatRemainingTime,
};

export const DataTable = ({ title, data, columns, loading, isFetching, emptyMessage, onRowClick }: DataTableProps) => {
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  if (loading) {
    return (
      <motion.div 
        className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-[--shadow-card]"
        style={{
          boxShadow: 'var(--shadow-card)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-20 animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.tr 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full animate-pulse" />
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-[--shadow-card] transition-all duration-200 hover:shadow-[--shadow-2] hover:-translate-y-[1px]"
      style={{
        boxShadow: 'var(--shadow-card)',
      }}
      initial="hidden"
      animate="visible"
      variants={tableVariants}
      whileHover={{
        boxShadow: 'var(--shadow-2)',
        y: -1,
        transition: { duration: 0.2 }
      }}
    >
      <motion.div 
        className="flex items-center justify-between"
        variants={rowVariants}
      >
        <div className="flex items-center space-x-4">
          <motion.h2 
            className="text-xl font-semibold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.h2>
          {isFetching && (
            <motion.div 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="animate-pulse">Обновление данных...</span>
            </motion.div>
          )}
          <motion.div 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {data.length} записей
          </motion.div>
        </div>
      </motion.div>
      
      {data.length === 0 ? (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-muted-foreground">{emptyMessage}</p>
        </motion.div>
      ) : (
        <motion.div 
          className="rounded-md border overflow-hidden"
          variants={rowVariants}
        >
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <motion.th 
                    key={index} 
                    className="font-medium h-12 px-4 text-left align-middle text-muted-foreground [&:has([role=checkbox])]:pr-0"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    {column.header}
                  </motion.th>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <motion.tr 
                  key={rowIndex}
                  className={`border-b transition-all duration-200 hover:bg-muted/50 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: rowIndex * 0.03 }}
                  whileHover={{ 
                    backgroundColor: "hsl(var(--muted) / 0.8)",
                    transition: { duration: 0.2 }
                  }}
                  whileTap={onRowClick ? { scale: 0.998 } : {}}
                >
                  {columns.map((column, colIndex) => (
                    <motion.td 
                      key={colIndex}
                      className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: (rowIndex * 0.03) + (colIndex * 0.01) }}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : defaultRenders[column.key] 
                        ? defaultRenders[column.key](row[column.key], row) 
                        : row[column.key] || '—'}
                    </motion.td>
                  ))}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </motion.div>
  );
};