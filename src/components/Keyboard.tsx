import { cn } from "../lib/utils";

const KEYS = [
  "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P",
  "A", "S", "D", "F", "G", "H", "J", "K", "L",
  "Z", "X", "C", "V", "B", "N", "M"
];

interface KeyboardProps {
  disabled: boolean;
  activeLetters: Set<string>;
  inactiveLetters: Set<string>;
  onGuess: (letter: string) => void;
}

export function Keyboard({ disabled, activeLetters, inactiveLetters, onGuess }: KeyboardProps) {
  // We'll split keys into rows for a QWERTY layout
  const row1 = KEYS.slice(0, 10);
  const row2 = KEYS.slice(10, 19);
  const row3 = KEYS.slice(19, 26);

  const renderRow = (keys: string[]) => (
    <div className="flex justify-center gap-2 mb-2 w-full touch-manipulation">
      {keys.map((key) => {
        const isActive = activeLetters.has(key);
        const isInactive = inactiveLetters.has(key);

        return (
          <button
            key={key}
            type="button"
            className={cn(
              "h-10 sm:h-12 flex-1 max-w-[36px] sm:max-w-[40px] rounded-md font-bold text-sm sm:text-base flex items-center justify-center select-none transition-colors",
              isActive ? "bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm" : 
              isInactive ? "bg-slate-100 shadow-sm border border-slate-200 text-slate-300 cursor-not-allowed" : 
              "bg-white shadow-sm border border-slate-300 text-slate-700 hover:bg-slate-50",
            )}
            onClick={() => !isActive && !isInactive && !disabled && onGuess(key)}
            disabled={isActive || isInactive || disabled}
            aria-disabled={isActive || isInactive || disabled}
          >
            {key}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="bg-slate-200/50 rounded-2xl p-4 flex flex-col w-full max-w-full">
      {renderRow(row1)}
      {renderRow(row2)}
      {renderRow(row3)}
    </div>
  );
}
