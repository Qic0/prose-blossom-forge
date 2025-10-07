import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface RevenueDistributionProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  onSegmentClick: (segment: string) => void;
}

const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const RevenueDistributionChart = ({ data, onSegmentClick }: RevenueDistributionProps) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % data.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [data.length]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3 shadow-lg"
        >
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(data.value)}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const CustomCell = (props: any) => {
    const { index, ...rest } = props;
    const isPulsing = index === pulseIndex;
    
    return (
      <motion.g>
        <Cell 
          {...rest}
          animate={{
            scale: isPulsing ? 1.05 : 1,
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Распределение по статусам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Donut Chart */}
            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    onClick={(data) => onSegmentClick(data.name)}
                    className="cursor-pointer"
                  >
                    {data.map((entry, index) => (
                      <CustomCell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        index={index}
                        stroke={activeIndex === index ? "hsl(var(--foreground))" : "none"}
                        strokeWidth={activeIndex === index ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Horizontal Bar Breakdown */}
            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="horizontal" data={data} margin={{ left: 60, right: 20 }}>
                  <XAxis type="number" className="text-muted-foreground" fontSize={10} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    className="text-muted-foreground" 
                    fontSize={10}
                    width={50}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {data.map((entry, index) => (
              <motion.div
                key={entry.name}
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                whileHover={{ scale: 1.05 }}
                onClick={() => onSegmentClick(entry.name)}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">{entry.name}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};