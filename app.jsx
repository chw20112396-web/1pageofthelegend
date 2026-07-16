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
  easy:   { label: '기본',   xp: 30,  gp: 10,  color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25' },
  medium: { label: '도전',   xp: 60,  gp: 25,  color: 'text-blue-400',    bg: 'bg-blue-500/15',    border: 'border-blue-500/25' },
  hard:   { label: '고난도', xp: 120, gp: 50,  color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/25' },
  epic:   { label: '전설',   xp: 250, gp: 100, color: 'text-purple-400',  bg: 'bg-purple-500/15',  border: 'border-purple-500/25' },
};

// ==========================================
// MONSTER & ITEM DATA
// ==========================================
const MONSTERS_DB = [
  { id: 'm1', name: '스마트폰 늪 슬라임',  emoji: '📱', desc: '소셜미디어 늪에서 탄생한 끈적한 슬라임. 집중력을 빼앗는다.',       baseHp: 100, weakness: 'WIS', tier: 'normal', dropGold: [30, 60]   },
  { id: 'm2', name: '귀차니즘 골렘',        emoji: '🪨', desc: '미루고 미룬 할 일들이 굳어 탄생한 거대한 바위 골렘.',             baseHp: 160, weakness: 'STR', tier: 'normal', dropGold: [50, 90]   },
  { id: 'm3', name: '집중력 좀비',          emoji: '🧟', desc: '산만함의 화신. 중요한 순간마다 나타나 뇌를 갉아먹는다.',         baseHp: 240, weakness: 'INT', tier: 'elite',  dropGold: [80, 130]  },
  { id: 'm4', name: '미루기 망령',          emoji: '👻', desc: '"내일 하면 되지"라 속삭이며 행동력을 봉인하는 고대의 망령.',     baseHp: 210, weakness: 'AGI', tier: 'elite',  dropGold: [70, 120]  },
  { id: 'm5', name: '비교 질투 악령',       emoji: '😈', desc: '끊임없는 비교로 자존감을 갉아먹는 악한 영혼.',                   baseHp: 280, weakness: 'CHA', tier: 'elite',  dropGold: [90, 150]  },
  { id: 'm6', name: '자기불신 마왕',        emoji: '🐉', desc: '"어차피 안 돼"라는 저주로 성장을 가로막는 최강의 마왕.',         baseHp: 420, weakness: 'VIT', tier: 'boss',   dropGold: [200, 350] },
];

const TIER_CONFIG = {
  normal: { label: '일반',   color: 'text-slate-400',  bg: 'bg-slate-500/15',  border: 'border-slate-500/30' },
  elite:  { label: '엘리트', color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/30' },
  boss:   { label: 'BOSS',   color: 'text-rose-400',   bg: 'bg-rose-500/15',   border: 'border-rose-500/30' },
};

const ITEMS_DB = [
  { id: 'eq_int', name: '지식의 서',       emoji: '📚', type: 'equipment',  stat: 'INT', bonus: 2, slot: 'WEAPON', desc: 'INT 보상 +2 (장착 시 적용)',    rarity: 'common'   },
  { id: 'eq_str', name: '강철 의지 반지',  emoji: '💍', type: 'equipment',  stat: 'STR', bonus: 2, slot: 'ARMOR',  desc: 'STR 보상 +2 (장착 시 적용)',    rarity: 'common'   },
  { id: 'eq_wis', name: '현자의 안경',     emoji: '🔮', type: 'equipment',  stat: 'WIS', bonus: 2, slot: 'HAT',    desc: 'WIS 보상 +2 (장착 시 적용)',    rarity: 'uncommon' },
  { id: 'eq_agi', name: '번개 발목 밴드',  emoji: '⚡', type: 'equipment',  stat: 'AGI', bonus: 2, slot: 'ARMOR',  desc: 'AGI 보상 +2 (장착 시 적용)',    rarity: 'uncommon' },
  { id: 'eq_vit', name: '생명의 부적',     emoji: '🧿', type: 'equipment',  stat: 'VIT', bonus: 2, slot: 'WEAPON', desc: 'VIT 보상 +2 (장착 시 적용)',    rarity: 'uncommon' },
  { id: 'eq_cha', name: '카리스마 망토',   emoji: '🪄', type: 'equipment',  stat: 'CHA', bonus: 2, slot: 'HAT',    desc: 'CHA 보상 +2 (장착 시 적용)',    rarity: 'uncommon' },
  { id: 'cs_xp',  name: '경험치 물약',     emoji: '🧪', type: 'consumable', effect: { xp: 100 },       desc: 'XP +100 즉시 획득', rarity: 'common'   },
  { id: 'cs_gp',  name: '황금 조각',       emoji: '🪙', type: 'consumable', effect: { gp: 50 },        desc: 'GP +50 즉시 획득',  rarity: 'common'   },
  { id: 'cs_all', name: '만능 강화석',     emoji: '💎', type: 'consumable', effect: { allStats: 1 },   desc: '전 능력치 +1',      rarity: 'rare'     },
  { id: 'cs_pts', name: '성장의 결정',     emoji: '✨', type: 'consumable', effect: { statPoints: 3 }, desc: '능력치 포인트 +3',  rarity: 'rare'     },
];

// Equipment slot config — emoji positions on the paper-doll avatar
const SLOT_CONFIG = {
  HAT:    { label: '머리',  icon: '🪖', style: { top: '2%',  left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem' } },
  WEAPON: { label: '무기',  icon: '⚔️', style: { top: '52%', left: '4%',  fontSize: '1.4rem' } },
  ARMOR:  { label: '갑옷',  icon: '🛡️', style: { top: '56%', left: '50%', transform: 'translateX(-50%)', fontSize: '1.4rem' } },
};

const RARITY_CONFIG = {
  common:   { label: '일반', color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20' },
  uncommon: { label: '고급', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  rare:     { label: '희귀', color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
};

function rollLoot(monster) {
  const commonPool   = ITEMS_DB.filter(i => i.rarity === 'common');
  const uncommonPool = ITEMS_DB.filter(i => i.rarity === 'uncommon');
  const rarePool     = ITEMS_DB.filter(i => i.rarity === 'rare');
  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const drops = [];
  const r = Math.random();
  if (monster.tier === 'boss') {
    drops.push(pick(rarePool));
    if (Math.random() < 0.6) drops.push(pick(uncommonPool));
  } else if (monster.tier === 'elite') {
    drops.push(r < 0.20 ? pick(rarePool) : r < 0.65 ? pick(uncommonPool) : pick(commonPool));
  } else {
    drops.push(r < 0.10 ? pick(rarePool) : r < 0.40 ? pick(uncommonPool) : pick(commonPool));
  }
  return drops.filter(Boolean);
}

function calcDamage(quest, stats, monster) {
  const diff = DIFFICULTY_CONFIG[quest.difficulty];
  let base = diff.xp / 5; // easy=6, medium=12, hard=24, epic=50
  let statBonus = 0;
  if (quest.statReward) {
    Object.entries(quest.statReward).forEach(([k, pts]) => {
      statBonus += pts * (stats[k] || 1);
    });
  }
  const raw = Math.floor(base + statBonus);
  const isCrit = monster && quest.statReward && !!quest.statReward[monster.weakness];
  return { damage: isCrit ? Math.floor(raw * 1.5) : raw, isCrit };
}

function getMonsterMaxHp(index) {
  const monster = MONSTERS_DB[index % MONSTERS_DB.length];
  const cycle = Math.floor(index / MONSTERS_DB.length);
  return Math.floor(monster.baseHp * Math.pow(1.25, cycle));
}

const DEFAULT_QUESTS = [
  { id: 'q1', title: '코어 과목(국/영/수) 3시간 집중력 유지하기',      difficulty: 'hard',   statReward: { INT: 3, WIS: 2 }, completed: false, createdAt: Date.now() },
  { id: 'q2', title: '인공지능(AI) 알고리즘 파이썬 코딩 구현',         difficulty: 'epic',   statReward: { INT: 4, AGI: 2 }, completed: false, createdAt: Date.now() },
  { id: 'q3', title: '기술 윤리 및 노동 인권 관련 회고 일지 작성',     difficulty: 'medium', statReward: { WIS: 3, CHA: 1 }, completed: false, createdAt: Date.now() },
];

function getExpForLevel(level) { return Math.floor(100 * Math.pow(1.15, level - 1)); }

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
      if (parsed && typeof parsed.level === 'number' && parsed.stats && parsed.quests) {
        // Back-fill new fields if missing (for existing saves)
        if (parsed.currentMonsterIndex === undefined) parsed.currentMonsterIndex = 0;
        if (parsed.monsterHp === undefined) parsed.monsterHp = MONSTERS_DB[0].baseHp;
        if (parsed.monsterKillCount === undefined) parsed.monsterKillCount = 0;
        if (!parsed.inventory) parsed.inventory = [];
        if (!parsed.equippedItems) parsed.equippedItems = { HAT: null, WEAPON: null, ARMOR: null };
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
    stats: { STR: 1, AGI: 1, VIT: 1, INT: 1, WIS: 1, CHA: 1 },
    statPoints: 0,
    quests: DEFAULT_QUESTS,
    activities: [],
    completedToday: 0,
    totalCompleted: 0,
    // Monster system
    currentMonsterIndex: 0,
    monsterHp: MONSTERS_DB[0].baseHp,
    monsterKillCount: 0,
    inventory: [],
    equippedItems: { HAT: null, WEAPON: null, ARMOR: null },
  };
}


// ==========================================
// ZUSTAND STORE
// ==========================================
const useGameStore = create((set, get) => ({
  ...getInitialState(),
  lootDrop: null, // transient — not persisted

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
      currentMonsterIndex: state.currentMonsterIndex,
      monsterHp: state.monsterHp,
      monsterKillCount: state.monsterKillCount,
      inventory: state.inventory,
      equippedItems: state.equippedItems,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch(e) {}
  },

  setCharacterName: (name) => { set({ characterName: name }); get()._persist(); },
  setCharacterClass: (cls)  => { set({ characterClass: cls }); get()._persist(); },

  completeQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.completed) return null;

    const diff = DIFFICULTY_CONFIG[quest.difficulty];
    const xpGain = diff.xp;
    const gpGain = diff.gp;

    // Level up logic
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

    // Stat reward — apply equipped-item bonuses only
    const newStats = { ...state.stats };
    const equippedInstances = Object.values(state.equippedItems).filter(Boolean);
    const equippedItemObjs = equippedInstances.map(iid => state.inventory.find(i => i.instanceId === iid)).filter(Boolean);
    if (quest.statReward) {
      Object.entries(quest.statReward).forEach(([stat, amount]) => {
        const equip = equippedItemObjs.find(i => i.stat === stat);
        const bonus = equip ? (equip.bonus || 0) : 0;
        newStats[stat] = Math.min(100, (newStats[stat] || 1) + amount + bonus);
      });
    }

    // Streak logic
    const today = getTodayKey();
    let newStreak = state.streak;
    if (state.lastActiveDay !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      newStreak = state.lastActiveDay === yesterdayKey ? newStreak + 1 : 1;
    }

    // Activity log
    const newActivity = {
      id: Date.now(),
      text: `"${quest.title}" 달성 완료!`,
      xp: xpGain, gp: gpGain, statReward: quest.statReward,
      timestamp: Date.now(), type: 'quest',
    };
    const levelActivity = leveledUp ? { id: Date.now() + 1, text: `🎉 레벨 ${newLevel} 달성!`, timestamp: Date.now(), type: 'level' } : null;
    const newActivities = [...(levelActivity ? [levelActivity] : []), newActivity, ...state.activities].slice(0, 20);

    // ── Monster damage ──
    const monster = MONSTERS_DB[state.currentMonsterIndex % MONSTERS_DB.length];
    const { damage, isCrit } = calcDamage(quest, state.stats, monster);
    const newHp = Math.max(0, state.monsterHp - damage);

    let monsterKillUpdates = {};
    let lootDrop = null;

    if (newHp <= 0) {
      // Monster defeated
      const [gMin, gMax] = monster.dropGold;
      const earnedGold = Math.floor(Math.random() * (gMax - gMin + 1)) + gMin;
      const lootItems = rollLoot(monster);
      const newItems = lootItems.map(item => ({
        ...item,
        instanceId: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        acquiredAt: Date.now(),
      }));

      const nextIndex = state.currentMonsterIndex + 1;
      const nextHp = getMonsterMaxHp(nextIndex);

      lootDrop = { monster: { ...monster }, items: lootItems, gold: earnedGold };

      monsterKillUpdates = {
        currentMonsterIndex: nextIndex,
        monsterHp: nextHp,
        monsterKillCount: state.monsterKillCount + 1,
        gold: state.gold + gpGain + earnedGold,
        inventory: [...state.inventory, ...newItems],
        lootDrop,
      };

      // Victory confetti
      setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#fbbf24', '#a855f7', '#ec4899', '#22c55e'] }), 200);
    } else {
      monsterKillUpdates = { monsterHp: newHp };
    }

    set({
      quests: state.quests.map(q => q.id === questId ? { ...q, completed: true, completedAt: Date.now() } : q),
      exp: newExp,
      level: newLevel,
      gold: (monsterKillUpdates.gold !== undefined ? monsterKillUpdates.gold : state.gold + gpGain),
      stats: newStats,
      statPoints: newStatPoints,
      streak: newStreak,
      lastActiveDay: today,
      activities: newActivities,
      completedToday: (state.lastActiveDay === today ? state.completedToday : 0) + 1,
      totalCompleted: state.totalCompleted + 1,
      ...monsterKillUpdates,
    });

    get()._persist();
    return { leveledUp, newLevel, xpGain, gpGain, damage, isCrit, monsterKilled: newHp <= 0 };
  },

  addQuest: (title, difficulty, statReward) => {
    const state = get();
    const newQuest = { id: `q_${Date.now()}`, title, difficulty: difficulty || 'medium', statReward: statReward || { INT: 1 }, completed: false, createdAt: Date.now() };
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
    set({ stats: { ...state.stats, [statKey]: Math.min(100, state.stats[statKey] + 1) }, statPoints: state.statPoints - 1 });
    get()._persist();
  },

  clearLootDrop: () => { set({ lootDrop: null }); },

  useItem: (instanceId) => {
    const state = get();
    const item = state.inventory.find(i => i.instanceId === instanceId);
    if (!item || item.type !== 'consumable') return;

    const updates = { inventory: state.inventory.filter(i => i.instanceId !== instanceId) };

    if (item.effect.xp) {
      let { exp, level, statPoints } = state;
      exp += item.effect.xp;
      let mx = getExpForLevel(level);
      while (exp >= mx) { exp -= mx; level += 1; statPoints += 3; mx = getExpForLevel(level); }
      Object.assign(updates, { exp, level, statPoints });
    }
    if (item.effect.gp) updates.gold = state.gold + item.effect.gp;
    if (item.effect.allStats) {
      const newStats = {};
      Object.keys(state.stats).forEach(k => { newStats[k] = Math.min(100, state.stats[k] + item.effect.allStats); });
      updates.stats = newStats;
    }
    if (item.effect.statPoints) {
      updates.statPoints = (updates.statPoints !== undefined ? updates.statPoints : state.statPoints) + item.effect.statPoints;
    }

    set(updates);
    get()._persist();
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AVATAR_STORAGE_KEY);
    set({
      characterName: '영웅', characterClass: '수련생',
      level: 1, exp: 0, gold: 0, streak: 0, lastActiveDay: null,
      stats: { STR: 1, AGI: 1, VIT: 1, INT: 1, WIS: 1, CHA: 1 },
      statPoints: 0,
      quests: DEFAULT_QUESTS.map(q => ({ ...q, completed: false, completedAt: undefined })),
      activities: [], completedToday: 0, totalCompleted: 0,
      currentMonsterIndex: 0, monsterHp: MONSTERS_DB[0].baseHp,
      monsterKillCount: 0, inventory: [], lootDrop: null,
      equippedItems: { HAT: null, WEAPON: null, ARMOR: null },
    });
  },

  equipItem: (instanceId) => {
    const state = get();
    const item = state.inventory.find(i => i.instanceId === instanceId);
    if (!item || item.type !== 'equipment' || !item.slot) return;
    const slot = item.slot;
    const current = state.equippedItems[slot];
    // Toggle: if already equipped, unequip
    if (current === instanceId) {
      set({ equippedItems: { ...state.equippedItems, [slot]: null } });
    } else {
      set({ equippedItems: { ...state.equippedItems, [slot]: instanceId } });
    }
    get()._persist();
  },

  unequipSlot: (slot) => {
    const state = get();
    set({ equippedItems: { ...state.equippedItems, [slot]: null } });
    get()._persist();
  },
}));


// ==========================================
// AVATAR HOOK
// ==========================================
function useAvatar() {
  const [avatarSrc, setAvatarSrc] = useState(null);
  useEffect(() => { try { const s = localStorage.getItem(AVATAR_STORAGE_KEY); if (s) setAvatarSrc(s); } catch(e) {} }, []);

  const uploadAvatar = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target.result;
      try { localStorage.setItem(AVATAR_STORAGE_KEY, b64); setAvatarSrc(b64); } catch(err) { alert('이미지가 너무 큽니다.'); }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeAvatar = useCallback(() => { localStorage.removeItem(AVATAR_STORAGE_KEY); setAvatarSrc(null); }, []);
  return { avatarSrc, uploadAvatar, removeAvatar };
}


// ==========================================
// COMPONENTS
// ==========================================

// --- Progress Ring ---
const ProgressRing = ({ progress, size = 100, strokeWidth = 8, color = '#8b5cf6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
};

// --- Avatar (Paper Doll) ---
const AvatarDisplay = ({ avatarSrc, onUpload, level }) => {
  const fileInputRef = useRef(null);
  const { equippedItems, inventory } = useGameStore();

  // Resolve equipped item objects from instanceIds
  const getEquippedItem = (slot) => {
    const iid = equippedItems[slot];
    if (!iid) return null;
    return inventory.find(i => i.instanceId === iid) || null;
  };

  const baseSrc = avatarSrc || './avatar_base.png';

  return (
    <div className="relative flex-shrink-0">
      <div
        className="avatar-glow w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-2 border-purple-500/30 flex items-center justify-center overflow-hidden cursor-pointer group relative"
        onClick={() => fileInputRef.current?.click()}
      >
        <img src={baseSrc} alt="아바타" className="w-full h-full object-cover" />

        {/* Paper-doll equipment overlays */}
        {Object.entries(SLOT_CONFIG).map(([slot, cfg]) => {
          const item = getEquippedItem(slot);
          if (!item) return null;
          return (
            <AnimatePresence key={slot}>
              <motion.span
                key={item.instanceId}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 14, stiffness: 320 }}
                className="absolute pointer-events-none select-none leading-none"
                style={{ ...cfg.style, position: 'absolute', lineHeight: 1 }}
              >
                {item.emoji}
              </motion.span>
            </AnimatePresence>
          );
        })}

        <div className="avatar-upload-overlay rounded-2xl">
          <div className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] text-white/80 font-medium">사진 변경</span>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) onUpload(e.target.files[0]); e.target.value = ''; }} className="hidden" />
      </div>
      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm px-3 py-1 rounded-xl shadow-lg shadow-amber-500/40">
        Lv.{level}
      </div>
    </div>
  );
};

// --- Stat Bar ---
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
            <button onClick={() => onAllocate(statKey)} className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/30 transition-all active:scale-90">+</button>
          )}
        </div>
      </div>
      <div className="h-3.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`h-full ${config.bgClass} relative stat-bar-shimmer rounded-full`}
          style={{ boxShadow: `0 0 12px ${config.color}40` }} />
      </div>
    </div>
  );
};

// --- Quest Item ---
const QuestItem = ({ quest, onComplete, onRemove }) => {
  const [slashVisible, setSlashVisible] = useState(false);
  const diff = DIFFICULTY_CONFIG[quest.difficulty];

  const handleComplete = () => {
    if (quest.completed) return;
    setSlashVisible(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ['#fbbf24', '#a855f7', '#6366f1', '#22c55e', '#ec4899'] });
    onComplete(quest.id);
    setTimeout(() => setSlashVisible(false), 800);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
        quest.completed ? 'bg-white/[0.02] border-white/5' : 'glass-light border-white/8 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'
      }`}
    >
      {/* Sword slash animation */}
      <AnimatePresence>
        {slashVisible && (
          <motion.div
            initial={{ opacity: 0, x: -20, rotate: -30 }}
            animate={{ opacity: [0, 1, 1, 0], x: 80, rotate: 15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute top-1/2 left-6 -translate-y-1/2 text-3xl z-10 pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.8))' }}
          >
            ⚔️
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`p-5 md:p-6 ${quest.completed ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-4">
          <button onClick={handleComplete} disabled={quest.completed}
            className={`flex-shrink-0 mt-1 w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
              quest.completed ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-purple-500 text-white'
                : 'border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10 cursor-pointer active:scale-90'
            }`}
          >
            {quest.completed && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="check-animate text-lg font-bold">✓</motion.span>}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${diff.bg} ${diff.color} ${diff.border} border`}>{diff.label}</span>
              {quest.statReward && Object.entries(quest.statReward).map(([stat, val]) => (
                <span key={stat} className={`text-xs font-medium px-2 py-0.5 rounded-md ${STAT_CONFIG[stat]?.bgLight} ${STAT_CONFIG[stat]?.textClass}`}>
                  {STAT_CONFIG[stat]?.icon} +{val}
                </span>
              ))}
            </div>
            <h3 className={`quest-strikethrough text-lg md:text-xl font-bold leading-snug ${quest.completed ? 'text-white/40 completed' : 'text-white/95'}`}>{quest.title}</h3>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-purple-300/80"><span>⚡</span> {diff.xp} XP</span>
              <span className="flex items-center gap-1.5 text-amber-300/80"><span>🪙</span> {diff.gp} GP</span>
            </div>
          </div>

          {!quest.completed && (
            <button onClick={() => onRemove(quest.id)} className="flex-shrink-0 w-8 h-8 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
      {quest.completed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute top-3 right-3">
          <span className="text-xs font-bold text-purple-400/60 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/15">✨ 달성 완료</span>
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

  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const toggleStat = (stat) => setSelectedStats(prev => {
    if (prev[stat]) { const next = { ...prev }; delete next[stat]; return next; }
    return { ...prev, [stat]: 1 };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), difficulty, selectedStats);
    setTitle(''); setDifficulty('medium'); setSelectedStats({ INT: 1 }); onClose();
  };

  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        className="relative glass rounded-3xl p-8 w-full max-w-lg border border-purple-500/20 shadow-2xl shadow-purple-500/10"
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><span className="text-3xl">🎯</span> 새로운 목표 추가</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-2">목표 내용</label>
            <input ref={inputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="오늘 달성할 구체적인 목표를 입력하세요"
              className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-lg placeholder:text-white/25 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-3">난이도</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, val]) => (
                <button key={key} type="button" onClick={() => setDifficulty(key)}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all ${difficulty === key ? `${val.bg} ${val.color} ${val.border} ring-2 ring-current/20` : 'bg-white/3 border-white/8 text-white/40 hover:bg-white/5'}`}>
                  {val.label}<div className="text-[10px] mt-0.5 opacity-60">{val.xp}XP</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white/70 mb-3">능력치 보상 (선택)</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STAT_CONFIG).map(([key, val]) => (
                <button key={key} type="button" onClick={() => toggleStat(key)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    selectedStats[key] ? `${val.bgLight} ${val.textClass} ${val.borderClass} ring-1 ring-current/20` : 'bg-white/3 border-white/8 text-white/30 hover:bg-white/5'
                  }`}>{val.icon} {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-semibold hover:bg-white/8 transition-all text-base">취소</button>
            <button type="submit" disabled={!title.trim()} className="flex-1 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/30 hover:shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base active:scale-[0.97]">추가하기</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// --- Level Up Overlay ---
const LevelUpOverlay = ({ level, onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-pointer">
      <div className="level-up-overlay flex flex-col items-center gap-4">
        <span className="text-7xl">🌟</span>
        <h2 className="font-fantasy text-5xl md:text-7xl gold-text font-black tracking-wider">LEVEL UP!</h2>
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

  useEffect(() => { setEditName(characterName); setEditClass(characterClass); setConfirmReset(false); }, [isOpen, characterName, characterClass]);

  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative glass rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><span className="text-3xl">⚙️</span> 설정</h2>
        <div className="space-y-5">
          <div><label className="block text-sm font-semibold text-white/60 mb-2">캐릭터 이름</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all" /></div>
          <div><label className="block text-sm font-semibold text-white/60 mb-2">클래스 (직업)</label>
            <input type="text" value={editClass} onChange={(e) => setEditClass(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500/50 transition-all" /></div>
          <div>
            <label className="block text-sm font-semibold text-white/60 mb-2">아바타 이미지</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                {avatarSrc ? <img src={avatarSrc} alt="아바타" className="w-full h-full object-cover" /> : <span className="text-2xl">⚔️</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition-all">업로드</button>
                {avatarSrc && <button onClick={removeAvatar} className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all">삭제</button>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); e.target.value = ''; }} className="hidden" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => { if (!confirmReset) { setConfirmReset(true); return; } resetAll(); onClose(); }}
              className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all ${confirmReset ? 'bg-red-600/30 border-red-500/50 text-red-300 animate-pulse' : 'bg-red-500/10 border-red-500/20 text-red-400/70 hover:bg-red-500/20'}`}>
              {confirmReset ? '정말 초기화?' : '데이터 초기화'}
            </button>
            <div className="flex-1" />
            <button onClick={onClose} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-semibold hover:bg-white/8 transition-all">취소</button>
            <button onClick={() => { if (editName.trim()) setCharacterName(editName.trim()); if (editClass.trim()) setCharacterClass(editClass.trim()); onClose(); }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-600/25 hover:shadow-xl transition-all active:scale-[0.97]">저장</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Activity Feed ---
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
      {activities.slice(0, 10).map((activity, index) => (
        <motion.div key={activity.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${activity.type === 'level' ? 'bg-amber-500/5 border-amber-500/15' : activity.type === 'monster' ? 'bg-rose-500/5 border-rose-500/15' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'}`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${activity.type === 'level' ? 'bg-amber-500/15' : activity.type === 'monster' ? 'bg-rose-500/15' : 'bg-purple-500/10'}`}>
            {activity.type === 'level' ? '🌟' : activity.type === 'monster' ? '⚔️' : '✅'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${activity.type === 'level' ? 'text-amber-300' : activity.type === 'monster' ? 'text-rose-300' : 'text-white/80'}`}>{activity.text}</p>
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

// --- Today Summary Card ---
const TodaySummaryCard = ({ completedToday, totalQuests, streak }) => {
  const progressPercent = totalQuests > 0 ? Math.round((completedToday / totalQuests) * 100) : 0;
  return (
    <div className="glass rounded-2xl p-6 md:p-8 border border-white/6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white/80">📊 오늘의 현황</h2>
        <div className="flex items-center gap-1.5"><span className="streak-fire text-lg">🔥</span><span className="text-orange-300 font-bold text-lg">{streak}</span><span className="text-white/30 text-xs">일 연속</span></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center"><p className="text-3xl font-black text-purple-300">{completedToday}</p><p className="text-xs text-white/40 mt-1 font-medium">달성 완료</p></div>
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center"><p className="text-3xl font-black text-blue-300">{totalQuests - completedToday}</p><p className="text-xs text-white/40 mt-1 font-medium">남은 목표</p></div>
        <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5 text-center"><p className={`text-3xl font-black ${progressPercent >= 100 ? 'text-emerald-300' : 'text-amber-300'}`}>{progressPercent}%</p><p className="text-xs text-white/40 mt-1 font-medium">달성률</p></div>
      </div>
    </div>
  );
};


// ==========================================
// MONSTER & INVENTORY COMPONENTS
// ==========================================

// --- Floating Damage Number ---
const DamageNumber = ({ damage, isCrit, onDone }) => (
  <motion.div
    initial={{ opacity: 1, y: 0, scale: isCrit ? 1.4 : 1 }}
    animate={{ opacity: 0, y: -70, scale: isCrit ? 1.9 : 1.2 }}
    transition={{ duration: 1.3, ease: 'easeOut' }}
    onAnimationComplete={onDone}
    className={`pointer-events-none absolute top-2/5 left-1/2 -translate-x-1/2 font-black z-20 select-none ${isCrit ? 'text-4xl text-yellow-300' : 'text-3xl text-red-400'}`}
    style={{ textShadow: isCrit ? '0 0 24px rgba(252,211,77,0.9)' : '0 0 14px rgba(248,113,113,0.7)' }}
  >
    {isCrit && <span className="mr-1">💥</span>}
    -{damage}
    {isCrit && <div className="text-base text-center text-yellow-200/80 font-bold mt-0.5">약점 치명타!</div>}
  </motion.div>
);

// --- Monster Battle Panel ---
const MonsterBattlePanel = ({ lastDamage, onDamageDone }) => {
  const { currentMonsterIndex, monsterHp, monsterKillCount } = useGameStore();
  const [isShaking, setIsShaking] = useState(false);

  const monster = MONSTERS_DB[currentMonsterIndex % MONSTERS_DB.length];
  const maxHp = getMonsterMaxHp(currentMonsterIndex);
  const hpPercent = Math.max(0, (monsterHp / maxHp) * 100);
  const tier = TIER_CONFIG[monster.tier];
  const weakness = STAT_CONFIG[monster.weakness];
  const cycle = Math.floor(currentMonsterIndex / MONSTERS_DB.length);

  useEffect(() => {
    if (lastDamage) { setIsShaking(true); setTimeout(() => setIsShaking(false), 600); }
  }, [lastDamage]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">오늘의 토벌전</span>
          {cycle > 0 && <span className="text-xs font-bold text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/15">강화 +{cycle}</span>}
        </div>
      </div>

      {/* Monster display */}
      <div className="relative flex flex-col items-center py-5 px-4">
        {/* Floating damage */}
        <AnimatePresence>
          {lastDamage && <DamageNumber key={lastDamage.id} damage={lastDamage.damage} isCrit={lastDamage.isCrit} onDone={onDamageDone} />}
        </AnimatePresence>

        {/* Ambient glow */}
        <div className={`absolute inset-0 rounded-2xl ${monster.tier === 'boss' ? 'bg-gradient-radial-boss' : ''}`} style={{ background: monster.tier === 'boss' ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)' : 'radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />

        {/* Monster emoji */}
        <motion.div
          animate={isShaking ? { x: [-10, 10, -7, 7, -4, 4, 0], rotate: [-5, 5, -3, 3, 0] } : { x: 0, rotate: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-7xl mb-3 select-none relative z-10"
          style={{ filter: monster.tier === 'boss' ? 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' : 'drop-shadow(0 0 12px rgba(139,92,246,0.4))' }}
        >
          {monster.emoji}
        </motion.div>

        {/* Name & Tier */}
        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${tier.bg} ${tier.color} ${tier.border} border`}>{tier.label}</span>
            <h3 className="text-base font-bold text-white/90">{monster.name}</h3>
          </div>
          <p className="text-xs text-white/35 mb-3 px-2 leading-relaxed">{monster.desc}</p>
          {/* Weakness */}
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-white/35">약점</span>
            <span className={`font-bold ${weakness.textClass}`}>{weakness.icon} {weakness.label}</span>
            <span className="text-white/25">→ x1.5 데미지</span>
          </div>
        </div>
      </div>

      {/* HP Bar */}
      <div className="px-5 pb-3">
        <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className="text-white/40 font-bold">HP</span>
          <span className={`font-bold tabular-nums ${hpPercent < 25 ? 'text-red-400 animate-pulse' : 'text-white/60'}`}>{monsterHp} / {maxHp}</span>
        </div>
        <div className="h-5 bg-black/40 rounded-full overflow-hidden border border-white/6 relative">
          <motion.div
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full relative ${
              hpPercent > 60 ? 'bg-gradient-to-r from-emerald-700 to-emerald-400'
              : hpPercent > 25 ? 'bg-gradient-to-r from-amber-700 to-amber-400'
              : 'bg-gradient-to-r from-red-800 to-red-500'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
            {/* Shimmer */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse" style={{ left: '40%' }} />
            </div>
          </motion.div>
        </div>
        {/* HP percentage text */}
        <div className="flex justify-end mt-1">
          <span className="text-xs text-white/20">{Math.round(hpPercent)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
          <span className="text-white/35">⚔️ 총 처치</span>
          <span className="font-bold text-white/60">{monsterKillCount}마리</span>
        </div>
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
          <span className="text-white/35">🎯 목표</span>
          <span className="font-bold text-white/60">퀘스트 완료</span>
        </div>
      </div>

      {/* Hint */}
      <div className="mx-5 mb-5 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-center text-purple-300/50 leading-relaxed">
        퀘스트를 완료하면 자동으로 데미지가 가해집니다<br />
        <span className={`font-bold ${weakness.textClass}`}>{weakness.icon} {weakness.label}</span> 관련 퀘스트는 <span className="text-yellow-400/70 font-bold">치명타!</span>
      </div>
    </div>
  );
};

// --- Item Card ---
const ItemCard = ({ item, onUse, onEquip, isEquipped }) => {
  const rarity = RARITY_CONFIG[item.rarity];
  const slotCfg = item.slot ? SLOT_CONFIG[item.slot] : null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isEquipped ? 'border-amber-500/50 bg-amber-500/5' : `${rarity.bg} ${rarity.border}`}`}>
      <span className="text-2xl flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.color} border ${rarity.border}`}>{rarity.label}</span>
          {slotCfg && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/20">{slotCfg.icon} {slotCfg.label}</span>}
          {isEquipped && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">장착 중</span>}
          <span className="text-sm font-bold text-white/90 truncate">{item.name}</span>
        </div>
        <p className="text-xs text-white/40">{item.desc}</p>
        <p className="text-[10px] text-white/20 mt-0.5">{timeAgo(item.acquiredAt)}에 획득</p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {onEquip && (
          <button onClick={onEquip}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
              isEquipped
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
            }`}>
            {isEquipped ? '해제' : '장착'}
          </button>
        )}
        {onUse && (
          <button onClick={onUse} className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all active:scale-95">
            사용
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- Inventory Panel ---
const InventoryPanel = () => {
  const { inventory, useItem, equipItem, equippedItems } = useGameStore();
  const equipment   = inventory.filter(i => i.type === 'equipment');
  const consumables = inventory.filter(i => i.type === 'consumable');

  const isEquipped = (instanceId) => Object.values(equippedItems).includes(instanceId);

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-white/20">
        <span className="text-5xl mb-3">🎒</span>
        <p className="text-sm font-medium">인벤토리가 비어있습니다</p>
        <p className="text-xs mt-1">몬스터를 처치하면 아이템을 획득합니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {equipment.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">장비 아이템 ({equipment.length})</p>

          {/* Equipped slots summary */}
          <div className="flex gap-2 mb-3">
            {Object.entries(SLOT_CONFIG).map(([slot, cfg]) => {
              const iid = equippedItems[slot];
              const item = iid ? inventory.find(i => i.instanceId === iid) : null;
              return (
                <div key={slot} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border text-center ${item ? 'bg-amber-500/8 border-amber-500/25' : 'bg-white/[0.02] border-white/8'}`}>
                  <span className="text-lg leading-none">{item ? item.emoji : cfg.icon}</span>
                  <span className="text-[9px] font-bold text-white/30">{cfg.label}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {equipment.map(item => (
              <ItemCard
                key={item.instanceId}
                item={item}
                isEquipped={isEquipped(item.instanceId)}
                onEquip={() => equipItem(item.instanceId)}
              />
            ))}
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-center">장착한 장비는 퀘스트 완료 시 스탯 보너스를 줍니다</p>
        </div>
      )}
      {consumables.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">소비 아이템 ({consumables.length})</p>
          <div className="space-y-2">
            {consumables.map(item => <ItemCard key={item.instanceId} item={item} onUse={() => useItem(item.instanceId)} />)}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Loot Modal ---
const LootModal = ({ loot, onClose }) => {
  const monster = loot.monster;
  const tier = TIER_CONFIG[monster.tier];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.75, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
        className="relative glass rounded-3xl p-8 w-full max-w-sm border border-amber-500/30 shadow-2xl shadow-amber-500/15 text-center overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.1, duration: 0.5 }} className="text-6xl mb-2 relative">
          {monster.emoji}
        </motion.div>
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${tier.bg} ${tier.color} ${tier.border} border mb-2`}>{tier.label}</span>
        <h2 className="text-xl font-black text-white mb-1">{monster.name} <span className="text-amber-300">처치!</span></h2>
        <p className="text-sm text-white/40 mb-5">내면의 악습을 물리쳤습니다!</p>

        {/* Gold */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <span className="text-3xl">🪙</span>
          <span className="text-3xl font-black text-amber-300">+{loot.gold} GP</span>
        </motion.div>

        {/* Item drops */}
        {loot.items.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">아이템 드롭!</p>
            <div className="space-y-2">
              {loot.items.map((item, i) => {
                const rarity = RARITY_CONFIG[item.rarity];
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left ${rarity.bg} ${rarity.border}`}>
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.color} border ${rarity.border}`}>{rarity.label}</span>
                        <span className="text-sm font-bold text-white/90">{item.name}</span>
                      </div>
                      <p className="text-xs text-white/40">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base shadow-lg shadow-amber-500/40 hover:shadow-xl transition-all"
        >
          ⚔️ 전리품 수령!
        </motion.button>
      </motion.div>
    </motion.div>
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
    currentMonsterIndex, monsterHp, monsterKillCount, inventory, lootDrop,
    completeQuest, addQuest, removeQuest, allocateStat, clearLootDrop,
  } = useGameStore();

  const { avatarSrc, uploadAvatar } = useAvatar();
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [rightTab, setRightTab] = useState('battle');
  const [lastDamage, setLastDamage] = useState(null);

  const maxExp = getExpForLevel(level);
  const xpPercentage = Math.min(100, (exp / maxExp) * 100);
  const completedCount = quests.filter(q => q.completed).length;
  const pendingQuests = quests.filter(q => !q.completed);
  const doneQuests = quests.filter(q => q.completed);

  const handleCompleteQuest = (questId) => {
    const result = completeQuest(questId);
    if (!result) return;
    if (result.leveledUp) setLevelUpLevel(result.newLevel);
    if (result.damage) {
      setLastDamage({ id: Date.now(), damage: result.damage, isCrit: result.isCrit });
      // Switch to battle tab so player sees the hit
      setRightTab('battle');
    }
  };

  // Switch to inventory when loot is cleared (to show new items)
  const handleLootClose = () => {
    clearLootDrop();
    setRightTab('inventory');
  };

  const rightTabs = [
    { key: 'battle',    icon: '⚔️', label: '토벌전' },
    { key: 'log',       icon: '📜', label: '활동 기록' },
    { key: 'inventory', icon: '🎒', label: inventory.length > 0 ? `인벤토리 (${inventory.length})` : '인벤토리' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 md:py-5">
          <div className="flex items-center gap-5">
            <AvatarDisplay avatarSrc={avatarSrc} onUpload={uploadAvatar} level={level} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="font-fantasy text-xl md:text-2xl gold-text truncate font-bold">{characterName}</h1>
                <span className="text-purple-300/70 text-xs font-semibold bg-purple-500/15 px-2.5 py-1 rounded-lg whitespace-nowrap border border-purple-500/15">{characterClass}</span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm"><span>🪙</span><span className="text-amber-300 font-bold">{gold.toLocaleString()}</span><span className="text-white/25 text-xs">GP</span></div>
                <div className="w-px h-4 bg-white/8" />
                <div className="flex items-center gap-1.5 text-sm"><span className="streak-fire">🔥</span><span className="text-orange-300 font-bold">{streak}</span><span className="text-white/25 text-xs">일 연속</span></div>
                {statPoints > 0 && (<>
                  <div className="w-px h-4 bg-white/8" />
                  <div className="flex items-center gap-1.5 text-sm"><span>✨</span><span className="text-amber-200 font-bold">{statPoints}</span><span className="text-white/25 text-xs">포인트</span></div>
                </>)}
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 text-sm"><span className="text-white/30 text-xs">누적 달성</span><span className="text-white/60 font-bold">{totalCompleted}</span></div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-purple-300/70 font-semibold">경험치</span>
                  <span className="text-xs text-white/40 font-mono tabular-nums">{exp} / {maxExp} XP</span>
                </div>
                <div className="h-3.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div className="h-full xp-bar-fill rounded-full relative" initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} transition={{ duration: 1, ease: 'easeOut' }}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-full" />
                  </motion.div>
                </div>
              </div>
            </div>
            <button onClick={() => setShowSettings(true)} className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8 transition-all flex items-center justify-center">
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
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="glass rounded-2xl border border-white/6 flex flex-col"
              style={{ minHeight: 'calc(100vh - 12rem)' }}
            >
              <div className="flex items-center justify-between p-6 md:p-7 pb-4 flex-shrink-0">
                <h2 className="text-base font-bold text-white/70 flex items-center gap-2"><span className="text-xl">⚔️</span> 능력치</h2>
                {statPoints > 0 && (
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/20 animate-pulse">{statPoints}P 분배 가능</span>
                )}
              </div>
              <div className="overflow-y-auto scrollbar-thin px-6 md:px-7 pb-6 md:pb-7 space-y-5 flex-1">
                {Object.entries(stats).map(([key, value]) => (
                  <StatBar key={key} statKey={key} value={value} onAllocate={allocateStat} canAllocate={statPoints > 0} />
                ))}
              </div>
            </motion.div>
          </div>

          {/* ===== CENTER COLUMN: Daily Goals ===== */}
          <div className="lg:col-span-5 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <TodaySummaryCard completedToday={completedCount} totalQuests={quests.length} streak={streak} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-6 md:p-8 border border-purple-500/10 flex flex-col"
              style={{ minHeight: 'calc(100vh - 22rem)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3"><span className="text-2xl">🎯</span>오늘의 핵심 목표</h2>
                  <span className="text-sm font-bold bg-purple-500/15 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/15">{completedCount}/{quests.length}</span>
                </div>
                <button onClick={() => setShowAddQuest(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-600/25 hover:shadow-xl hover:shadow-purple-600/35 hover:scale-[1.02] active:scale-[0.97] transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  목표 추가
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {pendingQuests.length === 0 && doneQuests.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-white/20">
                      <span className="text-6xl mb-4">🎯</span>
                      <p className="text-lg font-bold mb-1">오늘의 목표를 설정하세요</p>
                      <p className="text-sm">"목표 추가" 버튼을 눌러 시작하세요</p>
                    </motion.div>
                  )}
                  {pendingQuests.map(quest => (
                    <QuestItem key={quest.id} quest={quest} onComplete={handleCompleteQuest} onRemove={removeQuest} />
                  ))}
                </AnimatePresence>
              </div>

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
                        <QuestItem key={quest.id} quest={quest} onComplete={handleCompleteQuest} onRemove={removeQuest} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* ===== RIGHT COLUMN: Battle / Log / Inventory ===== */}
          <div className="lg:col-span-4 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="glass rounded-2xl border border-white/6 flex flex-col overflow-hidden"
              style={{ minHeight: 'calc(100vh - 12rem)' }}
            >
              {/* Tab Bar */}
              <div className="flex border-b border-white/6 flex-shrink-0">
                {rightTabs.map(tab => (
                  <button key={tab.key} onClick={() => setRightTab(tab.key)}
                    className={`flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      rightTab === tab.key
                        ? 'text-purple-300 border-b-2 border-purple-400 bg-purple-500/5'
                        : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="wait">
                  {rightTab === 'battle' && (
                    <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <MonsterBattlePanel lastDamage={lastDamage} onDamageDone={() => setLastDamage(null)} />
                    </motion.div>
                  )}
                  {rightTab === 'log' && (
                    <motion.div key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5 md:p-6">
                      <ActivityFeed activities={activities} />
                    </motion.div>
                  )}
                  {rightTab === 'inventory' && (
                    <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-4 md:p-5">
                      <InventoryPanel />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="glass border-t border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-center justify-between">
          <p className="text-xs text-white/20">HeroForge — 나의 성장 여정</p>
          <p className="text-xs text-white/15">매일의 노력이 모여 큰 성장이 됩니다 ✨</p>
        </div>
      </footer>


      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {showAddQuest && <AddQuestModal isOpen={showAddQuest} onClose={() => setShowAddQuest(false)} onAdd={addQuest} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {levelUpLevel && <LevelUpOverlay level={levelUpLevel} onDismiss={() => setLevelUpLevel(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {lootDrop && <LootModal loot={lootDrop} onClose={handleLootClose} />}
      </AnimatePresence>
    </div>
  );
};


// ==========================================
// RENDER
// ==========================================
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
