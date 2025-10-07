import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface KPIData {
  monthlyRevenue: number;
  monthlyOrders: number;
  avgOrderValue: number;
  onTimeDelivery: number;
  backlog: number;
  trends: {
    revenue: number;
    orders: number;
    aov: number;
    delivery: number;
  };
}

interface KPICardsProps {
  data: KPIData;
}

const KPICard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  format = "currency",
  index 
}: {
  title: string;
  value: number;
  trend: number;
  icon: any;
  format?: "currency" | "number" | "percentage";
  index: number;
}) => {
  const formatValue = (val: number) => {
    if (format === "currency") return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
    if (format === "percentage") return `${val.toFixed(1)}%`;
    return val.toLocaleString('ru-RU');
  };

  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 lg:p-6 border-r border-border/20 last:border-r-0 hover:bg-accent/5 transition-all duration-300"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{title}</p>
            <p className="text-lg lg:text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{formatValue(value)}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 text-xs lg:text-sm font-medium flex-shrink-0 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4" /> : <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4" />}
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export const KPICards = ({ data }: KPICardsProps) => {
  const kpis = [
    {
      title: "Выручка за месяц",
      value: data.monthlyRevenue,
      trend: data.trends.revenue,
      icon: DollarSign,
      format: "currency" as const
    },
    {
      title: "Чистая прибыль",
      value: data.monthlyRevenue * 0.2,
      trend: data.trends.revenue,
      icon: TrendingUp,
      format: "currency" as const
    },
    {
      title: "Заказы за месяц",
      value: data.monthlyOrders,
      trend: data.trends.orders,
      icon: ShoppingCart,
      format: "number" as const
    },
    {
      title: "Средний чек",
      value: data.avgOrderValue,
      trend: data.trends.aov,
      icon: DollarSign,
      format: "currency" as const
    },
    {
      title: "Доставка в срок",
      value: data.onTimeDelivery,
      trend: data.trends.delivery,
      icon: Clock,
      format: "percentage" as const
    },
    {
      title: "Невыполнено",
      value: data.backlog,
      trend: -5.2,
      icon: AlertTriangle,
      format: "number" as const
    }
  ];

  return (
    <Card className="mb-6 bg-gradient-to-br from-card to-card/50 border-border/50 overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi, index) => (
          <KPICard key={kpi.title} {...kpi} index={index} />
        ))}
      </div>
    </Card>
  );
};