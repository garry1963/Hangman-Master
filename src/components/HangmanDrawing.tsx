import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface HangmanDrawingProps {
  mistakes: number;
}

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: "spring", duration: 1.5, bounce: 0 },
      opacity: { duration: 0.01 }
    }
  }
};

export function HangmanDrawing({ mistakes }: HangmanDrawingProps) {
  const strokeClass = "stroke-slate-800";

  return (
    <div className="relative w-full max-w-[220px] aspect-[3/4] mx-auto flex items-center justify-center">
      {/* SVG Canvas */}
      <svg 
        viewBox="0 0 240 320" 
        className={cn("w-full h-full stroke-[6] stroke-linecap-round fill-none", strokeClass)}
      >
        {/* === Gallows (Always visible) === */}
        <g>
          {/* Base */}
          <line x1="20" y1="300" x2="160" y2="300" className="opacity-80" />
          {/* Main Pole */}
          <line x1="90" y1="300" x2="90" y2="20" className="opacity-80" />
          {/* Top Arm */}
          <line x1="90" y1="20" x2="180" y2="20" className="opacity-80" />
          {/* Support Diagonal */}
          <line x1="90" y1="60" x2="130" y2="20" className="opacity-80" />
          {/* Rope */}
          <line x1="180" y1="20" x2="180" y2="60" className="stroke-[4] opacity-50" />
        </g>

        {/* === Body Parts === */}
        <AnimatePresence>
          {/* 1. Head */}
          {mistakes >= 1 && (
            <motion.circle 
              variants={draw} initial="hidden" animate="visible"
              cx="180" cy="90" r="30" 
            />
          )}
          
          {/* 2. Body */}
          {mistakes >= 2 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="120" x2="180" y2="200" 
            />
          )}
          
          {/* 3. Left Arm */}
          {mistakes >= 3 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="140" x2="140" y2="180" 
            />
          )}
          
          {/* 4. Right Arm */}
          {mistakes >= 4 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="140" x2="220" y2="180" 
            />
          )}
          
          {/* 5. Left Leg */}
          {mistakes >= 5 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="200" x2="140" y2="260" 
            />
          )}
          
          {/* 6. Right Leg */}
          {mistakes >= 6 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="200" x2="220" y2="260" 
            />
          )}
          
          {/* Dead Eyes (Replaces normal head if lost) */}
          {mistakes >= 6 && (
            <motion.g 
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.5, duration: 0.3 }}
              className="stroke-[3] origin-[180px_90px]"
            >
              <line x1="168" y1="82" x2="178" y2="92" />
              <line x1="178" y1="82" x2="168" y2="92" />
              <line x1="182" y1="82" x2="192" y2="92" />
              <line x1="192" y1="82" x2="182" y2="92" />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
