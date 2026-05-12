import { cn } from "../lib/utils";

interface HangmanDrawingProps {
  mistakes: number;
}

export function HangmanDrawing({ mistakes }: HangmanDrawingProps) {
  // Drawing parts definition. We render them conditionally.
  // Stage 1: Head
  // Stage 2: Body
  // Stage 3: Left Arm
  // Stage 4: Right Arm
  // Stage 5: Left Leg
  // Stage 6: Right Leg
  
  const strokeClass = "stroke-slate-800";

  return (
    <div className="relative w-full max-w-[220px] aspect-[3/4] mx-auto flex items-center justify-center">
      {/* SVG Canvas */}
      <svg 
        viewBox="0 0 240 320" 
        className={cn("w-full h-full stroke-[6] stroke-linecap-round fill-none", strokeClass)}
      >
        {/* === Gallows (Always visible) === */}
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

        {/* === Body Parts === */}
        {/* 1. Head */}
        {mistakes >= 1 && (
          <circle cx="180" cy="90" r="30" />
        )}
        
        {/* 2. Body */}
        {mistakes >= 2 && (
          <line x1="180" y1="120" x2="180" y2="200" />
        )}
        
        {/* 3. Left Arm */}
        {mistakes >= 3 && (
          <line x1="180" y1="140" x2="140" y2="180" />
        )}
        
        {/* 4. Right Arm */}
        {mistakes >= 4 && (
          <line x1="180" y1="140" x2="220" y2="180" />
        )}
        
        {/* 5. Left Leg */}
        {mistakes >= 5 && (
          <line x1="180" y1="200" x2="140" y2="260" />
        )}
        
        {/* 6. Right Leg */}
        {mistakes >= 6 && (
          <line x1="180" y1="200" x2="220" y2="260" />
        )}
        
        {/* Dead Eyes (Replaces normal head if lost) */}
        {mistakes >= 6 && (
          <g className="stroke-[3]">
            <line x1="168" y1="82" x2="178" y2="92" />
            <line x1="178" y1="82" x2="168" y2="92" />
            <line x1="182" y1="82" x2="192" y2="92" />
            <line x1="192" y1="82" x2="182" y2="92" />
          </g>
        )}
      </svg>
    </div>
  );
}
