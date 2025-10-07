import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";

const ExpenseDonutChart = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(true);

  const data = [
    { name: "Зарплаты", value: 1200000, color: "#3b82f6", percentage: 35.3 },
    { name: "Материалы", value: 850000, color: "#10b981", percentage: 25.0 },
    { name: "Коммунальные", value: 320000, color: "#f59e0b", percentage: 9.4 },
    { name: "Налоги", value: 280000, color: "#ef4444", percentage: 8.2 },
    { name: "Оборудование", value: 450000, color: "#8b5cf6", percentage: 13.2 },
    { name: "Расходники", value: 180000, color: "#06b6d4", percentage: 5.3 },
    { name: "Прочие", value: 120000, color: "#84cc16", percentage: 3.6 }
  ];

  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  // Auto-rotate through segments
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRotating) {
      interval = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % data.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isRotating, data.length]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm">{`Сумма: ${(data.value / 1000).toFixed(0)}К ₽`}</p>
          <p className="text-sm">{`Доля: ${data.percentage.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}М ₽`;
    }
    return `${(value / 1000).toFixed(0)}К ₽`;
  };

  return (
    <Card className="h-[514px] flex flex-col">
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-lg font-bold">Структура расходов</CardTitle>
        <div className="text-2xl font-extrabold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
          {formatCurrency(totalExpenses)}
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-2 px-3 flex-1 flex flex-col">
        <div className="relative flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={activeIndex === index ? "#fff" : "transparent"}
                    strokeWidth={activeIndex === index ? 3 : 0}
                    style={{
                      filter: activeIndex === index ? "brightness(1.1)" : "brightness(1)",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                      setIsRotating(false);
                    }}
                    onMouseLeave={() => {
                      // Add delay before resuming rotation to avoid flickering
                      setTimeout(() => setIsRotating(true), 500);
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center content */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                {data[activeIndex].name}
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(data[activeIndex].value)}
              </div>
              <div className="text-xs text-slate-500">
                {data[activeIndex].percentage.toFixed(1)}%
              </div>
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
          {data.map((item, index) => (
            <div
              key={item.name}
              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                activeIndex === index ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
              onClick={() => {
                setActiveIndex(index);
                setIsRotating(false);
                setTimeout(() => setIsRotating(true), 2000);
              }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {item.name}
                </span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseDonutChart;