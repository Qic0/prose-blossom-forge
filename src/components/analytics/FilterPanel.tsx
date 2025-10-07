import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    period: 'month' | 'quarter' | 'year';
    status: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
    priority: ('high' | 'low' | 'medium' | 'urgent')[];
    assignedTo: string[];
    compareYoY: boolean;
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

export const FilterPanel = ({ filters, onFiltersChange, onReset }: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const current = filters[key as keyof typeof filters] as string[];
    const updated = current.includes(value) 
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const hasActiveFilters = 
    filters.status.length > 0 || 
    filters.priority.length > 0 || 
    filters.assignedTo.length > 0 ||
    filters.compareYoY ||
    filters.dateRange.from ||
    filters.dateRange.to;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-card to-card/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Фильтры</span>
              {hasActiveFilters && (
                <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                  Активны
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  Сбросить
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8"
              >
                {isExpanded ? 'Скрыть' : 'Показать'}
              </Button>
            </div>
          </div>

          <motion.div
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm">Период</Label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8 text-xs",
                          !filters.dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {filters.dateRange.from ? (
                          filters.dateRange.to ? (
                            <>
                              {format(filters.dateRange.from, "dd MMM", { locale: ru })} -{" "}
                              {format(filters.dateRange.to, "dd MMM", { locale: ru })}
                            </>
                          ) : (
                            format(filters.dateRange.from, "dd MMM yyyy", { locale: ru })
                          )
                        ) : (
                          <span>Выберите даты</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange.from || new Date()}
                        selected={{
                          from: filters.dateRange.from || undefined,
                          to: filters.dateRange.to || undefined,
                        }}
                        onSelect={(range) => updateFilter('dateRange', {
                          from: range?.from || null,
                          to: range?.to || null
                        })}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <Label className="text-sm">Группировка</Label>
                <Select 
                  value={filters.period} 
                  onValueChange={(value) => updateFilter('period', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">По месяцам</SelectItem>
                    <SelectItem value="quarter">По кварталам</SelectItem>
                    <SelectItem value="year">По годам</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Статус</Label>
                <div className="flex flex-wrap gap-1">
                  {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map(status => (
                    <Button
                      key={status}
                      variant={filters.status.includes(status) ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => toggleArrayFilter('status', status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Приоритет</Label>
                <div className="flex flex-wrap gap-1">
                  {(['urgent', 'high', 'medium', 'low'] as const).map(priority => (
                    <Button
                      key={priority}
                      variant={filters.priority.includes(priority) ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => toggleArrayFilter('priority', priority)}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Compare YoY */}
              <div className="space-y-2">
                <Label className="text-sm">Сравнение</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.compareYoY}
                    onCheckedChange={(checked) => updateFilter('compareYoY', checked)}
                  />
                  <span className="text-xs text-muted-foreground">
                    Год к году
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};