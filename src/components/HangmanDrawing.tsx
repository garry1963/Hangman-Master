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
      pathLength: { type: "spring", duration: 1.2, bounce: 0 },
      opacity: { duration: 0.01 }
    }
  }
};

export function HangmanDrawing({ mistakes }: HangmanDrawingProps) {
  return (
    <div className="relative w-full max-w-[220px] aspect-[3/4] mx-auto flex items-center justify-center text-slate-800">
      {/* SVG Canvas */}
      <svg 
        viewBox="0 0 240 320" 
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="w-full h-full"
      >
        {/* Subtle ground baseline guide */}
        <line x1="10" y1="300" x2="230" y2="300" strokeDasharray="4 6" className="stroke-slate-200" strokeWidth="2" />

        {/* === Gallows Construction (Mistakes 1 - 4) === */}
        <AnimatePresence>
          {/* 1. Gallows Base */}
          {mistakes >= 1 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="20" y1="300" x2="160" y2="300" 
            />
          )}

          {/* 2. Main Pole */}
          {mistakes >= 2 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="90" y1="300" x2="90" y2="20" 
            />
          )}

          {/* 3. Top Arm & Diagonal Support */}
          {mistakes >= 3 && (
            <motion.g variants={draw} initial="hidden" animate="visible">
              <line x1="90" y1="20" x2="180" y2="20" />
              <line x1="90" y1="60" x2="130" y2="20" />
            </motion.g>
          )}

          {/* 4. Rope */}
          {mistakes >= 4 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="20" x2="180" y2="60" strokeWidth="4" className="opacity-70"
            />
          )}

          {/* === Man Construction (Mistakes 5 - 10) === */}
          {/* 5. Head */}
          {mistakes >= 5 && (
            <motion.circle 
              variants={draw} initial="hidden" animate="visible"
              cx="180" cy="90" r="30" 
            />
          )}
          
          {/* 6. Body */}
          {mistakes >= 6 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="120" x2="180" y2="200" 
            />
          )}
          
          {/* 7. Left Arm */}
          {mistakes >= 7 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="140" x2="140" y2="180" 
            />
          )}
          
          {/* 8. Right Arm */}
          {mistakes >= 8 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="140" x2="220" y2="180" 
            />
          )}
          
          {/* 9. Left Leg */}
          {mistakes >= 9 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="200" x2="140" y2="260" 
            />
          )}
          
          {/* 10. Right Leg */}
          {mistakes >= 10 && (
            <motion.line 
              variants={draw} initial="hidden" animate="visible"
              x1="180" y1="200" x2="220" y2="260" 
            />
          )}
          
          {/* Dead Eyes (Replaces normal head if lost) */}
          {mistakes >= 10 && (
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
