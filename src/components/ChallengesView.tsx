import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Award, ShieldCheck, Zap, Type, 
  Flame, Grid, TrendingUp, Sparkles, CheckCircle2, Clock, Star 
} from 'lucide-react';
import { 
  DAILY_CHALLENGES, WEEKLY_CHALLENGES, Challenge, 
  getChallengeState, getRankDetails 
} from '../lib/challenges';

const ICON_MAP: Record<string, React.ReactNode> = {
  Calendar: <Calendar className="w-5 h-5 text-indigo-600" />,
  Trophy: <Trophy className="w-5 h-5 text-amber-500" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
  Zap: <Zap className="w-5 h-5 text-amber-600" />,
  Type: <Type className="w-5 h-5 text-indigo-500" />,
  Award: <Award className="w-5 h-5 text-purple-600" />,
  Flame: <Flame className="w-5 h-5 text-rose-500" />,
  Grid: <Grid className="w-5 h-5 text-blue-600" />,
  TrendingUp: <TrendingUp className="w-5 h-5 text-teal-600" />,
  Sparkles: <Sparkles className="w-5 h-5 text-indigo-600" />
};

export function ChallengesView() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const [state, setState] = useState(() => getChallengeState());
  const [dailyTimeLeft, setDailyTimeLeft] = useState('');
  const [weeklyTimeLeft, setWeeklyTimeLeft] = useState('');

  // Always sync state on mount and tab change
  useEffect(() => {
    setState(getChallengeState());
  }, [activeTab]);

  // Update timers
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      
      // Daily reset: Midnight tonight
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMsDaily = midnight.getTime() - now.getTime();
      const hoursDaily = Math.floor(diffMsDaily / (1000 * 60 * 60));
      const minsDaily = Math.floor((diffMsDaily % (1000 * 60 * 60)) / (1000 * 60));
      setDailyTimeLeft(`${hoursDaily}h ${minsDaily}m`);

      // Weekly reset: Next Monday midnight
      const nextMonday = new Date(now);
      const day = nextMonday.getDay();
      const daysUntilMonday = ((8 - (day === 0 ? 7 : day)) % 7) || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      const diffMsWeekly = nextMonday.getTime() - now.getTime();
      const daysWeekly = Math.floor(diffMsWeekly / (1000 * 60 * 60 * 24));
      const hoursWeekly = Math.floor((diffMsWeekly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setWeeklyTimeLeft(`${daysWeekly}d ${hoursWeekly}h`);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, []);

  const rank = getRankDetails(state.totalXp);
  const challenges = activeTab === 'daily' ? DAILY_CHALLENGES : WEEKLY_CHALLENGES;

  // XP Progress math
  const xpInCurrentLevel = state.totalXp;
  const xpNeededForNext = rank.nextXp;
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100));

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Level / Rank Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-6 border border-indigo-500/20 relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/20 border-2 border-amber-400/40 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Star className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wide">
                  Level {rank.level}
                </span>
                <span className="text-slate-400 text-xs font-semibold">Rank Title</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">{rank.title}</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">XP rewards auto-collect instantly upon completion!</p>
            </div>
          </div>

          <div className="w-full md:w-64 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Total XP</span>
              <span className="text-amber-400 flex items-center gap-1 font-mono text-sm">
                <Sparkles className="w-3.5 h-3.5" /> {state.totalXp} XP
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 text-right">
              {xpInCurrentLevel} / {xpNeededForNext} XP to Level {rank.level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Collect Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 mb-6 flex items-center gap-3 text-emerald-900 text-xs sm:text-sm font-semibold shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-600" />
        </div>
        <span><strong>Auto Collect Active:</strong> Challenge XP rewards are automatically claimed and added to your level progress as soon as you meet the target!</span>
      </div>

      {/* Challenge Category Selector */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex bg-slate-200/70 p-1 rounded-2xl border border-slate-300/50">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Challenges</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'weekly'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Weekly Challenges</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Resets in <strong className="text-slate-700">{activeTab === 'daily' ? dailyTimeLeft : weeklyTimeLeft}</strong></span>
        </div>
      </div>

      {/* Challenge Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {challenges.map((c: Challenge) => {
          const currentProgress = state.progress[c.id] || 0;
          const isCompleted = currentProgress >= c.target;
          const isClaimed = !!state.claimed[c.id] || isCompleted;
          const percent = Math.min(100, Math.round((currentProgress / c.target) * 100));

          return (
            <div 
              key={c.id} 
              className={`bg-white rounded-2xl p-5 border shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                isClaimed 
                  ? 'border-emerald-200 bg-emerald-50/30' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isClaimed 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {ICON_MAP[c.iconName] || <Trophy className="w-5 h-5 text-indigo-600" />}
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">{c.title}</h3>
                    <span className="text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      +{c.rewardXp} XP
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{c.description}</p>
                  
                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isClaimed ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 shrink-0 font-mono">
                      {Math.min(currentProgress, c.target)} / {c.target}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="w-full sm:w-auto shrink-0 flex justify-end">
                {isClaimed ? (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-4 py-2.5 rounded-xl border border-emerald-200/80 w-full sm:w-auto justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Auto-Collected (+{c.rewardXp} XP)</span>
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-slate-400 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/60 text-center w-full sm:w-auto">
                    In Progress
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
