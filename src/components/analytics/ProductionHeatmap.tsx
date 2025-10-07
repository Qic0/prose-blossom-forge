import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface ProductionHeatmapProps {
  data: Array<{
    date: string;
    orders: number;
    intensity: number; // 0-1 scale
  }>;
}

export const ProductionHeatmap = ({ data }: ProductionHeatmapProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getIntensityForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data.find(d => d.date === dateStr);
    return dayData?.intensity || 0;
  };

  const getOrdersForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data.find(d => d.date === dateStr);
    return dayData?.orders || 0;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted/30';
    if (intensity <= 0.25) return 'bg-blue-200';
    if (intensity <= 0.5) return 'bg-blue-400';
    if (intensity <= 0.75) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // Get first Monday of the calendar
  const firstDay = monthStart;
  const startCalendar = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startCalendar.setDate(firstDay.getDate() - mondayOffset);

  // Generate 6 weeks of days
  const calendarDays = [];
  const current = new Date(startCalendar);
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    calendarDays.push(weekDays);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Календарь загрузки</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm min-w-[120px] text-center">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1">
            {calendarDays.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((date, dayIndex) => {
                  const intensity = getIntensityForDate(date);
                  const orders = getOrdersForDate(date);
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <motion.div
                      key={dayIndex}
                      className={`
                        relative aspect-square p-1 rounded-md cursor-pointer transition-all duration-200
                        ${getIntensityColor(intensity)}
                        ${isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        hover:scale-110 hover:z-10 hover:shadow-lg
                      `}
                      whileHover={{ scale: 1.1 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: (weekIndex * 7 + dayIndex) * 0.01,
                        duration: 0.2
                      }}
                      title={`${format(date, 'd MMMM', { locale: ru })}: ${orders} заказов`}
                    >
                      <div className="flex items-center justify-center h-full">
                        <span className={`text-xs font-medium ${
                          intensity > 0.5 ? 'text-white' : 'text-foreground'
                        }`}>
                          {format(date, 'd')}
                        </span>
                      </div>
                      
                      {orders > 0 && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-orange-500 rounded-full transform translate-x-1 translate-y-1" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Меньше</span>
            <div className="flex space-x-1">
              {[0, 0.25, 0.5, 0.75, 1].map(intensity => (
                <div
                  key={intensity}
                  className={`w-3 h-3 rounded ${getIntensityColor(intensity)}`}
                />
              ))}
            </div>
            <span>Больше</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};