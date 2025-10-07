
import FinancialSummaryHeader from "@/components/FinancialSummaryHeader";
import ExecutiveKPICards from "@/components/analytics/executive/ExecutiveKPICards";
import RevenueTimeChart from "@/components/analytics/executive/RevenueTimeChart";
import ExpenseDonutChart from "@/components/analytics/executive/ExpenseDonutChart";
import TopProductsTable from "@/components/analytics/executive/TopProductsTable";
import OperationalMetrics from "@/components/analytics/executive/OperationalMetrics";
import { PageHeader } from "@/components/PageHeader";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";

const Analitika2 = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800">
      
      <main className="pt-14 p-6">
        <motion.div 
          className="max-w-[1400px] mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PageHeader
            title="Финансовая сводка"
            description="Комплексный анализ производства и финансовых показателей"
            gradient={true}
            actions={[
              {
                label: "Экспорт данных",
                icon: BarChart3,
                onClick: () => {},
                variant: "outline",
                size: "sm"
              },
              {
                label: "Прогнозы",
                icon: TrendingUp,
                onClick: () => {},
                variant: "default"
              }
            ]}
          />
          
          <FinancialSummaryHeader />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <ExecutiveKPICards />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 lg:h-[500px]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <RevenueTimeChart />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <ExpenseDonutChart />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <TopProductsTable />
            </motion.div>
          </div>

          {/* Goals Section */}
          <motion.div 
            className="mb-8 p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Цель на 3 месяца
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-2xl font-bold text-emerald-600 mb-1">4.8М ₽</div>
                <div className="text-sm text-emerald-700 dark:text-emerald-300">Прогноз оборота</div>
                <div className="text-xs text-emerald-600 mt-1">+14.3% к текущему</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 mb-1">780К ₽</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Прогноз прибыли</div>
                <div className="text-xs text-blue-600 mt-1">+14.7% к текущему</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div className="text-2xl font-bold text-purple-600 mb-1">16.3%</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Прогноз маржи</div>
                <div className="text-xs text-purple-600 mt-1">+0.1% к текущему</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <OperationalMetrics />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Analitika2;