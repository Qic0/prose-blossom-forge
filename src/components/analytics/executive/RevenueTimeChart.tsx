import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const RevenueTimeChart = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(-1);

  const data = [
    { month: "Янв", revenue: 3200000, profit: 520000, successOrders: 128, failedOrders: 22 },
    { month: "Фев", revenue: 2800000, profit: 450000, successOrders: 115, failedOrders: 18 },
    { month: "Мар", revenue: 3800000, profit: 620000, successOrders: 156, failedOrders: 24 },
    { month: "Апр", revenue: 3500000, profit: 580000, successOrders: 142, failedOrders: 19 },
    { month: "Май", revenue: 4200000, profit: 680000, successOrders: 168, failedOrders: 15 },
    { month: "Июн", revenue: 3900000, profit: 630000, successOrders: 152, failedOrders: 21 },
    { month: "Июл", revenue: 4500000, profit: 720000, successOrders: 175, failedOrders: 17 },
    { month: "Авг", revenue: 4100000, profit: 665000, successOrders: 159, failedOrders: 20 },
    { month: "Сен", revenue: 3700000, profit: 600000, successOrders: 145, failedOrders: 23 },
    { month: "Окт", revenue: 4300000, profit: 695000, successOrders: 167, failedOrders: 16 },
    { month: "Ноя", revenue: 3600000, profit: 590000, successOrders: 140, failedOrders: 25 },
    { month: "Дек", revenue: 4800000, profit: 780000, successOrders: 185, failedOrders: 12 }
  ];

  // Auto-play animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMonth(prev => {
          const next = prev + 1;
          return next >= data.length ? 0 : next;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [isPlaying, data.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setCurrentMonth(0);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold mb-2">{`Месяц: ${label}`}</p>
          <p className="text-blue-600">{`Выручка: ${(data.revenue / 1000000).toFixed(1)}М ₽`}</p>
          <p className="text-emerald-600">{`Чистая прибыль: ${(data.profit / 1000).toFixed(0)}К ₽`}</p>
          <p className="text-green-600">{`Успешные: ${data.successOrders}`}</p>
          <p className="text-red-600">{`Неуспешные: ${data.failedOrders}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { index, ...restProps } = props;
    const isHighlighted = currentMonth === index;
    
    return (
      <Bar
        {...restProps}
        fill={isHighlighted ? "#3b82f6" : "#e2e8f0"}
        stroke={isHighlighted ? "#1d4ed8" : "transparent"}
        strokeWidth={2}
      />
    );
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">Оборот и прибыль</CardTitle>
        <Button
          onClick={togglePlay}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isPlaying ? "Пауза" : "Играть"}</span>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              fontSize={12}
            />
            <YAxis 
              yAxisId="revenue"
              orientation="left"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}М`}
            />
            <YAxis 
              yAxisId="profit"
              orientation="right"
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}К`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              yAxisId="revenue"
              dataKey="revenue" 
              fill="#e2e8f0"
              radius={[4, 4, 0, 0]}
              shape={<CustomBar />}
            />
            <Line
              yAxisId="profit"
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
            />
            {currentMonth >= 0 && (
              <ReferenceLine 
                x={data[currentMonth]?.month} 
                yAxisId="revenue"
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueTimeChart;