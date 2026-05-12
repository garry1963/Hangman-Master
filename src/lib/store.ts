import { CATEGORIES as defaultCategories } from '../words';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'any';

export function getLocalCategories(): Record<string, string[]> {
  const stored = localStorage.getItem('hangman_categories');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }
  return defaultCategories;
}

export function saveLocalCategories(cats: Record<string, string[]>) {
  localStorage.setItem('hangman_categories', JSON.stringify(cats));
}

export function addCategory(name: string) {
  const cats = getLocalCategories();
  if (!cats[name]) {
    cats[name] = [];
    saveLocalCategories(cats);
  }
}

export function addWords(category: string, words: string[]) {
  const cats = getLocalCategories();
  if (!cats[category]) cats[category] = [];
  
  const current = new Set(cats[category].map(w => w.toUpperCase()));
  words.forEach(w => {
    const clean = w.trim().toUpperCase();
    if (clean) current.add(clean);
  });
  
  cats[category] = Array.from(current);
  saveLocalCategories(cats);
}

export interface DifficultyStats {
  easy: number;
  medium: number;
  hard: number;
}

export function getDifficulty(word: string): Difficulty {
  if (word.length <= 5) return 'easy';
  if (word.length <= 8) return 'medium';
  return 'hard';
}

export function getRandomWordByConfig(category: string, difficulty: Difficulty): { word: string; category: string } | null {
  const cats = getLocalCategories();
  let availableWords: { word: string, category: string }[] = [];

  const addFromCat = (catName: string) => {
    const words = cats[catName] || [];
    words.forEach(w => {
      const wDiff = getDifficulty(w);
      if (difficulty === 'any' || wDiff === difficulty) {
        availableWords.push({ word: w, category: catName });
      }
    });
  };

  if (category === 'any') {
    Object.keys(cats).forEach(addFromCat);
  } else {
    addFromCat(category);
  }

  if (availableWords.length === 0) return null;

  return availableWords[Math.floor(Math.random() * availableWords.length)];
}

export interface DailyState {
  lastCompletedDate: string | null;
  streak: number;
  puzzleWord: string | null;
  puzzleHint: string | null;
  puzzleDate: string | null;
}

export function getDailyState(): DailyState {
  const stored = localStorage.getItem('hangman_daily');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { }
  }
  return { lastCompletedDate: null, streak: 0, puzzleWord: null, puzzleHint: null, puzzleDate: null };
}

export function saveDailyState(state: DailyState) {
  localStorage.setItem('hangman_daily', JSON.stringify(state));
}

// Check if streak is broken
export function checkDailyStreak() {
  const state = getDailyState();
  if (!state.lastCompletedDate) return state;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const last = new Date(state.lastCompletedDate);
  last.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    state.streak = 0;
    saveDailyState(state);
  }
  return state;
}

// Basic streak for classic mode
export function getClassicStreak(): number {
  return parseInt(localStorage.getItem('hangman_classic_streak') || '0', 10);
}
export function saveClassicStreak(streak: number) {
  localStorage.setItem('hangman_classic_streak', streak.toString());
}
