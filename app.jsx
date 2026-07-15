import React, { useState, useEffect } from 'https://esm.sh/react@18.2.0';
import ReactDOM from 'https://esm.sh/react-dom@18.2.0/client';
import { create } from 'https://esm.sh/zustand@4.3.8?deps=react@18.2.0';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.12.16?deps=react@18.2.0,react-dom@18.2.0';
import confetti from 'https://esm.sh/canvas-confetti@1.6.0';

// ==========================================
// STORE (Zustand)
// ==========================================
const useGameStore = create((set) => ({
  level: 12,
  exp: 4500,
  maxExp: 10000,
  stats: {
    STR: { value: 65, color: "bg-red-500", label: "Strength", icon: "💪" },
    AGI: { value: 42, color: "bg-green-500", label: "Agility", icon: "🏃" },
    VIT: { value: 80, color: "bg-orange-500", label: "Vitality", icon: "❤️" },
    INT: { value: 55, color: "bg-blue-500", label: "Intelligence", icon: "🧠" },
    WIS: { value: 30, color: "bg-indigo-500", label: "Wisdom", icon: "🦉" },
    CHA: { value: 70, color: "bg-pink-500", label: "Charisma", icon: "✨" },
  },
  quests: [
    { id: 1, title: "Morning Workout (30m)", xpReward: 150, statReward: { STR: 2, VIT: 1 }, completed: false, category: "Physical" },
    { id: 2, title: "Read 20 pages", xpReward: 100, statReward: { INT: 2, WIS: 1 }, completed: false, category: "Mental" },
    { id: 3, title: "Meditation (15m)", xpReward: 80, statReward: { WIS: 3 }, completed: false, category: "Spiritual" },
    { id: 4, title: "Networking Event", xpReward: 200, statReward: { CHA: 4 }, completed: false, category: "Social" },
  ],
  activities: [
    { id: 1, text: "Completed 'Morning Workout'", time: "2 hours ago", type: "quest" },
    { id: 2, text: "Level Up! Reached Lvl 12", time: "1 day ago", type: "level" },
    { id: 3, text: "STR increased by 2", time: "1 day ago", type: "stat" },
  ],

  completeQuest: (questId) =>
    set((state) => {
      const quest = state.quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return state;

      const newExp = state.exp + quest.xpReward;
      let newLevel = state.level;
      let newMaxExp = state.maxExp;
      let expRemainder = newExp;

      if (newExp >= state.maxExp) {
        newLevel += 1;
        expRemainder = newExp - state.maxExp;
        newMaxExp = Math.floor(state.maxExp * 1.2);
      }

      const newStats = { ...state.stats };
      Object.entries(quest.statReward).forEach(([stat, amount]) => {
        newStats[stat].value = Math.min(100, newStats[stat].value + amount);
      });

      const newActivity = {
        id: Date.now(),
        text: `Completed '${quest.title}'`,
        time: "Just now",
        type: "quest",
      };

      return {
        quests: state.quests.map((q) => (q.id === questId ? { ...q, completed: true } : q)),
        exp: expRemainder,
        level: newLevel,
        maxExp: newMaxExp,
        stats: newStats,
        activities: [newActivity, ...state.activities].slice(0, 10),
      };
    }),
}));


// ==========================================
// COMPONENTS
// ==========================================

const StatBar = ({ label, value, max = 100, colorClass = "bg-blue-500", icon }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-sans font-bold text-sm tracking-wider text-slate-300 uppercase">
            {label}
          </span>
        </div>
        <span className="font-fantasy text-lg font-bold text-white">
          {value} <span className="text-xs text-slate-500 font-sans">/ {max}</span>
        </span>
      </div>
      
      <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${colorClass} shadow-[0_0_10px_currentColor]`}
          style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 0 8px currentColor' }}
        />
      </div>
    </div>
  );
};

const CharacterDisplay = () => {
  const level = useGameStore((state) => state.level);
  
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute w-[80%] aspect-square rounded-full border border-purple-500/20 opacity-30"
        style={{ background: 'radial-gradient(circle, transparent 40%, rgba(139, 92, 246, 0.1) 60%, transparent 70%)' }}
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute w-[60%] aspect-square rounded-full border border-blue-500/20 opacity-30"
      />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="relative drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]">
          <img 
            src="./warrior_character_1784097295895.png" 
            alt="Hero Character" 
            className="w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x600/1e1b4b/a855f7?text=Hero+Character";
            }}
          />
        </div>
      </motion.div>

      <div className="absolute bottom-[10%] w-[60%] h-[20px] bg-purple-600/30 blur-2xl rounded-full"></div>
    </div>
  );
};

const QuestItem = ({ quest, onComplete }) => {
  const handleComplete = () => {
    if (!quest.completed) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#fbbf24', '#f59e0b', '#d97706']
      });
      onComplete(quest.id);
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Physical': return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'Mental': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'Spiritual': return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
      case 'Social': return 'text-pink-400 border-pink-500/30 bg-pink-500/10';
      default: return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    }
  };

  return (
    <motion.div
      whileHover={!quest.completed ? { scale: 1.02, x: 5 } : {}}
      className={`relative overflow-hidden p-4 rounded-xl border ${
        quest.completed 
          ? 'bg-slate-900/50 border-slate-800 opacity-50' 
          : 'glass border-slate-700/50 hover:border-purple-500/50 cursor-pointer'
      } transition-all duration-300`}
      onClick={handleComplete}
    >
      {quest.completed && (
        <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
          <span className="font-fantasy text-2xl text-yellow-500 font-bold rotate-[-15deg] drop-shadow-lg border-2 border-yellow-500 px-4 py-1 rounded">
            CLEARED
          </span>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getCategoryColor(quest.category)}`}>
              {quest.category}
            </span>
          </div>
          <h4 className={`font-bold ${quest.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
            {quest.title}
          </h4>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="font-fantasy text-purple-400 font-bold">
            +{quest.xpReward} XP
          </span>
          <div className="flex gap-1 mt-1">
            {Object.entries(quest.statReward).map(([stat, val]) => (
              <span key={stat} className="text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                +{val} {stat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RecentActivity = () => {
  const activities = useGameStore((state) => state.activities);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'quest': return '⚔️';
      case 'level': return '🌟';
      case 'stat': return '📈';
      default: return '📜';
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'quest': return 'text-purple-400';
      case 'level': return 'text-yellow-400 font-bold';
      case 'stat': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="glass rounded-2xl border border-slate-800 p-6 flex flex-col h-[400px]">
      <h3 className="font-fantasy font-bold text-xl text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
        <span>📜</span> Activity Log
      </h3>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/50"
              >
                <div className="text-xl shrink-0 bg-slate-800 rounded-full p-2 w-10 h-10 flex items-center justify-center">
                  {getTypeIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${getTypeColor(activity.type)}`}>
                    {activity.text}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// MAIN APP ROUTING & RENDER
// ==========================================

const App = () => {
  const { level, exp, maxExp, stats, quests, completeQuest } = useGameStore();
  const xpPercentage = (exp / maxExp) * 100;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-8">
      
      <header className="glass rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border-t-2 border-t-purple-500/50 shadow-[0_0_40px_rgba(139,92,246,0.1)] z-10">
        <div className="shrink-0 text-center md:text-left">
          <h2 className="font-fantasy text-sm text-slate-400 uppercase tracking-[0.2em]">Hero Status</h2>
          <div className="flex items-baseline gap-2 justify-center md:justify-start mt-1">
            <span className="font-fantasy text-4xl font-black gold-text drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              Lv. {level}
            </span>
          </div>
        </div>
        
        <div className="flex-1 w-full flex flex-col gap-2">
          <div className="flex justify-between items-end px-1">
            <span className="font-sans font-bold text-sm tracking-wider text-purple-300">EXPERIENCE</span>
            <span className="font-fantasy font-bold text-white tracking-widest text-sm">
              {exp.toLocaleString()} <span className="text-slate-500">/ {maxExp.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-6 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner relative">
            <motion.div 
              className="h-full xp-bar-fill relative"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 flex-1">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 border border-slate-800">
            <h3 className="font-fantasy font-bold text-xl text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
              <span>⚔️</span> Attributes
            </h3>
            <div className="flex flex-col gap-5">
              {Object.entries(stats).map(([key, stat]) => (
                <StatBar 
                  key={key} 
                  label={stat.label} 
                  value={stat.value} 
                  colorClass={stat.color}
                  icon={stat.icon}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[400px]">
          <CharacterDisplay />
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <RecentActivity />
        </div>
      </main>

      <footer className="z-10 mt-auto">
        <div className="glass rounded-2xl p-6 border border-slate-800">
          <div className="flex justify-between items-end mb-6 border-b border-slate-800 pb-4">
            <h3 className="font-fantasy font-bold text-2xl text-slate-200 flex items-center gap-3">
              <span>🎯</span> Daily Quests
            </h3>
            <span className="text-sm font-bold text-slate-400">
              {quests.filter(q => q.completed).length} / {quests.length} Completed
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quests.map(quest => (
              <QuestItem 
                key={quest.id} 
                quest={quest} 
                onComplete={completeQuest} 
              />
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
