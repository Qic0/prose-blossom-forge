import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface WorkerMetricsProps {
  metrics: {
    totalInProgressSum: number;
    totalEarned: number;
    currentTasksCount: number;
    completedTodayCount: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  delay = 0
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
  >
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const WorkerMetrics = ({ metrics }: WorkerMetricsProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold mb-3">Ключевые метрики</h3>
      
      <MetricCard
        icon={DollarSign}
        label="Заказы в работе"
        value={`${formatCurrency(metrics.totalInProgressSum)} ₽`}
        color="bg-blue-100 text-blue-700"
        delay={0}
      />

      <MetricCard
        icon={TrendingUp}
        label="Всего заработано"
        value={`${formatCurrency(metrics.totalEarned)} ₽`}
        color="bg-green-100 text-green-700"
        delay={0.05}
      />

      <MetricCard
        icon={Clock}
        label="Текущие задачи"
        value={metrics.currentTasksCount}
        color="bg-amber-100 text-amber-700"
        delay={0.1}
      />

      <MetricCard
        icon={CheckCircle}
        label="Выполнено сегодня"
        value={metrics.completedTodayCount}
        color="bg-purple-100 text-purple-700"
        delay={0.15}
      />
    </div>
  );
};

export default WorkerMetrics;
