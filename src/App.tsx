import React, { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { getRandomWordByConfig, getClassicStreak, saveClassicStreak, getLocalCategories, addCategory, addWords, checkDailyStreak, getDailyState, saveDailyState, DailyState, Difficulty, getDifficulty, addHistoricalDailyWord, exportAppData, importAppData } from "./lib/store";
import { generateDailyPuzzle } from "./lib/ai";
import { HangmanDrawing } from "./components/HangmanDrawing";
import { Keyboard } from "./components/Keyboard";
import { ChallengesView } from "./components/ChallengesView";
import { recordGameWin, recordCorrectLetterGuess, getUnclaimedCount } from "./lib/challenges";
import { Trophy, RotateCw, Calendar, Settings, Gamepad2, Plus, Upload, Loader2, RefreshCw, Download, Database, Lightbulb, Target, Sparkles, X } from "lucide-react";

type ViewMode = 'classic' | 'daily' | 'challenges' | 'manage';

export default function App() {
  const [view, setView] = useState<ViewMode>('classic');
  const [toastChallenge, setToastChallenge] = useState<string | null>(null);

  const unclaimedCount = getUnclaimedCount();

  const handleChallengeUnlocked = (title: string) => {
    setToastChallenge(title);
    setTimeout(() => {
      setToastChallenge(null);
    }, 4500);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden relative">
      
      {/* Toast Notification for Completed Challenges */}
      {toastChallenge && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 animate-bounce-subtle">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Challenge Completed!</div>
            <div className="text-sm font-bold text-white">{toastChallenge}</div>
          </div>
          <button onClick={() => setToastChallenge(null)} className="ml-3 text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0">
            H
          </div>
          <span className="hidden sm:inline text-xl font-bold text-slate-800 tracking-tight">Hangman Master</span>
        </div>
        <div className="flex gap-1 md:gap-3 overflow-x-auto pb-1 sm:pb-0">
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
            onClick={() => setView('challenges')} 
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap relative ${view === 'challenges' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Target className="w-4 h-4" /> 
            <span className="hidden xs:inline">Challenges</span>
            {unclaimedCount > 0 && (
              <span className="w-5 h-5 bg-amber-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unclaimedCount}
              </span>
            )}
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
        {view === 'classic' && <ClassicGame onChallengeUnlocked={handleChallengeUnlocked} />}
        {view === 'daily' && <DailyGame onChallengeUnlocked={handleChallengeUnlocked} />}
        {view === 'challenges' && <ChallengesView />}
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
  onWin?: (details: { hintsUsed: number; mistakes: number }) => void;
  onLose?: (details: { hintsUsed: number; mistakes: number }) => void;
  resetGame?: () => void;
  hideReset?: boolean;
  controls?: React.ReactNode;
  infoNode?: React.ReactNode;
}

function GameBoard({ 
  word, category, label, guessedLetters, setGuessedLetters, 
  streak, showStreak, resetGame, onWin, onLose, hideReset, controls, infoNode
}: GameBoardProps) {
  const wordChars = word.split("");
  const activeLetters = new Set(Array.from(guessedLetters).filter(l => wordChars.includes(l)));
  const inactiveLetters = new Set(Array.from(guessedLetters).filter(l => !wordChars.includes(l)));
  const mistakes = inactiveLetters.size;

  const isLoser = mistakes >= 10;
  const isWinner = wordChars.every(letter => guessedLetters.has(letter) || letter === " ");

  const [gameOverHandled, setGameOverHandled] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Calculate unique unrevealed letters remaining in secret word
  const uniqueUnrevealed = Array.from(
    new Set(wordChars.filter(c => c !== " " && !guessedLetters.has(c)))
  );
  const unrevealedCount = uniqueUnrevealed.length;

  // Can use hint if less than 2 hints used AND more than 1 letter remains
  const canGetHint = hintsUsed < 2 && unrevealedCount > 1 && !isWinner && !isLoser;

  // Reset hints used when starting a new game
  useEffect(() => {
    if (guessedLetters.size === 0) {
      setHintsUsed(0);
    }
  }, [word, guessedLetters.size]);

  const addGuessedLetter = useCallback(
    (letter: string) => {
      if (guessedLetters.has(letter) || isLoser || isWinner) return;
      setGuessedLetters(prev => {
        const newSet = new Set(prev);
        newSet.add(letter);
        if (wordChars.includes(letter)) {
          recordCorrectLetterGuess();
        }
        return newSet;
      });
    },
    [guessedLetters, isWinner, isLoser, setGuessedLetters, wordChars]
  );

  useEffect(() => {
    // Reset handling flag when a new game starts
    if (guessedLetters.size === 0) setGameOverHandled(false);
  }, [guessedLetters]);

  useEffect(() => {
    if (isWinner && !gameOverHandled) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#eab308'] });
      onWin?.({ hintsUsed, mistakes });
      setGameOverHandled(true);
    } else if (isLoser && !gameOverHandled) {
      onLose?.({ hintsUsed, mistakes });
      setGameOverHandled(true);
    }
  }, [isWinner, isLoser, gameOverHandled, onWin, onLose, hintsUsed, mistakes]);

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

  const provideHint = useCallback(() => {
    if (!canGetHint) return;
    const hintLetter = uniqueUnrevealed[Math.floor(Math.random() * uniqueUnrevealed.length)];
    if (hintLetter) {
      addGuessedLetter(hintLetter);
      setHintsUsed(prev => prev + 1);
    }
  }, [canGetHint, uniqueUnrevealed, addGuessedLetter]);

  return (
    <main className="flex-1 flex flex-col md:flex-row gap-6 md:gap-8 p-4 md:p-8 max-w-6xl mx-auto w-full md:overflow-visible overflow-y-auto">
      {/* Left Side: Gallows/Drawing Area */}
      <section className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative p-6 md:p-8 min-h-[300px] h-full self-start">
        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-100">
            {Math.max(0, 10 - mistakes)} CHANCES LEFT
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
        
        <div className="w-full max-w-[240px] flex items-center justify-center mt-16 md:mt-16 mb-6 md:mb-12">
          <HangmanDrawing mistakes={mistakes} />
        </div>

        <div className="md:mt-auto mt-4 mb-20 md:mb-24 w-full flex flex-col items-center gap-3 relative z-20">
          <p className="text-slate-500 font-medium italic text-center w-full px-2 max-w-sm bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
            <span className="uppercase text-xs tracking-wider font-bold not-italic font-sans text-slate-400 block mb-1">{label}</span>
            <span className="text-indigo-700 not-italic font-semibold text-lg">{category}</span>
          </p>
          {infoNode}
        </div>
      </section>

      {/* Right Side: Interaction Area */}
      <section className="w-full md:w-[440px] lg:w-[480px] flex flex-col gap-6 shrink-0 h-full">
        {/* Word Display Card */}
        <div className="bg-white justify-center border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="flex flex-wrap items-center justify-center z-10 w-full gap-y-3 sm:gap-y-4">
            {word.split(" ").map((wordPart, wordIndex) => (
              <div key={wordIndex} className="flex flex-nowrap justify-center gap-0.5 sm:gap-1.5 md:gap-2 mx-1 sm:mx-2 mb-1 max-w-full">
                {wordPart.split("").map((letter, index) => {
                  const isRevealed = guessedLetters.has(letter) || isLoser;
                  const isMissed = isLoser && !guessedLetters.has(letter);
                  
                  return (
                    <div 
                      key={`${wordIndex}-${index}`} 
                      className={`
                        w-6 sm:w-8 md:w-11 h-9 sm:h-11 md:h-14 
                        border-b-[3px] sm:border-b-4 ${isRevealed ? 'border-indigo-600' : 'border-slate-300'}
                        flex items-center justify-center overflow-hidden
                        text-lg sm:text-xl md:text-3xl font-black shrink min-w-[20px] sm:min-w-[24px]
                        ${isMissed ? "text-red-500" : "text-slate-800"}
                        transition-all duration-300 ease-out
                        bg-slate-50/50 rounded-t-sm
                      `}
                    >
                      <span className={`${isRevealed ? "opacity-100" : "opacity-0"} transition-opacity duration-300 block transform -translate-y-0.5 sm:-translate-y-1`}>
                        {isRevealed ? letter : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="text-sm text-slate-500 font-medium z-10">
            {(isWinner || isLoser) ? (
              <span className={`font-bold px-4 py-1.5 rounded-full ${isWinner ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' : 'bg-red-100 text-red-600 ring-1 ring-red-600/20'}`}>
                {isWinner ? "Survival Master!" : "Game Over"}
              </span>
            ) : (
              `${word.includes(" ") ? `${word.split(" ").length}-word phrase` : "Single word"} • ${wordChars.filter(c => c !== " ").length} letters`
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
        <div className="flex gap-4 mt-auto w-full">
          {(!hideReset) && (
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
          )}

          {!(isWinner || isLoser) && (
            <button
              onClick={provideHint}
              disabled={!canGetHint}
              title={
                hintsUsed >= 2 
                  ? "Maximum 2 hints allowed per game" 
                  : unrevealedCount <= 1 
                  ? "No hint available when only 1 letter is remaining" 
                  : "Reveal a random missing letter"
              }
              className={`flex-1 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-sm transition-all flex items-center justify-center gap-2 ${hideReset ? 'w-full' : ''} ${
                canGetHint
                  ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100"
                  : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-80"
              }`}
            >
              <Lightbulb className={`w-5 h-5 ${canGetHint ? 'text-amber-500 fill-amber-100' : 'text-slate-400'}`} />
              <span>
                {hintsUsed >= 2 
                  ? "Max Hints (2/2)" 
                  : unrevealedCount <= 1 
                  ? "1 Letter Left (No Hint)" 
                  : `Get Hint (${2 - hintsUsed} left)`}
              </span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

// ----------------------------------------------------------------------
// Classic Game View
// ----------------------------------------------------------------------
function ClassicGame({ onChallengeUnlocked }: { onChallengeUnlocked?: (title: string) => void }) {
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
  }, [resetGame]);

  return (
    <GameBoard 
      word={wordData.word} 
      category="Can you guess the word?" 
      guessedLetters={guessedLetters}
      setGuessedLetters={setGuessedLetters}
      streak={streak}
      showStreak={true}
      label="Classic Mode"
      infoNode={
        wordData.word !== 'LOADING' && (
          <div className="flex gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100">{wordData.category}</span>
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">Diff: {getDifficulty(wordData.word)}</span>
          </div>
        )
      }
      resetGame={resetGame}
      onWin={({ hintsUsed, mistakes }) => {
        const newStreak = streak + 1;
        setStreak(newStreak);
        saveClassicStreak(newStreak);

        const newlyCompleted = recordGameWin({
          mode: 'classic',
          mistakes,
          hintsUsed,
          category: wordData.category,
          difficulty: getDifficulty(wordData.word),
          streak: newStreak
        });

        if (newlyCompleted.length > 0) {
          onChallengeUnlocked?.(newlyCompleted[0]);
        }
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
            className="flex-1 min-w-0 bg-transparent border-none text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-0 p-1 sm:p-2 truncate"
          >
            <option value="any">⭐ All Categories</option>
            {Object.keys(categories).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="w-[1px] bg-slate-200 mx-1 shrink-0"></div>
          <select 
            value={difficulty} 
            onChange={e => setDifficulty(e.target.value as Difficulty)} 
            className="flex-1 min-w-0 bg-transparent border-none text-sm font-medium text-slate-700 outline-none cursor-pointer focus:ring-0 p-1 sm:p-2 truncate"
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
function DailyGame({ onChallengeUnlocked }: { onChallengeUnlocked?: (title: string) => void }) {
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
          addHistoricalDailyWord(aiData.word);
          const newState: DailyState = {
            ...dailyState,
            puzzleDate: today,
            puzzleWord: aiData.word.toUpperCase(),
            puzzleHint: aiData.hint,
            puzzleCategory: aiData.category,
            puzzleDifficulty: aiData.difficulty,
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

  const handleWin = ({ hintsUsed, mistakes }: { hintsUsed: number; mistakes: number }) => {
     if (isAlreadyPlayedToday) return;
     const newStreak = dailyState.streak + 1;
     const newState = { ...dailyState, lastCompletedDate: today, streak: newStreak };
     setDailyState(newState);
     saveDailyState(newState);

     const newlyCompleted = recordGameWin({
       mode: 'daily',
       mistakes,
       hintsUsed,
       category: dailyState.puzzleCategory || 'AI Daily',
       difficulty: dailyState.puzzleDifficulty || 'medium',
       streak: newStreak
     });

     if (newlyCompleted.length > 0) {
       onChallengeUnlocked?.(newlyCompleted[0]);
     }
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
         category={dailyState.puzzleCategory || "AI Puzzle Mystery"}
         label="Category"
         infoNode={
           dailyState.puzzleDifficulty && (
             <div className="flex gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
               <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">Diff: {dailyState.puzzleDifficulty}</span>
             </div>
           )
         }
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
    const words = wordsToAdd.split(',').map(w => w.trim().toUpperCase().replace(/\s+/g, ' ')).filter(w => w.match(/^[A-Z\s]+$/) && w.length > 0);
    const result = addWords(selectedCat, words);
    setWordsToAdd("");
    setCategories(getLocalCategories());
    
    let msg = `Added ${result.added} items to ${selectedCat}.`;
    if (result.skipped > 0) {
      msg += `\nSkipped ${result.skipped} duplicates.`;
    }
    alert(msg);
  };

  const handleExport = () => {
    const data = exportAppData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `hangman-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importAppData(content)) {
        alert("Restore successful! The app will now reload.");
        window.location.reload();
      } else {
        alert("Invalid backup file. Please try again.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manage Puzzle Library</h2>
        <p className="text-slate-500 text-sm">Add custom categories and words/phrases to play in Classic mode.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add Category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Add Category</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Create a new category name (e.g. MOVIES, GEOGRAPHY).</p>
            <input 
              type="text" 
              placeholder="CATEGORY NAME" 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-4"
            />
          </div>
          <button 
            onClick={handleAddCat}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            Create Category
          </button>
        </div>

        {/* Add Words */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Add Words & Phrases</h3>
            </div>
            <div className="mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Category</label>
              <select 
                value={selectedCat} 
                onChange={e => setSelectedCat(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                {categoryKeys.map(c => <option key={c} value={c}>{c} ({categories[c]?.length || 0} words)</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Words or Phrases (comma separated)</label>
              <textarea 
                placeholder="APPLE, BANANA, GRAND CANYON" 
                value={wordsToAdd} 
                onChange={e => setWordsToAdd(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-20 uppercase resize-none"
              />
            </div>
          </div>
          <button 
            onClick={handleAddWords}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            Add Words
          </button>
        </div>

        {/* Backup & Restore */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Backup & Restore</h3>
              <p className="text-xs text-slate-400">Export or import your entire library and app settings.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleExport}
              className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group"
            >
              <Download className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              Download Backup (.json)
            </button>
            
            <label className="flex-1 cursor-pointer">
              <div className="h-full bg-white border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                Restore from File
              </div>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleImport}
              />
            </label>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center uppercase tracking-widest font-bold">
            All current data will be overwritten when restoring.
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm font-medium text-slate-400 bg-white p-4 rounded-xl border border-slate-200 border-dashed">
        Database Sync: <span className="text-slate-700">{(Object.values(categories) as string[][]).reduce((acc, arr) => acc + arr.length, 0)}</span> words active across <span className="text-slate-700">{categoryKeys.length}</span> categories.
      </div>
    </div>
  );
}

