import React, { useState, useEffect, useRef, useCallback } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { create } from 'https://esm.sh/zustand@4.3.8?deps=react@18.2.0';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.12.16?deps=react@18.2.0,react-dom@18.2.0';
import confetti from 'https://esm.sh/canvas-confetti@1.6.0';

// ==========================================
// CONSTANTS & HELPERS
// ==========================================
const STORAGE_KEY = 'heroforge_game_state';
const AVATAR_STORAGE_KEY = 'heroforge_avatar_image';

const STAT_CONFIG = {
  STR: { label: '체력', icon: '💪', color: 'rgb(239, 68, 68)',   bgClass: 'bg-red-500',    borderClass: 'border-red-500/30',  textClass: 'text-red-400',    bgLight: 'bg-red-500/10' },
  AGI: { label: '민첩', icon: '⚡', color: 'rgb(34, 197, 94)',   bgClass: 'bg-green-500',  borderClass: 'border-green-500/30', textClass: 'text-green-400',  bgLight: 'bg-green-500/10' },
  VIT: { label: '활력', icon: '❤️', color: 'rgb(249, 115, 22)',  bgClass: 'bg-orange-500', borderClass: 'border-orange-500/30', textClass: 'text-orange-400', bgLight: 'bg-orange-500/10' },
  INT: { label: '지력', icon: '🧠', color: 'rgb(59, 130, 246)',  bgClass: 'bg-blue-500',   borderClass: 'border-blue-500/30',  textClass: 'text-blue-400',   bgLight: 'bg-blue-500/10' },
  WIS: { label: '지혜', icon: '📖', color: 'rgb(168, 85, 247)',  bgClass: 'bg-purple-500', borderClass: 'border-purple-500/30', textClass: 'text-purple-400', bgLight: 'bg-purple-500/10' },
  CHA: { label: '매력', icon: '✨', color: 'rgb(236, 72, 153)',  bgClass: 'bg-pink-500',   borderClass: 'border-pink-500/30',  textClass: 'text-pink-400',   bgLight: 'bg-pink-500/10' },
};

const DIFFICULTY_CONFIG = {
  easy:   { label: '기본',   xp: 30,  gp: 10, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  medium: { label: '도전',   xp: 60,  gp: 25, color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/25' },
  hard:   { label: '고난도', xp: 120, gp: 50, color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/25' },
  epic:   { label: '전설',   xp: 250, gp: 100, color: 'text-purple-400', bg: 'bg-purple-500/15',  border: 'border-purple-500/25' },
};

const DEFAULT_QUESTS = [
  {
    id: 'q1',
    title: '코어 과목(국/영/수) 3시간 집중력 유지하기',
    difficulty: 'hard',
    statReward: { INT: 3, WIS: 2 },
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: 'q2',
    title: '인공지능(AI) 알고리즘 파이썬 코딩 구현',
    difficulty: 'epic',
    statReward: { INT: 4, AGI: 2 },
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: 'q3',
    title: '기술 윤리 및 노동 인권 관련 회고 일지 작성',
    difficulty: 'medium',
    statReward: { WIS: 3, CHA: 1 },
    completed: false,
    createdAt: Date.now(),
  },
];

function getExpForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

// ==========================================
// INITIAL STATE
// ==========================================
function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate it has essential fields
      if (parsed && typeof parsed.level === 'number' && parsed.stats && parsed.quests) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('HeroForge: 저장된 데이터 로드 실패, 초기화합니다.', e);
  }

  return {
    characterName: '영웅',
    characterClass: '수련생',
    level: 1,
    exp: 0,
    gold: 0,
    streak: 0,
    lastActiveDay: null,
    stats: {
      STR: 1, AGI: 1, VIT: 1, INT: 1, WIS: 1, CHA: 1,
    },
    statPoints: 0,
    quests: DEFAULT_QUESTS,
    activities: [],
    completedToday: 0,
    totalCompleted: 0,
  };
}

// ==========================================
// ZUSTAND STORE
// ==========================================
const useGameStore = create((set, get) => ({
  ...getInitialState(),

  // Save to localStorage whenever state changes
  _persist: () => {
    const state = get();
    const toSave = {
      characterName: state.characterName,
      characterClass: state.characterClass,
      level: state.level,
      exp: state.exp,
      gold: state.gold,
      streak: state.streak,
      lastActiveDay: state.lastActiveDay,
      stats: state.stats,
      statPoints: state.statPoints,
      quests: state.quests,
      activities: state.activities,
      completedToday: state.completedToday,
      totalCompleted: state.totalCompleted,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch(e) {}
  },

  setCharacterName: (name) => {
    set({ characterName: name });
    get()._persist();
  },

  setCharacterClass: (cls) => {
    set({ characterClass: cls });
    get()._persist();
  },

  completeQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.completed) return null;

    const diff = DIFFICULTY_CONFIG[quest.difficulty];
    const xpGain = diff.xp;
    const gpGain = diff.gp;

    let newExp = state.exp + xpGain;
    let newLevel = state.level;
    let maxExp = getExpForLevel(state.level);
    let newStatPoints = state.statPoints;
    let leveledUp = false;

    while (newExp >= maxExp) {
      newExp -= maxExp;
      newLevel += 1;
      newStatPoints += 3;
      maxExp = getExpForLevel(newLevel);
      leveledUp = true;
    }

    const newStats = { ...state.stats };
    if (quest.statReward) {
      Object.entries(quest.statReward).forEach(([stat, amount]) => {
        newStats[stat] = Math.min(100, (newStats[stat] || 1) + amount);
      });
    }

    const today = getTodayKey();
    let newStreak = state.streak;
    if (state.lastActiveDay !== today) {
      // Check if yesterday was active
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      if (state.lastActiveDay === yesterdayKey) {
        newStreak += 1;
      } else if (state.lastActiveDay !== today) {
        newStreak = 1;
      }
    }

    const newActivity = {
      id: Date.now(),
      text: `"${quest.title}" 달성 완료!`,
      xp: xpGain,
      gp: gpGain,
      statReward: quest.statReward,
      timestamp: Date.now(),
      type: 'quest',
    };

    const levelActivity = leveledUp ? {
      id: Date.now() + 1,
      text: `🎉 레벨 ${newLevel} 달성!`,
      timestamp: Date.now(),
      type: 'level',
    } : null;

    const newActivities = [
      ...(levelActivity ? [levelActivity] : []),
      newActivity,
      ...state.activities,
    ].slice(0, 20);

    set({
      quests: state.quests.map(q => q.id === questId ? { ...q, completed: true, completedAt: Date.now() } : q),
      exp: newExp,
      level: newLevel,
      gold: state.gold + gpGain,
      stats: newStats,
      statPoints: newStatPoints,
      streak: newStreak,
      lastActiveDay: today,
      activities: newActivities,
      completedToday: (state.lastActiveDay === today ? state.completedToday : 0) + 1,
      totalCompleted: state.totalCompleted + 1,
    });

    get()._persist();

    return { leveledUp, newLevel, xpGain, gpGain };
  },

  addQuest: (title, difficulty, statReward) => {
    const state = get();
    const newQuest = {
      id: `q_${Date.now()}`,
      title,
      difficulty: difficulty || 'medium',
      statReward: statReward || { INT: 1 },
      completed: false,
      createdAt: Date.now(),
    };
    set({ quests: [...state.quests, newQuest] });
    get()._persist();
  },

  removeQuest: (questId) => {
    const state = get();
    set({ quests: state.quests.filter(q => q.id !== questId) });
    get()._persist();
  },

  allocateStat: (statKey) => {
    const state = get();
    if (state.statPoints <= 0) return;
    set({
      stats: { ...state.stats, [statKey]: Math.min(100, state.stats[statKey] + 1) },
      statPoints: state.statPoints - 1,
    });
    get()._persist();
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AVATAR_STORAGE_KEY);
    const fresh = {
      characterName: '영웅',
      characterClass: '수련생',
      level: 1,
      exp: 0,
      gold: 0,
      streak: 0,
      lastActiveDay: null,
      stats: { STR: 1, AGI: 1, VIT: 1, INT: 1, WIS: 1, CHA: 1 },
      statPoints: 0,
      quests: DEFAULT_QUESTS.map(q => ({ ...q, completed: false, completedAt: undefined })),
      activities: [],
      completedToday: 0,
      totalCompleted: 0,
    };
    set(fresh);
  },
}));


// ==========================================
// AVATAR HOOK
// ==========================================
function useAvatar() {
  const [avatarSrc, setAvatarSrc] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
      if (saved) setAvatarSrc(saved);
    } catch(e) {}
  }, []);

  const uploadAvatar = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, base64);
        setAvatarSrc(base64);
      } catch(err) {
        alert('이미지가 너무 큽니다. 더 작은 이미지를 사용해주세요.');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeAvatar = useCallback(() => {
    localStorage.removeItem(AVATAR_STORAGE_KEY);
    setAvatarSrc(null);
  }, []);

  return { avatarSrc, uploadAvatar, removeAvatar };
}


// ==========================================
// COMPONENTS
// ==========================================

// --- Progress Ring (Circular) ---
const ProgressRing = ({ progress, size = 100, strokeWidth = 8, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="transparent"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size/2} cy={size/2} r={radius}
        fill="transparent"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-circle"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
};


// --- Avatar Display ---
const AvatarDisplay = ({ avatarSrc, onUpload, level }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className="avatar-glow w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-2 border-purple-500/30 flex items-center justify-center overflow-hidden cursor-pointer group"
        onClick={handleClick}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt="아바타" className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl md:text-6xl select-none">⚔️</span>
        )}
        <div className="avatar-upload-overlay rounded-2xl">
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] text-white/80 font-medium">사진 변경</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {/* Level Badge */}
      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm px-3 py-1 rounded-xl shadow-lg shadow-amber-500/40">
        Lv.{level}
      </div>
    </div>
  );
};


// --- Stat Bar (Horizontal) ---
const StatBar = ({ statKey, value, onAllocate, canAllocate }) => {
  const config = STAT_CONFIG[statKey];
  const percentage = Math.min(100, (value / 100) * 100);

  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{config.icon}</span>
          <span className={`text-sm font-bold ${config.textClass} uppercase tracking-wider`}>{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white/90 tabular-nums">{value}</span>
          {canAllocate && (
            <button
              onClick={() => onAllocate(statKey)}
              className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/30 hover:border-amber-500/50 transition-all active:scale-90"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="h-3.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`h-full ${config.bgClass} relative stat-bar-shimmer rounded-full`}
          style={{ boxShadow: `0 0 12px ${config.color}40` }}
        />
      </div>
    </div>
  );
};


// --- Quest Item (Main Focus) ---
const QuestItem = ({ quest, onComplete, onRemove }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const diff = DIFFICULTY_CONFIG[quest.difficulty];
  const itemRef = useRef(null);

  const handleComplete = () => {
    if (quest.completed) return;
    setShowConfetti(true);

    // Trigger confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#fbbf24', '#a855f7', '#6366f1', '#22c55e', '#ec4899'],
    });

    const result = onComplete(quest.id);

    setTimeout(() => setShowConfetti(false), 1000);
  };

  return (
    <motion.div
      ref={itemRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
        quest.completed
          ? 'bg-white/[0.02] border-white/5'
          : 'glass-light border-white/8 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'
      }`}
    >
      <div className={`p-5 md:p-6 ${quest.completed ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-4">
          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={quest.completed}
            className={`flex-shrink-0 mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
              quest.completed
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 text-white'
                : 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10 cursor-pointer active:scale-90'
            }`}
          >
            {quest.completed && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="check-animate text-lg font-bold"
              >
                ✓
              </motion.span>
            )}
          </button>

          {/* Quest Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${diff.bg} ${diff.color} ${diff.border} border`}>
                {diff.label}
              </span>
              {quest.statReward && Object.entries(quest.statReward).map(([stat, val]) => (
                <span key={stat} className={`text-xs font-medium px-2 py-0.5 rounded-md ${STAT_CONFIG[stat]?.bgLight} ${STAT_CONFIG[stat]?.textClass}`}>
                  {STAT_CONFIG[stat]?.icon} +{val}
                </span>
              ))}
            </div>

            <h3 className={`quest-strikethrough text-lg md:text-xl font-bold leading-snug ${
              quest.completed ? 'text-white/40 completed' : 'text-white/95'
            }`}>
              {quest.title}
            </h3>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-purple-300/80">
                <span>⚡</span> {diff.xp} XP
              </span>
              <span className="flex items-center gap-1.5 text-amber-300/80">
                <span>🪙</span> {diff.gp} GP
              </span>
            </div>
          </div>

          {/* Remove Button */}
          {!quest.completed && (
            <button
              onClick={() => onRemove(quest.id)}
              className="flex-shrink-0 w-8 h-8 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Completion Overlay */}
      {quest.completed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-3 right-3"
        >
          <span className="text-xs font-bold text-purple-400/60 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/15">
            ✨ 달성 완료
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};


// --- Add Quest Modal ---
const AddQuestModal = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedStats, setSelectedStats] = useState({ INT: 1 });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleStat = (stat) => {
    setSelectedStats(prev => {
      if (prev[stat]) {
        const next = { ...prev };
        delete next[stat];
        return next;
      }
      return { ...prev, [stat]: 1 };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), difficulty, selectedStats);
    setTitle('');
    setDifficulty('medium');
    setSelectedStats({ INT: 1 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="relative glass rounded-3xl p-8 w-full max-w-lg border border-purple-500/20 shadow-2xl shadow-purple-500/10"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          새로운 목표 추가
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-2">목표 내용</label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="오늘 달성할 구체적인 목표를 입력하세요"
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-3">난이도</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDifficulty(key)}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    difficulty === key
                      ? `${val.bg} ${val.color} ${val.border} ring-2 ring-current/20`
                      : 'bg-white/3 border-white/8 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {val.label}
                  <div className="text-[10px] mt-0.5 opacity-60">{val.xp}XP</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stat Reward */}
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-3">능력치 보상 (선택)</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STAT_CONFIG).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleStat(key)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    selectedStats[key]
                      ? `${val.bgLight} ${val.textClass} ${val.borderClass} ring-1 ring-current/20`
                      : 'bg-white/3 border-white/8 text-white/30 hover:bg-white/5'
                  }`}
                >
                  {val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-semibold hover:bg-white/8 transition-all text-base"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base active:scale-[0.97]"
            >
              추가하기
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};


// --- Level Up Overlay ---
const LevelUpOverlay = ({ level, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer"
    >
      <div className="level-up-overlay flex flex-col items-center gap-4">
        <span className="text-7xl">🌟</span>
        <h2 className="font-fantasy text-5xl md:text-7xl gold-text font-black tracking-wider">
          LEVEL UP!
        </h2>
        <p className="text-2xl text-purple-200 font-bold">레벨 {level} 달성!</p>
        <p className="text-white/40 text-sm mt-2">능력치 포인트 +3 획득</p>
      </div>
    </motion.div>
  );
};


// --- Settings Panel ---
const SettingsPanel = ({ isOpen, onClose }) => {
  const { characterName, setCharacterName, characterClass, setCharacterClass, resetAll } = useGameStore();
  const { avatarSrc, uploadAvatar, removeAvatar } = useAvatar();
  const [editName, setEditName] = useState(characterName);
  const [editClass, setEditClass] = useState(characterClass);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setEditName(characterName);
    setEditClass(characterClass);
    setConfirmReset(false);
  }, [isOpen, characterName, characterClass]);

  const handleSave = () => {
    if (editName.trim()) setCharacterName(editName.trim());
    if (editClass.trim()) setCharacterClass(editClass.trim());
    onClose();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetAll();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="relative glass rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">⚙️</span>
          설정
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">캐릭터 이름</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">클래스 (직업)</label>
            <input
              type="text"
              value={editClass}
              onChange={(e) => setEditClass(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">아바타 이미지</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="아바타" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">⚔️</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition-all"
                >
                  업로드
                </button>
                {avatarSrc && (
                  <button
                    onClick={removeAvatar}
                    className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all"
                  >
                    삭제
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); e.target.value = ''; }}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
                confirmReset
                  ? 'bg-red-600/30 border-red-500/50 text-red-300 animate-pulse'
                  : 'bg-red-500/10 border-red-500/20 text-red-400/70 hover:bg-red-500/20'
              }`}
            >
              {confirmReset ? '정말 초기화?' : '데이터 초기화'}
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-semibold hover:bg-white/8 transition-all"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/25 hover:shadow-xl transition-all active:scale-[0.97]"
            >
              저장
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


// --- Recent Activity ---
const ActivityFeed = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/20">
        <span className="text-4xl mb-3">📝</span>
        <p className="text-sm font-medium">아직 활동 기록이 없습니다</p>
        <p className="text-xs mt-1">목표를 달성하면 여기에 기록됩니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 8).map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
            activity.type === 'level'
              ? 'bg-amber-500/5 border-amber-500/15'
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
          }`}
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
            activity.type === 'level' ? 'bg-amber-500/15' : 'bg-purple-500/10'
          }`}>
            {activity.type === 'level' ? '🌟' : '✅'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${activity.type === 'level' ? 'text-amber-300' : 'text-white/80'}`}>
              {activity.text}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-white/25">{timeAgo(activity.timestamp)}</span>
              {activity.xp && <span className="text-xs text-purple-400/60">+{activity.xp} XP</span>}
              {activity.gp && <span className="text-xs text-amber-400/60">+{activity.gp} GP</span>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};


// --- Today's Summary Card ---
const TodaySummaryCard = ({ completedToday, totalQuests, streak }) => {
  const activeQuests = totalQuests;
  const progressPercent = activeQuests > 0 ? Math.round((completedToday / activeQuests) * 100) : 0;

  return (
    <div className="glass rounded-2xl p-6 md:p-8 border border-white/6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white/80">📊 오늘의 현황</h2>
        <div className="flex items-center gap-1.5">
          <span className="streak-fire text-lg">🔥</span>
          <span className="text-orange-300 font-bold text-lg">{streak}</span>
          <span className="text-white/30 text-xs">일 연속</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-3xl font-black text-purple-300">{completedToday}</p>
          <p className="text-xs text-white/40 mt-1 font-medium">달성 완료</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
          <p className="text-3xl font-black text-blue-300">{activeQuests - completedToday}</p>
          <p className="text-xs text-white/40 mt-1 font-medium">남은 목표</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center">
          <p className={`text-3xl font-black ${progressPercent >= 100 ? 'text-emerald-300' : 'text-amber-300'}`}>{progressPercent}%</p>
          <p className="text-xs text-white/40 mt-1 font-medium">달성률</p>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// MAIN APP
// ==========================================
const App = () => {
  const {
    characterName, characterClass,
    level, exp, gold, streak,
    stats, statPoints, quests,
    activities, completedToday, totalCompleted,
    completeQuest, addQuest, removeQuest, allocateStat,
  } = useGameStore();

  const { avatarSrc, uploadAvatar } = useAvatar();
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  const maxExp = getExpForLevel(level);
  const xpPercentage = Math.min(100, (exp / maxExp) * 100);
  const completedCount = quests.filter(q => q.completed).length;
  const pendingQuests = quests.filter(q => !q.completed);
  const doneQuests = quests.filter(q => q.completed);

  const handleCompleteQuest = (questId) => {
    const result = completeQuest(questId);
    if (result?.leveledUp) {
      setLevelUpLevel(result.newLevel);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 md:py-5">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <AvatarDisplay
              avatarSrc={avatarSrc}
              onUpload={uploadAvatar}
              level={level}
            />

            {/* Character Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="font-fantasy text-xl md:text-2xl gold-text truncate font-bold">{characterName}</h1>
                <span className="text-purple-300/70 text-xs font-semibold bg-purple-500/15 px-2.5 py-1 rounded-lg whitespace-nowrap border border-purple-500/15">{characterClass}</span>
              </div>

              {/* Gold & Streak */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <span>🪙</span>
                  <span className="text-amber-300 font-bold">{gold.toLocaleString()}</span>
                  <span className="text-white/25 text-xs">GP</span>
                </div>
                <div className="w-px h-4 bg-white/8" />
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="streak-fire">🔥</span>
                  <span className="text-orange-300 font-bold">{streak}</span>
                  <span className="text-white/25 text-xs">일 연속</span>
                </div>
                {statPoints > 0 && (
                  <>
                    <div className="w-px h-4 bg-white/8" />
                    <div className="flex items-center gap-1.5 text-sm">
                      <span>✨</span>
                      <span className="text-amber-200 font-bold">{statPoints}</span>
                      <span className="text-white/25 text-xs">포인트</span>
                    </div>
                  </>
                )}
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="text-white/30 text-xs">누적 달성</span>
                  <span className="text-white/60 font-bold">{totalCompleted}</span>
                </div>
              </div>

              {/* XP Bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-purple-300/70 font-semibold">경험치</span>
                  <span className="text-xs text-white/40 font-mono tabular-nums">{exp} / {maxExp} XP</span>
                </div>
                <div className="h-3.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full xp-bar-fill rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-full" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>


      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-5 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

          {/* ===== LEFT COLUMN: Stats ===== */}
          <div className="lg:col-span-3 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            {/* Stats Panel */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-white/6 flex flex-col"
              style={{ minHeight: 'calc(100vh - 12rem)' }}
            >
              <div className="flex items-center justify-between p-6 md:p-7 pb-4 flex-shrink-0">
                <h2 className="text-base font-bold text-white/70 flex items-center gap-2">
                  <span className="text-xl">⚔️</span> 능력치
                </h2>
                {statPoints > 0 && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/20 animate-pulse">
                    {statPoints}P 분배 가능
                  </span>
                )}
              </div>
              <div className="overflow-y-auto scrollbar-thin px-6 md:px-7 pb-6 md:pb-7 space-y-5 flex-1">
                {Object.entries(stats).map(([key, value]) => (
                  <StatBar
                    key={key}
                    statKey={key}
                    value={value}
                    onAllocate={allocateStat}
                    canAllocate={statPoints > 0}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* ===== CENTER COLUMN: Daily Goals (MAIN FOCUS) ===== */}
          <div className="lg:col-span-5 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            {/* Today's Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TodaySummaryCard
                completedToday={completedCount}
                totalQuests={quests.length}
                streak={streak}
              />
            </motion.div>

            {/* Today's Core Goals - THE MAIN SECTION */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-6 md:p-8 border border-purple-500/10 flex flex-col"
              style={{ minHeight: 'calc(100vh - 22rem)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    오늘의 핵심 목표
                  </h2>
                  <span className="text-sm font-bold bg-purple-500/15 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/15">
                    {completedCount}/{quests.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAddQuest(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/25 hover:shadow-xl hover:shadow-purple-600/35 hover:scale-[1.02] active:scale-[0.97] transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  목표 추가
                </button>
              </div>

              {/* Pending Quests */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingQuests.length === 0 && doneQuests.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-white/20"
                    >
                      <span className="text-6xl mb-4">🎯</span>
                      <p className="text-lg font-bold mb-1">오늘의 목표를 설정하세요</p>
                      <p className="text-sm">"목표 추가" 버튼을 눌러 시작하세요</p>
                    </motion.div>
                  )}

                  {pendingQuests.map(quest => (
                    <QuestItem
                      key={quest.id}
                      quest={quest}
                      onComplete={handleCompleteQuest}
                      onRemove={removeQuest}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Completed Quests */}
              {doneQuests.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-xs font-semibold text-white/25 uppercase tracking-wider">달성 완료 ({doneQuests.length})</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {doneQuests.map(quest => (
                        <QuestItem
                          key={quest.id}
                          quest={quest}
                          onComplete={handleCompleteQuest}
                          onRemove={removeQuest}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ===== RIGHT COLUMN: Activity Log ===== */}
          <div className="lg:col-span-4 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl border border-white/6 flex flex-col"
              style={{ minHeight: 'calc(100vh - 12rem)' }}
            >
              <h2 className="text-base font-bold text-white/70 p-6 md:p-7 pb-4 flex-shrink-0 flex items-center gap-2">
                <span className="text-xl">📜</span> 활동 기록
              </h2>
              <div className="overflow-y-auto scrollbar-thin px-6 md:px-7 pb-6 md:pb-7 flex-1">
                <ActivityFeed activities={activities} />
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="glass border-t border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between">
          <p className="text-xs text-white/20">
            HeroForge — 나의 성장 여정
          </p>
          <p className="text-xs text-white/15">
            매일의 노력이 모여 큰 성장이 됩니다 ✨
          </p>
        </div>
      </footer>


      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {showAddQuest && (
          <AddQuestModal
            isOpen={showAddQuest}
            onClose={() => setShowAddQuest(false)}
            onAdd={addQuest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {levelUpLevel && (
          <LevelUpOverlay
            level={levelUpLevel}
            onDismiss={() => setLevelUpLevel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};


// ==========================================
// RENDER
// ==========================================
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
