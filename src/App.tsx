import React, { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { getRandomWordByConfig, getClassicStreak, saveClassicStreak, getLocalCategories, addCategory, addWords, checkDailyStreak, getDailyState, saveDailyState, DailyState, Difficulty } from "./lib/store";
import { generateDailyPuzzle } from "./lib/ai";
import { HangmanDrawing } from "./components/HangmanDrawing";
import { Keyboard } from "./components/Keyboard";
import { Trophy, RotateCw, Calendar, Settings, Gamepad2, Plus, Upload, Loader2, RefreshCw } from "lucide-react";

type ViewMode = 'classic' | 'daily' | 'manage';

export default function App() {
  const [view, setView] = useState<ViewMode>('classic');

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">
            H
          </div>
          <span className="hidden sm:inline text-xl font-bold text-slate-800 tracking-tight">Hangman Master</span>
        </div>
        <div className="flex gap-1 md:gap-4 overflow-x-auto pb-1 sm:pb-0">
          <button 
            onClick={() => setView('classic')} 
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${view === 'classic' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Gamepad2 className="w-4 h-4" /> <span className="hidden xs:inline">Classic</span>
          </button>
          <button 
            onClick={() => setView('daily')} 
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${view === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Calendar className="w-4 h-4" /> <span className="hidden xs:inline">Daily Puzzle</span>
          </button>
          <button 
            onClick={() => setView('manage')} 
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${view === 'manage' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Settings className="w-4 h-4" /> <span className="hidden xs:inline">Manage</span>
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center">
        {view === 'classic' && <ClassicGame />}
        {view === 'daily' && <DailyGame />}
        {view === 'manage' && <ManageWords />}
      </div>

      <footer className="h-12 border-t border-slate-200 px-4 sm:px-8 flex items-center justify-between text-slate-400 text-xs shrink-0 bg-white">
        <p>© {new Date().getFullYear()} Hangman Studio</p>
      </footer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Game Board Component (Shared between Daily & Classic)
// ----------------------------------------------------------------------
interface GameBoardProps {
  word: string;
  category: string;
  label: string;
  guessedLetters: Set<string>;
  setGuessedLetters: React.Dispatch<React.SetStateAction<Set<string>>>;
  streak: number;
  showStreak: boolean;
  onWin?: () => void;
  onLose?: () => void;
  resetGame?: () => void;
  hideReset?: boolean;
  controls?: React.ReactNode;
}

function GameBoard({ 
  word, category, label, guessedLetters, setGuessedLetters, 
  streak, showStreak, resetGame, onWin, onLose, hideReset, controls 
}: GameBoardProps) {
  const wordChars = word.split("");
  const activeLetters = new Set(Array.from(guessedLetters).filter(l => wordChars.includes(l)));
  const inactiveLetters = new Set(Array.from(guessedLetters).filter(l => !wordChars.includes(l)));
  const mistakes = inactiveLetters.size;

  const isLoser = mistakes >= 6;
  const isWinner = wordChars.every(letter => guessedLetters.has(letter) || letter === " ");

  const [gameOverHandled, setGameOverHandled] = useState(false);

  const addGuessedLetter = useCallback(
    (letter: string) => {
      if (guessedLetters.has(letter) || isLoser || isWinner) return;
      setGuessedLetters(prev => {
        const newSet = new Set(prev);
        newSet.add(letter);
        return newSet;
      });
    },
    [guessedLetters, isWinner, isLoser, setGuessedLetters]
  );

  useEffect(() => {
    // Reset handling flag when a new game starts
    if (guessedLetters.size === 0) setGameOverHandled(false);
  }, [guessedLetters]);

  useEffect(() => {
    if (isWinner && !gameOverHandled) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#eab308'] });
      onWin?.();
      setGameOverHandled(true);
    } else if (isLoser && !gameOverHandled) {
      onLose?.();
      setGameOverHandled(true);
    }
  }, [isWinner, isLoser, gameOverHandled, onWin, onLose]);

  // Physical keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (!key.match(/^[a-z]$/i)) return;
      e.preventDefault();
      addGuessedLetter(key.toUpperCase());
    };
    document.addEventListener("keypress", handler);
    return () => document.removeEventListener("keypress", handler);
  }, [addGuessedLetter]);

  return (
    <main className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-8 max-w-6xl mx-auto w-full md:overflow-visible overflow-y-auto">
      {/* Left Side: Gallows/Drawing Area */}
      <section className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative p-6 md:p-8 min-h-[300px] h-full self-start">
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
            {6 - mistakes} CHANCES LEFT
          </span>
        </div>
        
        {showStreak && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200 font-bold text-sm shadow-sm ring-1 ring-yellow-500/20">
              <Trophy className="w-4 h-4" />
              <span>{streak}</span>
            </div>
          </div>
        )}

        {controls && (
          <div className="absolute top-16 left-4 md:top-auto md:bottom-6 md:left-6 md:right-6 w-[calc(100%-2rem)] flex flex-wrap gap-2 justify-center mt-4 border-t border-slate-100 pt-4 md:border-none z-10">
            {controls}
          </div>
        )}
        
        <div className="w-full max-w-[240px] flex items-center justify-center mt-12 md:mt-0 mb-6 md:mb-12">
          <HangmanDrawing mistakes={mistakes} />
        </div>

        <p className="md:mt-auto mt-4 text-slate-500 font-medium italic text-center w-full px-2 max-w-sm bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
          <span className="uppercase text-xs tracking-wider font-bold not-italic font-sans text-slate-400 block mb-1">{label}</span>
          <span className="text-indigo-700 not-italic font-semibold text-lg">{category}</span>
        </p>
      </section>

      {/* Right Side: Interaction Area */}
      <section className="w-full md:w-[440px] lg:w-[480px] flex flex-col gap-6 shrink-0 h-full">
        {/* Word Display Card */}
        <div className="bg-white justify-center border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 z-10">
            {wordChars.map((letter, index) => {
              if (letter === " ") return <div key={index} className="w-4 sm:w-6" />;
              const isRevealed = guessedLetters.has(letter) || isLoser;
              const isMissed = isLoser && !guessedLetters.has(letter);
              
              return (
                <div 
                  key={index} 
                  className={`
                    w-[8vw] h-[12vw] max-w-[48px] max-h-[64px] sm:w-12 sm:h-16 
                    border-b-[3px] sm:border-b-4 ${isRevealed ? 'border-indigo-600' : 'border-slate-300'}
                    flex items-center justify-center 
                    text-3xl sm:text-4xl font-black
                    ${isMissed ? "text-red-500" : "text-slate-800"}
                    transition-all duration-300 ease-out
                    bg-slate-50/50 rounded-t-sm
                  `}
                >
                  <span className={`${isRevealed ? "opacity-100" : "opacity-0"} transition-opacity duration-300 block transform -translate-y-1`}>
                    {isRevealed ? letter : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-sm text-slate-500 font-medium z-10">
            {(isWinner || isLoser) ? (
              <span className={`font-bold px-4 py-1.5 rounded-full ${isWinner ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' : 'bg-red-100 text-red-600 ring-1 ring-red-600/20'}`}>
                {isWinner ? "Survival Master!" : "Game Over"}
              </span>
            ) : (
              `Guess the ${wordChars.filter(c => c !== " ").length}-letter word`
            )}
          </div>
        </div>

        {/* Virtual Keyboard */}
        <Keyboard
          disabled={isWinner || isLoser}
          activeLetters={activeLetters}
          inactiveLetters={inactiveLetters}
          onGuess={addGuessedLetter}
        />

        {/* Action Buttons */}
        {(!hideReset) && (
          <div className="flex gap-4 mt-auto">
            <button
              onClick={resetGame}
              className={`flex-1 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
                (isWinner || isLoser) 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none" 
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-sm"
              }`}
            >
              <RotateCw className={`w-5 h-5 ${(isWinner || isLoser) ? 'animate-spin-once' : ''}`} />
              {(isWinner || isLoser) ? "Play Again" : "Skip Word"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

// ----------------------------------------------------------------------
// Classic Game View
// ----------------------------------------------------------------------
function ClassicGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('any');
  const [selectedCategory, setSelectedCategory] = useState<string>('any');
  const categories = getLocalCategories();
  
  const [wordData, setWordData] = useState<{word: string, category: string}>({ word: 'LOADING', category: '' });
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(() => getClassicStreak());

  const resetGame = useCallback(() => {
    const next = getRandomWordByConfig(selectedCategory, difficulty);
    if (!next) {
      alert("No words match your selected category and difficulty.");
      return;
    }
    setWordData(next);
    setGuessedLetters(new Set());
  }, [difficulty, selectedCategory]);

  useEffect(() => {
    resetGame();
  }, [resetGame]); // Re-run when difficulty or category changes

  return (
    <GameBoard 
      word={wordData.word} 
      category={wordData.category} 
      guessedLetters={guessedLetters}
      setGuessedLetters={setGuessedLetters}
      streak={streak}
      showStreak={true}
      label="Category"
      resetGame={resetGame}
      onWin={() => {
        const newStreak = streak + 1;
        setStreak(newStreak);
        saveClassicStreak(newStreak);
      }}
      onLose={() => {
        setStreak(0);
        saveClassicStreak(0);
      }}
      controls={
        <div className="flex gap-2 w-full max-w-sm z-50 bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200">
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)} 
            className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-0 p-2 truncate"
          >
            <option value="any">⭐ All Categories</option>
            {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="w-[1px] bg-slate-200 mx-1"></div>
          <select 
            value={difficulty} 
            onChange={e => setDifficulty(e.target.value as Difficulty)} 
            className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-0 p-2 truncate"
          >
            <option value="any">⚡ Any Level</option>
            <option value="easy">🟢 Easy (≤5)</option>
            <option value="medium">🟡 Medium (6-8)</option>
            <option value="hard">🔴 Hard (9+)</option>
          </select>
        </div>
      }
    />
  );
}

// ----------------------------------------------------------------------
// Daily Game View
// ----------------------------------------------------------------------
function DailyGame() {
  const [dailyState, setDailyState] = useState<DailyState>(() => checkDailyStreak());
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split('T')[0];
  const isAlreadyPlayedToday = dailyState.lastCompletedDate === today;

  useEffect(() => {
    const loadPuzzle = async () => {
      if (dailyState.puzzleDate !== today && !isAlreadyPlayedToday) {
        setLoading(true);
        try {
          const aiData = await generateDailyPuzzle();
          const newState: DailyState = {
            ...dailyState,
            puzzleDate: today,
            puzzleWord: aiData.word.toUpperCase(),
            puzzleHint: aiData.hint,
          };
          setDailyState(newState);
          saveDailyState(newState);
          setGuessedLetters(new Set());
        } catch (e) {
          console.error("Daily puzzle error:", e);
          setError(e instanceof Error ? e.message : "Failed to fetch daily puzzle. Please interact to retry, or check API keys.");
        } finally {
          setLoading(false);
        }
      }
    };
    loadPuzzle();
  }, [today, dailyState, isAlreadyPlayedToday]);

  const handleWin = () => {
     if (isAlreadyPlayedToday) return;
     const newState = { ...dailyState, lastCompletedDate: today, streak: dailyState.streak + 1 };
     setDailyState(newState);
     saveDailyState(newState);
  };
  const handleLose = () => {
     if (isAlreadyPlayedToday) return;
     const newState = { ...dailyState, lastCompletedDate: today, streak: 0 };
     setDailyState(newState);
     saveDailyState(newState);
  };

  if (isAlreadyPlayedToday) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto w-full text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-green-50">
          <Calendar className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Daily Complete!</h2>
        <p className="text-slate-500 mb-8 max-w-[280px]">You've completed today's puzzle. Come back tomorrow for a new AI challenge.</p>
        <div className="flex items-center gap-3 bg-yellow-50 text-yellow-800 px-6 py-4 rounded-2xl border border-yellow-200 font-bold text-xl shadow-sm w-full justify-center">
            <Trophy className="w-6 h-6 text-yellow-500" /> 
            <span>Streak: {dailyState.streak} Days</span>
        </div>
      </div>
    );
  }

  if (loading) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 mt-20">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
         <span className="font-medium animate-pulse">Generating AI Puzzle...</span>
       </div>
     );
  }

  if (error) {
     return (
       <div className="flex-1 flex flex-col items-center justify-center text-red-500 gap-4 mt-20 p-6 text-center">
         <span className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 max-w-sm">{error}</span>
         <button onClick={() => window.location.reload()} className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg shadow-sm hover:bg-slate-50 font-medium">Retry</button>
       </div>
     );
  }

  if (!dailyState.puzzleWord) return null;

  return (
    <div className="w-full h-full flex flex-col">
       <div className="bg-indigo-600 text-white w-full py-2.5 px-4 text-center font-medium shadow-md shadow-indigo-600/10 z-20 sticky top-0 flex items-center justify-center gap-2">
         <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
         Daily AI Challenge
       </div>
       <GameBoard 
         word={dailyState.puzzleWord}
         category={dailyState.puzzleHint || "AI Puzzle Mystery"}
         label="Trivia Hint"
         guessedLetters={guessedLetters}
         setGuessedLetters={setGuessedLetters}
         streak={dailyState.streak}
         showStreak={true}
         onWin={handleWin}
         onLose={handleLose}
         hideReset={true}
       />
    </div>
  );
}

// ----------------------------------------------------------------------
// Manage Words View
// ----------------------------------------------------------------------
function ManageWords() {
  const [categories, setCategories] = useState(() => getLocalCategories());
  const [newCatName, setNewCatName] = useState("");
  const categoryKeys = Object.keys(categories).sort();
  const [selectedCat, setSelectedCat] = useState(categoryKeys[0] || "");
  const [wordsToAdd, setWordsToAdd] = useState("");

  const handleAddCat = () => {
    if (!newCatName.trim()) return;
    const name = newCatName.trim().toUpperCase();
    addCategory(name);
    setNewCatName("");
    setCategories(getLocalCategories());
    setSelectedCat(name);
  };

  const handleAddWords = () => {
    if (!selectedCat || !wordsToAdd.trim()) return;
    const words = wordsToAdd.split(',').map(w => w.trim()).filter(w => w.match(/^[a-zA-Z]+$/));
    addWords(selectedCat, words);
    setWordsToAdd("");
    setCategories(getLocalCategories());
    alert(`Successfully added ${words.length} valid word(s) to ${selectedCat}!`);
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">Word Library</h2>
        <p className="text-slate-500 mt-2">Manage your offline database of categories and words.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Add Category</h3>
              <p className="text-xs text-slate-400">Create a new topic bucket.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
             <input 
               className="border border-slate-300 p-3 rounded-xl w-full text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow bg-slate-50 uppercase placeholder:normal-case font-medium text-slate-700" 
               placeholder="E.g. SPORTS" 
               value={newCatName} 
               onChange={e => setNewCatName(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleAddCat()}
             />
             <button 
               className="bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold text-sm transition-colors shadow-sm active:translate-y-[1px]" 
               onClick={handleAddCat}
             >
               Create Category
             </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Upload Words</h3>
              <p className="text-xs text-slate-400">Add words to a specific category.</p>
            </div>
          </div>
          
          <select 
            className="border border-slate-300 p-3 rounded-xl mb-3 w-full text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-medium text-slate-700 font-sans" 
            value={selectedCat} 
            onChange={e => setSelectedCat(e.target.value)}
          >
            {categoryKeys.map(c => <option key={c} value={c}>{c} ({categories[c].length})</option>)}
          </select>
          <textarea 
            className="border border-slate-300 p-3 rounded-xl w-full mb-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-mono text-slate-600 resize-none" 
            rows={4} 
            placeholder="Comma separated words (e.g. APPLE, BANANA)" 
            value={wordsToAdd} 
            onChange={e => setWordsToAdd(e.target.value)} 
          />
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-3 rounded-xl font-bold text-sm transition-colors shadow-sm active:translate-y-[1px]" 
            onClick={handleAddWords}
          >
            Add Words
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm font-medium text-slate-400 bg-white p-4 rounded-xl border border-slate-200 border-dashed">
        Database Sync: <span className="text-slate-700">{Object.values(categories).reduce((acc, arr) => acc + arr.length, 0)}</span> words active across <span className="text-slate-700">{categoryKeys.length}</span> categories.
      </div>
    </div>
  )
}
