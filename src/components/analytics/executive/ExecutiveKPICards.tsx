import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, ShoppingCart, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface KPIData {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: "up" | "down";
  target?: number;
  icon: any;
  color: string;
}

const ExecutiveKPICards = () => {
  const [pulseIndex, setPulseIndex] = useState(-1);

  const kpiData: KPIData[] = [
    {
      id: "revenue",
      title: "Оборот",
      value: "4.2М ₽",
      change: 12.5,
      trend: "up",
      target: 15,
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      id: "profit",
      title: "Чистая прибыль",
      value: "680К ₽",
      change: 8.3,
      trend: "up",
      target: 10,
      icon: TrendingUp,
      color: "text-emerald-600"
    },
    {
      id: "margin",
      title: "Маржа",
      value: "16.2%",
      change: -2.1,
      trend: "down",
      target: 15,
      icon: Target,
      color: "text-amber-600"
    },
    {
      id: "successful",
      title: "Успешные заказы",
      value: "142",
      change: 5.7,
      trend: "up",
      target: 5,
      icon: ShoppingCart,
      color: "text-emerald-600"
    },
    {
      id: "failed",
      title: "Неуспешные заказы",
      value: "18",
      change: -12.3,
      trend: "down",
      target: -10,
      icon: Users,
      color: "text-red-600"
    },
    {
      id: "avgcheck",
      title: "Средний чек",
      value: "29.5К ₽",
      change: 3.8,
      trend: "up",
      target: 3,
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      id: "runway",
      title: "Cash Runway",
      value: "8.4 мес",
      change: 1.2,
      trend: "up",
      target: 1,
      icon: Calendar,
      color: "text-emerald-600"
    }
  ];

  // Pulse animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      const eligibleCards = kpiData.filter(kpi => 
        (kpi.trend === "up" && kpi.change > (kpi.target || 0)) ||
        (kpi.trend === "down" && Math.abs(kpi.change) > Math.abs(kpi.target || 0))
      );
      
      if (eligibleCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * eligibleCards.length);
        const cardIndex = kpiData.findIndex(kpi => kpi.id === eligibleCards[randomIndex].id);
        setPulseIndex(cardIndex);
        
        setTimeout(() => setPulseIndex(-1), 800);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const formatChange = (change: number) => {
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPulsing = pulseIndex === index;
        const isTargetMet = kpi.trend === "up" ? kpi.change > (kpi.target || 0) : Math.abs(kpi.change) > Math.abs(kpi.target || 0);
        
        return (
          <motion.div
            key={kpi.id}
            animate={isPulsing ? {
              scale: [1, 1.03, 1],
              boxShadow: [
                "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                "0 10px 25px -3px rgb(16 185 129 / 0.3)",
                "0 4px 6px -1px rgb(0 0 0 / 0.1)"
              ]
            } : {}}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="cursor-pointer"
          >
            <Card className={`p-4 h-full hover:shadow-lg transition-all duration-300 ${
              !isTargetMet && kpi.trend === "down" ? "ring-1 ring-red-200" : ""
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex items-center space-x-1">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    kpi.trend === "up" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {formatChange(kpi.change)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {kpi.title}
                </h3>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {kpi.value}
                </p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ExecutiveKPICards;