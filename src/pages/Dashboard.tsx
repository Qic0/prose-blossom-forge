import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

import KanbanBoard from "@/components/KanbanBoard";
import { PageHeader } from "@/components/PageHeader";

const Dashboard = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <motion.main 
        className="pt-14"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <PageHeader
              title="Панель заказов"
              description="Управление и мониторинг всех заказов"
              gradient={true}
              actions={[
                {
                  label: "Обновить",
                  icon: RefreshCw,
                  onClick: () => window.location.reload(),
                  variant: "outline" as const
                }
              ]}
            />
          </div>
          
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <KanbanBoard />
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Dashboard;