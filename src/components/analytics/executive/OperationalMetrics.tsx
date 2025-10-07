import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Truck, AlertTriangle, CheckCircle } from "lucide-react";

const OperationalMetrics = () => {
  const metrics = [
    {
      id: "order_to_production",
      title: "Заказ → Производство",
      value: "3.2 дня",
      target: 3,
      actual: 3.2,
      status: "warning",
      icon: Clock,
      color: "text-amber-600"
    },
    {
      id: "production_to_delivery",
      title: "Производство → Отгрузка",
      value: "12.8 дней",
      target: 14,
      actual: 12.8,
      status: "good",
      icon: Truck,
      color: "text-emerald-600"
    },
    {
      id: "delivery_rate",
      title: "On-time Delivery",
      value: "87.5%",
      target: 90,
      actual: 87.5,
      status: "warning",
      icon: CheckCircle,
      color: "text-amber-600"
    },
    {
      id: "quality_issues",
      title: "Возвраты/Нарекания",
      value: "4.2%",
      target: 5,
      actual: 4.2,
      status: "good",
      icon: AlertTriangle,
      color: "text-emerald-600"
    }
  ];

  const operationalData = [
    {
      title: "Backlog",
      value: "142 заказа",
      description: "В очереди на производство",
      trend: "up",
      trendValue: "+12"
    },
    {
      title: "WIP",
      value: "68 заказов",
      description: "В производстве",
      trend: "stable",
      trendValue: "±0"
    },
    {
      title: "Загрузка производства",
      value: "82.4%",
      description: "Текущая загрузка мощностей",
      trend: "up",
      trendValue: "+5.2%"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "text-emerald-600";
      case "warning": return "text-amber-600";
      case "critical": return "text-red-600";
      default: return "text-slate-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "good": return <Badge variant="outline" className="text-emerald-600 border-emerald-200">✓</Badge>;
      case "warning": return <Badge variant="outline" className="text-amber-600 border-amber-200">!</Badge>;
      case "critical": return <Badge variant="outline" className="text-red-600 border-red-200">⚠</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return "↗";
      case "down": return "↘";
      default: return "→";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-emerald-600";
      case "down": return "text-red-600";
      default: return "text-slate-600";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Process Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Жизненный цикл заказа</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const progress = (metric.actual / metric.target) * 100;
              
              return (
                <div key={metric.id} className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {metric.title}
                      </span>
                    </div>
                    {getStatusBadge(metric.status)}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {metric.value}
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Цель: {metric.target}{metric.id.includes("rate") ? "%" : " дн"}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operational Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Операционные метрики</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {operationalData.map((item, index) => (
              <div key={index} className="p-4 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <div className={`flex items-center space-x-1 text-xs font-medium ${getTrendColor(item.trend)}`}>
                    <span>{getTrendIcon(item.trend)}</span>
                    <span>{item.trendValue}</span>
                  </div>
                </div>
                
                <div className="mb-1">
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {item.value}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
                
                {item.title.includes("Загрузка") && (
                  <div className="mt-2">
                    <Progress value={82.4} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suppliers Risk */}
          <div className="mt-4 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Проблемные поставщики
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-amber-700 dark:text-amber-300">
                • ООО "Фурнитура Плюс" - задержка 3 дня
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                • ИП Сидоров - качество фанеры ↓
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300">
                • "МебельХолдинг" - изменение цен +8%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalMetrics;