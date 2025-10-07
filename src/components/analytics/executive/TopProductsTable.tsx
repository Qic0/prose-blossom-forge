import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const TopProductsTable = () => {
  const products = [
    {
      id: 1,
      name: "Кухонный гарнитур «Модерн»",
      category: "Кухни",
      revenue: 850000,
      cost: 620000,
      margin: 27.1,
      orders: 24,
      trend: "up"
    },
    {
      id: 2,
      name: "Спальный комплект «Классик»",
      category: "Спальни",
      revenue: 720000,
      cost: 550000,
      margin: 23.6,
      orders: 18,
      trend: "up"
    },
    {
      id: 3,
      name: "Шкаф-купе 3-створчатый",
      category: "Шкафы",
      revenue: 650000,
      cost: 480000,
      margin: 26.2,
      orders: 32,
      trend: "stable"
    },
    {
      id: 4,
      name: "Детская мебель «Радуга»",
      category: "Детские",
      revenue: 520000,
      cost: 410000,
      margin: 21.2,
      orders: 15,
      trend: "down"
    },
    {
      id: 5,
      name: "Офисный стол «Эконом»",
      category: "Офисная",
      revenue: 380000,
      cost: 290000,
      margin: 23.7,
      orders: 28,
      trend: "up"
    }
  ];

  const maxRevenue = Math.max(...products.map(p => p.revenue));

  const formatCurrency = (value: number) => {
    return `${(value / 1000).toFixed(0)}К ₽`;
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-emerald-600";
      case "down": return "text-red-600";
      default: return "text-slate-600";
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "up": return <Badge variant="outline" className="text-emerald-600 border-emerald-200">↗</Badge>;
      case "down": return <Badge variant="outline" className="text-red-600 border-red-200">↘</Badge>;
      default: return <Badge variant="outline" className="text-slate-600 border-slate-200">→</Badge>;
    }
  };

  return (
    <Card className="h-[514px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg font-bold">Топ-5 продуктов по марже</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <div className="space-y-4 h-full overflow-y-auto">
          {products.map((product, index) => (
            <div key={product.id} className="p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {product.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                    {product.category} • {product.orders} заказов
                  </p>
                </div>
                {getTrendBadge(product.trend)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Выручка</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
                
                <Progress 
                  value={(product.revenue / maxRevenue) * 100} 
                  className="h-2"
                />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Маржа</span>
                  <span className={`text-sm font-bold ${getTrendColor(product.trend)}`}>
                    {product.margin.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Себестоимость</div>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(product.cost)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Прибыль</div>
                    <div className="text-xs font-medium text-emerald-600">
                      {formatCurrency(product.revenue - product.cost)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProductsTable;