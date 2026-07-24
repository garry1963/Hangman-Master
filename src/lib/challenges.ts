export interface Challenge {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  iconName: string;
}

export interface ChallengeState {
  dailyResetDate: string; // YYYY-MM-DD
  weeklyResetKey: string;  // YYYY-Wxx
  progress: Record<string, number>;
  claimed: Record<string, boolean>;
  totalXp: number;
  categoriesWonThisWeek: string[];
}

export const DAILY_CHALLENGES: Challenge[] = [
  {
    id: 'd_daily_puzzle',
    type: 'daily',
    title: 'Daily Conqueror',
    description: "Complete today's Daily AI Puzzle",
    target: 1,
    rewardXp: 150,
    iconName: 'Calendar'
  },
  {
    id: 'd_win_games',
    type: 'daily',
    title: 'Word Hunter',
    description: 'Win 3 games in Classic or Daily mode',
    target: 3,
    rewardXp: 120,
    iconName: 'Trophy'
  },
  {
    id: 'd_flawless',
    type: 'daily',
    title: 'Flawless Victory',
    description: 'Win a game with 0 mistakes',
    target: 1,
    rewardXp: 150,
    iconName: 'ShieldCheck'
  },
  {
    id: 'd_no_hints',
    type: 'daily',
    title: 'Pure Intuition',
    description: 'Win a game without using any hints',
    target: 1,
    rewardXp: 120,
    iconName: 'Zap'
  },
  {
    id: 'd_guess_letters',
    type: 'daily',
    title: 'Letter Smith',
    description: 'Correctly guess 12 letters across games',
    target: 12,
    rewardXp: 80,
    iconName: 'Type'
  }
];

export const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: 'w_marathon',
    type: 'weekly',
    title: 'Weekly Champion',
    description: 'Win 8 games this week',
    target: 8,
    rewardXp: 400,
    iconName: 'Award'
  },
  {
    id: 'w_hard_mode',
    type: 'weekly',
    title: 'Hardcore Hanger',
    description: 'Win 2 games on Hard difficulty',
    target: 2,
    rewardXp: 350,
    iconName: 'Flame'
  },
  {
    id: 'w_categories',
    type: 'weekly',
    title: 'Category Master',
    description: 'Win games in 3 different categories',
    target: 3,
    rewardXp: 300,
    iconName: 'Grid'
  },
  {
    id: 'w_streak',
    type: 'weekly',
    title: 'Streak Legend',
    description: 'Reach a win streak of 4 in Classic mode',
    target: 4,
    rewardXp: 350,
    iconName: 'TrendingUp'
  },
  {
    id: 'w_daily_puzzles',
    type: 'weekly',
    title: 'Daily Devotee',
    description: 'Solve 3 Daily AI Puzzles this week',
    target: 3,
    rewardXp: 500,
    iconName: 'Sparkles'
  }
];

export const ALL_CHALLENGES = [...DAILY_CHALLENGES, ...WEEKLY_CHALLENGES];

export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function getWeeklyKey(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number (Sunday is 0, Monday is 1)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export interface AutoClaimedChallenge {
  id: string;
  title: string;
  rewardXp: number;
}

export function autoCollectRewards(state: ChallengeState): AutoClaimedChallenge[] {
  const newlyClaimed: AutoClaimedChallenge[] = [];
  let stateChanged = false;

  ALL_CHALLENGES.forEach(c => {
    const prog = state.progress[c.id] || 0;
    if (prog >= c.target && !state.claimed[c.id]) {
      state.claimed[c.id] = true;
      state.totalXp += c.rewardXp;
      newlyClaimed.push({
        id: c.id,
        title: c.title,
        rewardXp: c.rewardXp
      });
      stateChanged = true;
    }
  });

  if (stateChanged) {
    saveChallengeState(state);
  }

  return newlyClaimed;
}

export function getChallengeState(): ChallengeState {
  const stored = localStorage.getItem('hangman_challenges');
  const today = getTodayKey();
  const week = getWeeklyKey();

  let state: ChallengeState = {
    dailyResetDate: today,
    weeklyResetKey: week,
    progress: {},
    claimed: {},
    totalXp: 0,
    categoriesWonThisWeek: []
  };

  if (stored) {
    try {
      state = JSON.parse(stored);
    } catch { }
  }

  let stateChanged = false;

  // Reset daily challenges if date changed
  if (state.dailyResetDate !== today) {
    state.dailyResetDate = today;
    DAILY_CHALLENGES.forEach(c => {
      delete state.progress[c.id];
      delete state.claimed[c.id];
    });
    stateChanged = true;
  }

  // Reset weekly challenges if week changed
  if (state.weeklyResetKey !== week) {
    state.weeklyResetKey = week;
    state.categoriesWonThisWeek = [];
    WEEKLY_CHALLENGES.forEach(c => {
      delete state.progress[c.id];
      delete state.claimed[c.id];
    });
    stateChanged = true;
  }

  if (stateChanged) {
    saveChallengeState(state);
  }

  // Automatically collect any pending completed rewards
  autoCollectRewards(state);

  return state;
}

export function saveChallengeState(state: ChallengeState) {
  localStorage.setItem('hangman_challenges', JSON.stringify(state));
}

export interface GameWinEvent {
  mode: 'classic' | 'daily';
  mistakes: number;
  hintsUsed: number;
  category: string;
  difficulty: string;
  streak: number;
}

export function recordGameWin(event: GameWinEvent): AutoClaimedChallenge[] {
  const state = getChallengeState();

  const updateProgress = (id: string, amountToAdd: number) => {
    const challenge = ALL_CHALLENGES.find(c => c.id === id);
    if (!challenge) return;
    const current = state.progress[id] || 0;
    state.progress[id] = current + amountToAdd;
  };

  const setProgressMax = (id: string, value: number) => {
    const challenge = ALL_CHALLENGES.find(c => c.id === id);
    if (!challenge) return;
    const current = state.progress[id] || 0;
    state.progress[id] = Math.max(current, value);
  };

  // 1. Overall wins
  updateProgress('d_win_games', 1);
  updateProgress('w_marathon', 1);

  // 2. Daily mode specific
  if (event.mode === 'daily') {
    updateProgress('d_daily_puzzle', 1);
    updateProgress('w_daily_puzzles', 1);
  }

  // 3. Flawless win (0 mistakes)
  if (event.mistakes === 0) {
    updateProgress('d_flawless', 1);
  }

  // 4. No hints win
  if (event.hintsUsed === 0) {
    updateProgress('d_no_hints', 1);
  }

  // 5. Hard difficulty win
  if (event.difficulty === 'hard') {
    updateProgress('w_hard_mode', 1);
  }

  // 6. Streak target
  if (event.streak > 0) {
    setProgressMax('w_streak', event.streak);
  }

  // 7. Categories won
  if (event.category && !state.categoriesWonThisWeek.includes(event.category)) {
    state.categoriesWonThisWeek.push(event.category);
  }
  setProgressMax('w_categories', state.categoriesWonThisWeek.length);

  saveChallengeState(state);

  // Auto collect XP rewards for newly completed challenges
  return autoCollectRewards(state);
}

export function recordCorrectLetterGuess(): AutoClaimedChallenge[] {
  const state = getChallengeState();
  const id = 'd_guess_letters';
  const challenge = DAILY_CHALLENGES.find(c => c.id === id);
  if (!challenge) return [];

  const current = state.progress[id] || 0;
  state.progress[id] = current + 1;
  saveChallengeState(state);

  return autoCollectRewards(state);
}

export function claimChallengeReward(id: string): number {
  const state = getChallengeState();
  const challenge = ALL_CHALLENGES.find(c => c.id === id);
  if (!challenge || state.claimed[id]) return 0;

  const currentProgress = state.progress[id] || 0;
  if (currentProgress < challenge.target) return 0;

  state.claimed[id] = true;
  state.totalXp += challenge.rewardXp;
  saveChallengeState(state);

  return challenge.rewardXp;
}

export function getUnclaimedCount(): number {
  const state = getChallengeState();
  let unclaimed = 0;
  ALL_CHALLENGES.forEach(c => {
    const prog = state.progress[c.id] || 0;
    if (prog >= c.target && !state.claimed[c.id]) {
      unclaimed++;
    }
  });
  return unclaimed;
}

export function getRankDetails(totalXp: number): { level: number; title: string; currentXp: number; nextXp: number } {
  const levels = [
    { level: 1, title: 'Novice Guesser', xp: 0 },
    { level: 2, title: 'Letter Scout', xp: 200 },
    { level: 3, title: 'Word Detective', xp: 500 },
    { level: 4, title: 'Vocab Virtuoso', xp: 1000 },
    { level: 5, title: 'Puzzle Master', xp: 1800 },
    { level: 6, title: 'Hangman Champion', xp: 2800 },
    { level: 7, title: 'Grandmaster of Words', xp: 4200 }
  ];

  let current = levels[0];
  let next = levels[1];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXp >= levels[i].xp) {
      current = levels[i];
      next = levels[i + 1] || { level: levels[i].level + 1, title: 'Grandmaster Legend', xp: levels[i].xp + 2000 };
      break;
    }
  }

  return {
    level: current.level,
    title: current.title,
    currentXp: totalXp,
    nextXp: next.xp
  };
}
