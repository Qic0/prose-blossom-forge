import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ActionButton {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ActionButton[];
  gradient?: boolean;
}

export const PageHeader = ({ 
  title, 
  description, 
  actions = [], 
  gradient = false 
}: PageHeaderProps) => {
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <motion.div 
      className={`relative overflow-hidden ${
        gradient 
          ? 'bg-card/80 border border-card-border/20 backdrop-blur-xl' 
          : 'bg-card border border-card-border/10'
      } rounded-2xl py-8 px-8 mb-8`}
      style={{
        boxShadow: 'var(--shadow-card)',
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      whileHover={{
        boxShadow: 'var(--shadow-hover)',
        y: -2,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
    >
      {/* Subtle background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.015] via-transparent to-accent/[0.015] pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/[0.02] to-transparent rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10">
        <motion.div 
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <motion.div 
            className="flex-1 max-w-4xl"
            variants={itemVariants}
          >
            <motion.div
              variants={titleVariants}
              className="flex items-baseline gap-6"
            >
              <motion.h1 
                className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-foreground/85 bg-clip-text text-transparent"
                style={{
                  fontFamily: 'var(--font-classical-serif)',
                  lineHeight: '1.2',
                  letterSpacing: '-0.01em'
                }}
                initial={{ opacity: 0, letterSpacing: '0.02em' }}
                animate={{ opacity: 1, letterSpacing: '-0.01em' }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              >
                {title}
              </motion.h1>
              
              {/* Compact description on the same line for larger screens */}
              <motion.p 
                className="text-muted-foreground text-base leading-tight hidden lg:block"
                style={{
                  fontFamily: 'var(--font-classical-sans)',
                  fontWeight: '400',
                  lineHeight: '1.4'
                }}
                variants={itemVariants}
              >
                {description}
              </motion.p>
            </motion.div>
            
            {/* Mobile description below title */}
            <motion.p 
              className="text-muted-foreground text-base leading-tight mt-2 lg:hidden"
              style={{
                fontFamily: 'var(--font-classical-sans)',
                fontWeight: '400',
                lineHeight: '1.4'
              }}
              variants={itemVariants}
            >
              {description}
            </motion.p>
          </motion.div>
          
          {actions.length > 0 && (
            <motion.div 
              className="flex gap-2 ml-6"
              variants={itemVariants}
            >
              {actions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.2 + (index * 0.05),
                    ease: [0.23, 1, 0.32, 1] as [number, number, number, number]
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -1,
                    transition: { duration: 0.15 }
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { duration: 0.1 }
                  }}
                >
                  <Button 
                    variant={action.variant || "default"}
                    size={action.size || "sm"}
                    onClick={action.onClick}
                    className="shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-sm font-medium"
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};