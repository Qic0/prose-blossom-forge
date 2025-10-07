import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import spaceBg from "@/assets/cosmic-landscape-bg.jpg";

const Index = () => {
  return (
    <div
        className="min-h-screen bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: `url(${spaceBg})` }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-14 gap-24">
          {/* Title block */}
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-wide -mt-12 whitespace-nowrap"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Управление. Без Хаоса.
            </motion.h1>
          </motion.div>
          
          {/* Button block */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/20 px-8 py-4 rounded-full backdrop-blur-sm transition-all text-lg font-medium"
            >
              Перейти к панели управления
            </Link>
          </motion.div>
        </div>
      </div>
    );
};

export default Index;
