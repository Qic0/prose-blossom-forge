import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import UserHeader from "./UserHeader";
import { useState, useEffect } from "react";
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isHomePage = location.pathname === "/";
  const isWorkerDashboard = location.pathname === "/worker";
  const isDispatcherDashboard = location.pathname === "/dispatcher";
  const [currentTime, setCurrentTime] = useState(new Date());

  // Обновление времени каждую секунду для worker/dispatcher dashboard
  useEffect(() => {
    if (!isWorkerDashboard && !isDispatcherDashboard) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isWorkerDashboard, isDispatcherDashboard]);

  const navVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 border-b border-transparent ${isHomePage ? "" : "bg-background"}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <motion.h1 
            className={`text-xl font-bold transition-colors duration-300 ${isHomePage ? "text-white" : "text-foreground"}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Aslan.CRM</span>
          </motion.h1>
        </Link>
        
        {(isWorkerDashboard || isDispatcherDashboard) ? (
          <motion.div 
            className="flex-1 hidden md:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center">
              <div className="text-4xl font-mono font-bold">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(currentTime, 'dd MMMM yyyy', { locale: ru })} (UTC)
              </div>
            </div>
          </motion.div>
        ) : user?.role === 'dispatcher' ? (
          <motion.nav 
            className="flex items-center space-x-6"
            variants={navVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Link
                to="/dispatcher"
                className={`text-sm font-medium transition-all duration-300 relative group ${
                  isHomePage 
                    ? "text-white hover:text-white/80" 
                    : location.pathname === "/dispatcher" 
                      ? "text-primary hover:text-primary" 
                      : "text-muted-foreground hover:text-primary"
                }`}
              >
                Проверка задач
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  initial={{ scaleX: location.pathname === "/dispatcher" ? 1 : 0 }}
                  animate={{ scaleX: location.pathname === "/dispatcher" ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ originX: 0 }}
                />
              </Link>
            </motion.div>
          </motion.nav>
        ) : (
          <motion.nav 
            className="flex items-center space-x-6"
            variants={navVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              { to: "/dashboard", label: "Панель" },
              { to: "/zakazi", label: "Заказы" },
              { to: "/zadachi", label: "Задачи" },
              { to: "/workers", label: "Сотрудники" },
              { to: "/analitika", label: "Аналитика" },
              { to: "/automation", label: "Автоматизация" },
            ].map((item) => (
              <motion.div key={item.to} variants={itemVariants}>
                <Link
                  to={item.to}
                  className={`text-sm font-medium transition-all duration-300 relative group ${
                    isHomePage 
                      ? "text-white hover:text-white/80" 
                      : location.pathname === item.to 
                        ? "text-primary hover:text-primary" 
                        : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {item.label}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                    initial={{ scaleX: location.pathname === item.to ? 1 : 0 }}
                    animate={{ scaleX: location.pathname === item.to ? 1 : 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ originX: 0 }}
                  />
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        )}
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <UserHeader />
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;