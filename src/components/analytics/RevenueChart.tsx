import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    orders: number;
    aov: number;
    margin: number;
  }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex(prev => (prev + 1) % data.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [data.length]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-4 shadow-lg"
        >
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Выручка' || entry.name === 'Средний чек' 
                ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(entry.value)
                : entry.value.toLocaleString('ru-RU')
              }
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { index, ...rest } = props;
    const isHighlighted = index === highlightedIndex;
    
    return (
      <motion.rect
        {...rest}
        animate={{
          opacity: isHighlighted ? 1 : 0.8,
          scale: isHighlighted ? 1.05 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Доходы и заказы по месяцам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                <Bar 
                  yAxisId="left"
                  dataKey="orders" 
                  fill="hsl(var(--primary))" 
                  name="Заказы"
                  shape={<CustomBar />}
                />
                
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={3}
                  name="Выручка"
                  dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(var(--chart-2))", strokeWidth: 2 }}
                />
                
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="aov" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Средний чек"
                  dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};