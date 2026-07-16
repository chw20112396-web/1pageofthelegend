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

// 4-tier rarity system (C→B→A→S)
const RARITY_CONFIG = {
  COMMON:    { label: 'C등급', color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30',  shadow: '' },
  RARE:      { label: 'B등급', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/40',   shadow: '0 0 12px rgba(59,130,246,0.4)' },
  EPIC:      { label: 'A등급', color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/40', shadow: '0 0 14px rgba(168,85,247,0.5)' },
  LEGENDARY: { label: 'S등급', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/50',  shadow: '0 0 18px rgba(245,158,11,0.6)' },
};

// Equipment slot positions on paper-doll (per spec)
const SLOT_CONFIG = {
  HAT:    { label: '머리', icon: '🪖', style: { top: '12%', left: '46%', fontSize: '1.6rem' } },
  WEAPON: { label: '무기', icon: '⚔️', style: { top: '55%', left: '22%', fontSize: '1.8rem' } },
  ARMOR:  { label: '갑옷', icon: '🛡️', style: { top: '62%', left: '43%', fontSize: '1.6rem' } },
};

// Class evolution config
const CLASS_CONFIG = {
  '초보 모험가': { aura: null, title: '초보 모험가', condition: null },
  '전사': {
    aura: ['#ef4444', '#f97316', '#ef4444'],
    title: '전설의 전사',
    icon: '⚔️',
    desc: 'STR + VIT ≥ 30',
    check: (s) => s.STR + s.VIT >= 30,
  },
  '마법사': {
    aura: ['#3b82f6', '#8b5cf6', '#3b82f6'],
    title: '대마법사',
    icon: '🔮',
    desc: 'INT + WIS ≥ 30',
    check: (s) => s.INT + s.WIS >= 30,
  },
  '도적': {
    aura: ['#22c55e', '#06b6d4', '#22c55e'],
    title: '그림자 도적',
    icon: '🗡️',
    desc: 'AGI + CHA ≥ 30',
    check: (s) => s.AGI + s.CHA >= 30,
  },
};

// Base items (from monster drops)
const ITEMS_DB = [
  { id: 'eq_int', name: '지식의 서',       emoji: '📚', type: 'equipment',  stat: 'INT', bonus: 2, slot: 'WEAPON', rarity: 'COMMON', defense: 0, bonusMultiplier: 1.0,  desc: 'INT 보상 +2 (장착 시)' },
  { id: 'eq_str', name: '강철 의지 반지',  emoji: '💍', type: 'equipment',  stat: 'STR', bonus: 2, slot: 'ARMOR',  rarity: 'COMMON', defense: 2, bonusMultiplier: 1.0,  desc: 'STR +2, 방어 2 (장착 시)' },
  { id: 'eq_wis', name: '현자의 안경',     emoji: '🔮', type: 'equipment',  stat: 'WIS', bonus: 2, slot: 'HAT',    rarity: 'RARE',   defense: 3, bonusMultiplier: 1.1,  desc: 'WIS +2, 방어 3, 보상 1.1× (장착 시)' },
  { id: 'eq_agi', name: '번개 발목 밴드',  emoji: '⚡', type: 'equipment',  stat: 'AGI', bonus: 2, slot: 'ARMOR',  rarity: 'RARE',   defense: 3, bonusMultiplier: 1.1,  desc: 'AGI +2, 방어 3, 보상 1.1× (장착 시)' },
  { id: 'eq_vit', name: '생명의 부적',     emoji: '🧿', type: 'equipment',  stat: 'VIT', bonus: 2, slot: 'WEAPON', rarity: 'RARE',   defense: 0, bonusMultiplier: 1.1,  desc: 'VIT +2, 보상 1.1× (장착 시)' },
  { id: 'eq_cha', name: '카리스마 망토',   emoji: '🪄', type: 'equipment',  stat: 'CHA', bonus: 2, slot: 'HAT',    rarity: 'RARE',   defense: 0, bonusMultiplier: 1.1,  desc: 'CHA +2, 보상 1.1× (장착 시)' },
  { id: 'cs_xp',  name: '경험치 물약',     emoji: '🧪', type: 'consumable', effect: { xp: 100 },       rarity: 'COMMON', defense: 0, bonusMultiplier: 1.0, desc: 'XP +100 즉시 획득' },
  { id: 'cs_gp',  name: '황금 조각',       emoji: '🪙', type: 'consumable', effect: { gp: 50 },        rarity: 'COMMON', defense: 0, bonusMultiplier: 1.0, desc: 'GP +50 즉시 획득' },
  { id: 'cs_all', name: '만능 강화석',     emoji: '💎', type: 'consumable', effect: { allStats: 1 },   rarity: 'EPIC',   defense: 0, bonusMultiplier: 1.0, desc: '전 능력치 +1' },
  { id: 'cs_pts', name: '성장의 결정',     emoji: '✨', type: 'consumable', effect: { statPoints: 3 }, rarity: 'EPIC',   defense: 0, bonusMultiplier: 1.0, desc: '능력치 포인트 +3' },
];

// Gacha-exclusive item pool
const GACHA_POOL = [
  // COMMON (C)
  { id: 'g_c1', name: '낡은 검',       emoji: '🗡️', type: 'equipment',  slot: 'WEAPON', stat: 'STR', bonus: 1, rarity: 'COMMON', defense: 0,  bonusMultiplier: 1.0,  desc: 'STR +1 (장착 시)' },
  { id: 'g_c2', name: '천 모자',       emoji: '🎩', type: 'equipment',  slot: 'HAT',    stat: 'WIS', bonus: 1, rarity: 'COMMON', defense: 1,  bonusMultiplier: 1.0,  desc: 'WIS +1, 방어 1 (장착 시)' },
  { id: 'g_c3', name: '낡은 갑주',     emoji: '🥋', type: 'equipment',  slot: 'ARMOR',  stat: 'VIT', bonus: 1, rarity: 'COMMON', defense: 3,  bonusMultiplier: 1.0,  desc: 'VIT +1, 방어 3 (장착 시)' },
  { id: 'g_c4', name: '소형 경험치 물약', emoji: '🧪', type: 'consumable', effect: { xp: 50 },  rarity: 'COMMON', defense: 0, bonusMultiplier: 1.0, desc: 'XP +50' },
  { id: 'g_c5', name: '동전 주머니',   emoji: '💰', type: 'consumable', effect: { gp: 30 },  rarity: 'COMMON', defense: 0, bonusMultiplier: 1.0, desc: 'GP +30' },
  // RARE (B)
  { id: 'g_r1', name: '마법의 지팡이', emoji: '🪄', type: 'equipment',  slot: 'WEAPON', stat: 'INT', bonus: 4, rarity: 'RARE',   defense: 0,  bonusMultiplier: 1.15, desc: 'INT +4, 보상 1.15× (장착 시)' },
  { id: 'g_r2', name: '기사의 투구',   emoji: '⛑️', type: 'equipment',  slot: 'HAT',    stat: 'VIT', bonus: 3, rarity: 'RARE',   defense: 6,  bonusMultiplier: 1.1,  desc: 'VIT +3, 방어 6 (장착 시)' },
  { id: 'g_r3', name: '은빛 갑주',     emoji: '🛡️', type: 'equipment',  slot: 'ARMOR',  stat: 'STR', bonus: 3, rarity: 'RARE',   defense: 9,  bonusMultiplier: 1.1,  desc: 'STR +3, 방어 9 (장착 시)' },
  { id: 'g_r4', name: '대형 경험치 물약', emoji: '💊', type: 'consumable', effect: { xp: 200 }, rarity: 'RARE',   defense: 0, bonusMultiplier: 1.0, desc: 'XP +200' },
  // EPIC (A)
  { id: 'g_e1', name: '영웅의 검',     emoji: '⚔️', type: 'equipment',  slot: 'WEAPON', stat: 'STR', bonus: 6, rarity: 'EPIC',   defense: 0,  bonusMultiplier: 1.25, desc: 'STR +6, 보상 1.25× (장착 시)' },
  { id: 'g_e2', name: '용사의 왕관',   emoji: '👑', type: 'equipment',  slot: 'HAT',    stat: 'CHA', bonus: 5, rarity: 'EPIC',   defense: 12, bonusMultiplier: 1.2,  desc: 'CHA +5, 방어 12 (장착 시)' },
  { id: 'g_e3', name: '빛의 갑옷',     emoji: '🌟', type: 'equipment',  slot: 'ARMOR',  stat: 'VIT', bonus: 5, rarity: 'EPIC',   defense: 16, bonusMultiplier: 1.2,  desc: 'VIT +5, 방어 16 (장착 시)' },
  { id: 'g_e4', name: '고급 강화석',   emoji: '💎', type: 'consumable', effect: { allStats: 2 }, rarity: 'EPIC',   defense: 0, bonusMultiplier: 1.0, desc: '전 능력치 +2' },
  // LEGENDARY (S)
  { id: 'g_l1', name: '전설의 성검',   emoji: '🗡️', type: 'equipment',  slot: 'WEAPON', stat: 'STR', bonus: 10, rarity: 'LEGENDARY', defense: 0,  bonusMultiplier: 1.5, desc: 'STR +10, 보상 1.5× (장착 시)' },
  { id: 'g_l2', name: '현자의 왕관',   emoji: '🔱', type: 'equipment',  slot: 'HAT',    stat: 'WIS', bonus: 10, rarity: 'LEGENDARY', defense: 20, bonusMultiplier: 1.5, desc: 'WIS +10, 방어 20 (장착 시)' },
  { id: 'g_l3', name: '불멸의 갑옷',   emoji: '🏛️', type: 'equipment',  slot: 'ARMOR',  stat: 'VIT', bonus: 10, rarity: 'LEGENDARY', defense: 25, bonusMultiplier: 1.5, desc: 'VIT +10, 방어 25 (장착 시)' },
  { id: 'g_l4', name: '신의 축복서',   emoji: '📜', type: 'consumable', effect: { allStats: 5, xp: 500 }, rarity: 'LEGENDARY', defense: 0, bonusMultiplier: 1.0, desc: '전 능력치 +5, XP +500' },
];

// ==========================================
// TITLE / PET / SUDDEN MISSION DATA
// ==========================================
const TITLE_DB = {
  ghost_slayer: {
    id: 'ghost_slayer', name: '미루기 도살자',
    effectText: '모든 데미지 +15%',
    gradient: 'from-red-400 to-orange-400',
    condition: '미루기 망령 5회 처치',
    check: (s) => (s.ghostAttackCount || 0) >= 5,
  },
  dawn_ruler: {
    id: 'dawn_ruler', name: '새벽의 지배자',
    effectText: 'INT +3 보너스',
    gradient: 'from-blue-300 to-cyan-300',
    condition: '오전 8시 이전 퀘스트 완료',
    check: (s) => (s.dawnCompleteCount || 0) >= 1,
  },
  destroyer: {
    id: 'destroyer', name: '파괴의 손가락',
    effectText: '골드 획득량 ×1.1',
    gradient: 'from-purple-400 to-pink-400',
    condition: '장비 강화 성공 5회',
    check: (s) => (s.enhanceSuccessCount || 0) >= 5,
  },
  godlife: {
    id: 'godlife', name: '갓생의 화신',
    effectText: '경험치 획득량 ×1.15',
    gradient: 'from-amber-400 to-yellow-300',
    condition: '피버 타임 3회 발동',
    check: (s) => (s.feverTriggerCount || 0) >= 3,
  },
};

const PET_DB = {
  slime: { id: 'slime', name: '아기 슬라임',      emoji: '🟢', effectText: '퀘스트 GP +5%',          goldBonus: 0.05,  cost: 200 },
  owl:   { id: 'owl',   name: '집중하는 올빼미',  emoji: '🦉', effectText: 'INT/WIS 획득 +10%',       intWisBonus: 0.1, cost: 250 },
  shiba: { id: 'shiba', name: '달리는 시바견',    emoji: '🐕', effectText: 'VIT 경험치 획득 +10%',    vitBonus: 0.1,    cost: 220 },
};

const SUDDEN_MISSIONS_POOL = [
  { id: 'sm1', title: '🚨 [돌발] 뇌에 산소 공급하기!',        desc: '지금 즉시 가벼운 스트레칭이나 물 한 컵을 마시세요!',         timeLimit: 15 * 60, rewardGp: 150, rewardXp: 300 },
  { id: 'sm2', title: '🚨 [돌발] 딥 워크(Deep Work) 돌입!',   desc: '딴짓하지 않고 30분 동안 집중 타이머를 작동시키세요!',         timeLimit: 30 * 60, rewardGp: 300, rewardXp: 500 },
  { id: 'sm3', title: '🚨 [돌발] 지금 당장 회고록 작성!',     desc: '오늘 배운 것을 3줄 이상 기록하세요!',                         timeLimit: 10 * 60, rewardGp: 100, rewardXp: 200 },
  { id: 'sm4', title: '🚨 [돌발] 감사 일기 적기!',            desc: '오늘 감사한 일 3가지를 지금 바로 적어보세요!',                 timeLimit: 5  * 60, rewardGp:  80, rewardXp: 150 },
];

// Enhancement success rates by target level
const ENHANCE_RATES = [1.0, 1.0, 1.0, 0.70, 0.50, 0.35, 0.25];
const ENHANCE_COST_GP = [0, 50, 100, 150, 200, 250, 300];

function getEnhancedStats(item) {
  const lv = item.enhanceLevel || 0;
  if (lv === 0) return item;
  const f = Math.pow(1.1, lv);
  return {
    ...item,
    bonusMultiplier: item.bonusMultiplier > 1.0 ? Math.round(item.bonusMultiplier * f * 1000) / 1000 : item.bonusMultiplier,
    defense: item.defense > 0 ? Math.floor(item.defense * f) : 0,
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function rollLoot(monster) {
  const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const byRarity = (r) => ITEMS_DB.filter(i => i.rarity === r);
  const drops = [];
  const r = Math.random();
  if (monster.tier === 'boss') {
    drops.push(pick(byRarity('EPIC')) || pick(byRarity('RARE')));
    if (Math.random() < 0.6) drops.push(pick(byRarity('RARE')));
  } else if (monster.tier === 'elite') {
    drops.push(r < 0.15 ? pick(byRarity('EPIC')) : r < 0.55 ? pick(byRarity('RARE')) : pick(byRarity('COMMON')));
  } else {
    drops.push(r < 0.05 ? pick(byRarity('EPIC')) : r < 0.35 ? pick(byRarity('RARE')) : pick(byRarity('COMMON')));
  }
  return drops.filter(Boolean);
}

function rollGacha(boxType) {
  // SILVER: C 60%, B 30%, A 9%, S 1%
  // GOLD:   C 20%, B 40%, A 30%, S 10%
  const rates = boxType === 'SILVER'
    ? { LEGENDARY: 0.01, EPIC: 0.09, RARE: 0.30 }
    : { LEGENDARY: 0.10, EPIC: 0.30, RARE: 0.40 };
  const r = Math.random();
  let rarity;
  if (r < rates.LEGENDARY) rarity = 'LEGENDARY';
  else if (r < rates.LEGENDARY + rates.EPIC) rarity = 'EPIC';
  else if (r < rates.LEGENDARY + rates.EPIC + rates.RARE) rarity = 'RARE';
  else rarity = 'COMMON';
  const pool = GACHA_POOL.filter(i => i.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function calcDamage(quest, stats, monster) {
  const diff = DIFFICULTY_CONFIG[quest.difficulty];
  let base = diff.xp / 5;
  let statBonus = 0;
  if (quest.statReward) {
    Object.entries(quest.statReward).forEach(([k, pts]) => { statBonus += pts * (stats[k] || 1); });
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
  { id: 'q1', title: '코어 과목(국/영/수) 3시간 집중력 유지하기',   difficulty: 'hard',   statReward: { INT: 3, WIS: 2 }, completed: false, createdAt: Date.now() },
  { id: 'q2', title: '인공지능(AI) 알고리즘 파이썬 코딩 구현',      difficulty: 'epic',   statReward: { INT: 4, AGI: 2 }, completed: false, createdAt: Date.now() },
  { id: 'q3', title: '기술 윤리 및 노동 인권 관련 회고 일지 작성',  difficulty: 'medium', statReward: { WIS: 3, CHA: 1 }, completed: false, createdAt: Date.now() },
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
  return days < 7 ? `${days}일 전` : `${Math.floor(days / 7)}주 전`;
}

// ==========================================
// INITIAL STATE
// ==========================================
const RARITY_MIGRATE = { common: 'COMMON', uncommon: 'RARE', rare: 'EPIC' };

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.level === 'number' && parsed.stats && parsed.quests) {
        // Back-fill new fields
        if (parsed.currentMonsterIndex === undefined) parsed.currentMonsterIndex = 0;
        if (parsed.monsterHp === undefined) parsed.monsterHp = MONSTERS_DB[0].baseHp;
        if (parsed.monsterKillCount === undefined) parsed.monsterKillCount = 0;
        if (!parsed.inventory) parsed.inventory = [];
        if (!parsed.equippedItems) parsed.equippedItems = { HAT: null, WEAPON: null, ARMOR: null };
        if (!parsed.jobClass) parsed.jobClass = '초보 모험가';
        if (parsed.combo === undefined) parsed.combo = 0;
        if (parsed.isFever === undefined) parsed.isFever = false;
        if (!parsed.systemLogs) parsed.systemLogs = [];
        if (!parsed.lastDailyResetKey) parsed.lastDailyResetKey = null;
        // New fields (v2)
        if (parsed.userTitle === undefined) parsed.userTitle = null;
        if (!parsed.unlockedTitles) parsed.unlockedTitles = [];
        if (parsed.enhancementStones === undefined) parsed.enhancementStones = 0;
        if (parsed.activePet === undefined) parsed.activePet = null;
        if (parsed.ownedPets === undefined) parsed.ownedPets = [];
        if (parsed.ghostAttackCount === undefined) parsed.ghostAttackCount = 0;
        if (parsed.enhanceSuccessCount === undefined) parsed.enhanceSuccessCount = 0;
        if (parsed.feverTriggerCount === undefined) parsed.feverTriggerCount = 0;
        if (parsed.dawnCompleteCount === undefined) parsed.dawnCompleteCount = 0;
        // Migrate old rarity values & add missing fields to inventory items
        parsed.inventory = parsed.inventory.map(item => ({
          ...item,
          rarity: RARITY_MIGRATE[item.rarity] || item.rarity || 'COMMON',
          defense: item.defense ?? 0,
          bonusMultiplier: item.bonusMultiplier ?? 1.0,
          enhanceLevel: item.enhanceLevel ?? 0,
        }));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('HeroForge: 저장된 데이터 로드 실패, 초기화합니다.', e);
  }

  return {
    characterName: '영웅',
    characterClass: '수련생',
    jobClass: '초보 모험가',
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
    currentMonsterIndex: 0,
    monsterHp: MONSTERS_DB[0].baseHp,
    monsterKillCount: 0,
    inventory: [],
    equippedItems: { HAT: null, WEAPON: null, ARMOR: null },
    combo: 0,
    isFever: false,
    systemLogs: [],
    lastDailyResetKey: null,
    userTitle: null,
    unlockedTitles: [],
    enhancementStones: 0,
    activePet: null,
    ownedPets: [],
    ghostAttackCount: 0,
    enhanceSuccessCount: 0,
    feverTriggerCount: 0,
    dawnCompleteCount: 0,
  };
}


// ==========================================
// ZUSTAND STORE
// ==========================================
const useGameStore = create((set, get) => ({
  ...getInitialState(),
  lootDrop: null,
  ghostAttackEvent: null,
  gachaResult: null,

  _persist: () => {
    const state = get();
    const toSave = {
      characterName: state.characterName,
      characterClass: state.characterClass,
      jobClass: state.jobClass,
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
      combo: state.combo,
      isFever: state.isFever,
      systemLogs: state.systemLogs,
      lastDailyResetKey: state.lastDailyResetKey,
      userTitle: state.userTitle,
      unlockedTitles: state.unlockedTitles,
      enhancementStones: state.enhancementStones,
      activePet: state.activePet,
      ownedPets: state.ownedPets,
      ghostAttackCount: state.ghostAttackCount,
      enhanceSuccessCount: state.enhanceSuccessCount,
      feverTriggerCount: state.feverTriggerCount,
      dawnCompleteCount: state.dawnCompleteCount,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)); } catch(e) {}
  },

  setCharacterName: (name) => { set({ characterName: name }); get()._persist(); },
  setCharacterClass: (cls)  => { set({ characterClass: cls }); get()._persist(); },

  promoteClass: (targetClass) => {
    const state = get();
    const cfg = CLASS_CONFIG[targetClass];
    if (!cfg || !cfg.check || !cfg.check(state.stats)) return;
    const log = `[전직] ${state.characterName}이(가) ${cfg.title}(으)로 전직했습니다! 🎉`;
    set({
      jobClass: targetClass,
      systemLogs: [log, ...state.systemLogs].slice(0, 30),
      activities: [{ id: Date.now(), text: log, timestamp: Date.now(), type: 'promote' }, ...state.activities].slice(0, 20),
    });
    get()._persist();
  },

  completeQuest: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.completed) return null;

    const diff = DIFFICULTY_CONFIG[quest.difficulty];

    // Resolve equipped items
    const equippedObjs = Object.values(state.equippedItems)
      .filter(Boolean)
      .map(iid => state.inventory.find(i => i.instanceId === iid))
      .filter(Boolean);

    // Multipliers: equipment (enhanced) × fever × title effects
    const equippedEnhanced = equippedObjs.map(getEnhancedStats);
    const equipMultiplier = equippedEnhanced.reduce((m, i) => m * (i.bonusMultiplier || 1.0), 1.0);
    const feverMult = state.isFever ? 1.5 : 1.0;
    const titleXpMult = state.userTitle === 'godlife' ? 1.15 : 1.0;
    const titleGpMult = state.userTitle === 'destroyer' ? 1.1 : 1.0;
    const petGpMult = state.activePet === 'slime' ? 1.05 : 1.0;
    const totalMult = equipMultiplier * feverMult;
    const xpGain = Math.floor(diff.xp * totalMult * titleXpMult);
    const gpGain = Math.floor(diff.gp * totalMult * titleGpMult * petGpMult);

    // Level up logic
    let newExp = state.exp + xpGain;
    let newLevel = state.level;
    let maxExp = getExpForLevel(state.level);
    let newStatPoints = state.statPoints;
    let leveledUp = false;
    while (newExp >= maxExp) {
      newExp -= maxExp; newLevel++; newStatPoints += 3;
      maxExp = getExpForLevel(newLevel); leveledUp = true;
    }

    // Stat reward with equipped bonuses
    const newStats = { ...state.stats };
    if (quest.statReward) {
      Object.entries(quest.statReward).forEach(([stat, amount]) => {
        const equip = equippedObjs.find(i => i.stat === stat);
        const bonus = equip ? (equip.bonus || 0) : 0;
        newStats[stat] = Math.min(100, (newStats[stat] || 1) + amount + bonus);
      });
    }

    // Streak
    const today = getTodayKey();
    let newStreak = state.streak;
    if (state.lastActiveDay !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yk = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      newStreak = state.lastActiveDay === yk ? newStreak + 1 : 1;
    }

    // Combo
    const newCombo = state.combo + 1;

    // Activity log
    const feverTag = state.isFever ? ' 🔥×1.5' : '';
    const newActivity = {
      id: Date.now(),
      text: `"${quest.title}" 달성 완료!${feverTag}`,
      xp: xpGain, gp: gpGain, statReward: quest.statReward,
      timestamp: Date.now(), type: 'quest',
    };
    const levelActivity = leveledUp
      ? { id: Date.now() + 1, text: `🎉 레벨 ${newLevel} 달성!`, timestamp: Date.now(), type: 'level' }
      : null;
    const newActivities = [...(levelActivity ? [levelActivity] : []), newActivity, ...state.activities].slice(0, 20);

    // Dawn completion tracking (before 8am)
    const hour = new Date().getHours();
    const isDawn = hour < 8;
    const newDawnCount = isDawn ? (state.dawnCompleteCount || 0) + 1 : (state.dawnCompleteCount || 0);

    // Check if all quests cleared after this one → Fever Time
    const remainingAfter = state.quests.filter(q => q.id !== questId && !q.completed).length;
    const newIsFever = remainingAfter === 0;
    const triggerFever = newIsFever && !state.isFever;
    const newFeverCount = triggerFever ? (state.feverTriggerCount || 0) + 1 : (state.feverTriggerCount || 0);

    // Monster damage
    const monster = MONSTERS_DB[state.currentMonsterIndex % MONSTERS_DB.length];
    const { damage, isCrit } = calcDamage(quest, state.stats, monster);
    const newHp = Math.max(0, state.monsterHp - damage);

    let monsterKillUpdates = {};
    let lootDrop = null;

    if (newHp <= 0) {
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
      setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#fbbf24', '#a855f7', '#ec4899', '#22c55e'] }), 200);
    } else {
      monsterKillUpdates = { monsterHp: newHp };
    }

    if (newIsFever && !state.isFever) {
      setTimeout(() => confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 }, colors: ['#ef4444', '#f97316', '#fbbf24', '#ef4444'] }), 300);
    }

    // Check for newly unlocked titles
    const newState = {
      ghostAttackCount: state.ghostAttackCount || 0,
      enhanceSuccessCount: state.enhanceSuccessCount || 0,
      feverTriggerCount: newFeverCount,
      dawnCompleteCount: newDawnCount,
    };
    const newUnlocked = Object.values(TITLE_DB)
      .filter(t => !state.unlockedTitles.includes(t.id) && t.check(newState))
      .map(t => t.id);
    const newUnlockedTitles = [...state.unlockedTitles, ...newUnlocked];

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
      combo: newCombo,
      isFever: newIsFever || state.isFever,
      feverTriggerCount: newFeverCount,
      dawnCompleteCount: newDawnCount,
      unlockedTitles: newUnlockedTitles,
      ...monsterKillUpdates,
    });

    get()._persist();
    return { leveledUp, newLevel, xpGain, gpGain, damage, isCrit, monsterKilled: newHp <= 0, combo: newCombo, triggerFever, newTitles: newUnlocked };
  },

  addQuest: (title, difficulty, statReward) => {
    const state = get();
    const newQuest = { id: `q_${Date.now()}`, title, difficulty: difficulty || 'medium', statReward: statReward || { INT: 1 }, completed: false, createdAt: Date.now() };
    set({ quests: [...state.quests, newQuest], isFever: false }); // adding a quest cancels fever
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
    if (item.effect?.xp) {
      let { exp, level, statPoints } = state;
      exp += item.effect.xp;
      let mx = getExpForLevel(level);
      while (exp >= mx) { exp -= mx; level++; statPoints += 3; mx = getExpForLevel(level); }
      Object.assign(updates, { exp, level, statPoints });
    }
    if (item.effect?.gp) updates.gold = state.gold + item.effect.gp;
    if (item.effect?.allStats) {
      const newStats = {};
      Object.keys(state.stats).forEach(k => { newStats[k] = Math.min(100, state.stats[k] + item.effect.allStats); });
      updates.stats = newStats;
    }
    if (item.effect?.statPoints) {
      updates.statPoints = (updates.statPoints !== undefined ? updates.statPoints : state.statPoints) + item.effect.statPoints;
    }
    set(updates);
    get()._persist();
  },

  equipItem: (instanceId) => {
    const state = get();
    const item = state.inventory.find(i => i.instanceId === instanceId);
    if (!item || item.type !== 'equipment' || !item.slot) return;
    const slot = item.slot;
    const current = state.equippedItems[slot];
    set({ equippedItems: { ...state.equippedItems, [slot]: current === instanceId ? null : instanceId } });
    get()._persist();
  },

  unequipSlot: (slot) => {
    const state = get();
    set({ equippedItems: { ...state.equippedItems, [slot]: null } });
    get()._persist();
  },

  buyGachaBox: (boxType) => {
    const state = get();
    const cost = boxType === 'SILVER' ? 50 : 150;
    if (state.gold < cost) return false;
    const item = rollGacha(boxType);
    const instanceId = `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const newItem = { ...item, instanceId, acquiredAt: Date.now() };
    set({
      gold: state.gold - cost,
      inventory: [...state.inventory, newItem],
      gachaResult: { item: newItem, boxType },
    });
    get()._persist();
    return true;
  },

  clearGachaResult: () => { set({ gachaResult: null }); },

  triggerDailyReset: () => {
    const state = get();
    const today = getTodayKey();
    const incompleteQuests = state.quests.filter(q => !q.completed);
    let ghostAttackEvent = null;
    let goldChange = 0;

    if (incompleteQuests.length > 0) {
      const rawPenalty = incompleteQuests.length * 10;
      const hatId = state.equippedItems.HAT;
      const armorId = state.equippedItems.ARMOR;
      const hatItem = hatId ? state.inventory.find(i => i.instanceId === hatId) : null;
      const armorItem = armorId ? state.inventory.find(i => i.instanceId === armorId) : null;
      const totalDefense = (hatItem?.defense || 0) + (armorItem?.defense || 0);
      const actualPenalty = Math.max(0, rawPenalty - totalDefense);
      goldChange = -actualPenalty;

      const defenseItems = [hatItem, armorItem].filter(Boolean).map(i => i.name).join(', ');
      const logMsg = totalDefense > 0
        ? `👻 미루기 망령의 습격! ${rawPenalty} GP 손실 예정 → [${defenseItems}]의 방어력 ${totalDefense} 덕분에 ${actualPenalty} GP만 잃었습니다!`
        : `👻 미루기 망령의 습격! 미완료 퀘스트 ${incompleteQuests.length}개 → ${actualPenalty} GP 손실!`;

      ghostAttackEvent = {
        incompleteCount: incompleteQuests.length,
        rawPenalty,
        totalDefense,
        actualPenalty,
        defenseItems,
        logMsg,
      };

      set({
        gold: Math.max(0, state.gold - actualPenalty),
        systemLogs: [logMsg, ...state.systemLogs].slice(0, 30),
        activities: [{ id: Date.now(), text: logMsg, timestamp: Date.now(), type: 'ghost' }, ...state.activities].slice(0, 20),
      });
    }

    // Track ghost attacks for title
    const newGhostCount = incompleteQuests.length > 0 ? (state.ghostAttackCount || 0) + 1 : (state.ghostAttackCount || 0);
    // Check for newly unlocked titles after ghost attack
    const ghostNewState = { ghostAttackCount: newGhostCount, enhanceSuccessCount: state.enhanceSuccessCount || 0, feverTriggerCount: state.feverTriggerCount || 0, dawnCompleteCount: state.dawnCompleteCount || 0 };
    const ghostNewUnlocked = Object.values(TITLE_DB).filter(t => !state.unlockedTitles.includes(t.id) && t.check(ghostNewState)).map(t => t.id);

    set({
      quests: state.quests.map(q => ({ ...q, completed: false, completedAt: undefined })),
      completedToday: 0,
      combo: 0,
      isFever: false,
      lastDailyResetKey: today,
      ghostAttackEvent,
      ghostAttackCount: newGhostCount,
      unlockedTitles: [...state.unlockedTitles, ...ghostNewUnlocked],
    });
    get()._persist();
  },

  clearGhostAttack: () => { set({ ghostAttackEvent: null }); },

  enhanceItem: (instanceId) => {
    const state = get();
    const item = state.inventory.find(i => i.instanceId === instanceId);
    if (!item || item.type !== 'equipment') return { success: false, reason: '장비만 강화 가능합니다' };
    const lv = item.enhanceLevel || 0;
    const targetLv = lv + 1;
    const costGp = ENHANCE_COST_GP[Math.min(lv, ENHANCE_COST_GP.length - 1)];
    if (state.enhancementStones < 1) return { success: false, reason: '만능 강화석이 부족합니다' };
    if (state.gold < costGp) return { success: false, reason: `GP가 부족합니다 (${costGp} GP 필요)` };
    const rate = ENHANCE_RATES[Math.min(lv, ENHANCE_RATES.length - 1)];
    const succeeded = Math.random() < rate;
    const newLv = succeeded ? targetLv : (lv > 3 ? lv - 1 : 0);
    const newInventory = state.inventory.map(i =>
      i.instanceId === instanceId ? { ...i, enhanceLevel: newLv } : i
    );
    const newEnhanceSuccessCount = succeeded ? (state.enhanceSuccessCount || 0) + 1 : (state.enhanceSuccessCount || 0);
    const enhNewState = { ghostAttackCount: state.ghostAttackCount || 0, enhanceSuccessCount: newEnhanceSuccessCount, feverTriggerCount: state.feverTriggerCount || 0, dawnCompleteCount: state.dawnCompleteCount || 0 };
    const enhNewTitles = Object.values(TITLE_DB).filter(t => !state.unlockedTitles.includes(t.id) && t.check(enhNewState)).map(t => t.id);
    const logMsg = succeeded
      ? `🔨 [강화 성공] ${item.name} → +${targetLv} 강화 완료!`
      : `💥 [강화 실패] ${item.name} → 강화 단계 ${lv > 3 ? lv - 1 : 0}으로 하락...`;
    set({
      inventory: newInventory,
      gold: state.gold - costGp,
      enhancementStones: state.enhancementStones - 1,
      enhanceSuccessCount: newEnhanceSuccessCount,
      unlockedTitles: [...state.unlockedTitles, ...enhNewTitles],
      systemLogs: [logMsg, ...state.systemLogs].slice(0, 30),
      activities: [{ id: Date.now(), text: logMsg, timestamp: Date.now(), type: succeeded ? 'enhance_ok' : 'enhance_fail' }, ...state.activities].slice(0, 20),
    });
    get()._persist();
    return { success: succeeded, newLevel: newLv, newTitles: enhNewTitles };
  },

  equipTitle: (titleId) => {
    const state = get();
    if (titleId && !state.unlockedTitles.includes(titleId)) return;
    set({ userTitle: state.userTitle === titleId ? null : titleId });
    get()._persist();
  },

  completeSuddenMission: () => {
    const state = get();
    const sm = state.suddenMission;
    if (!sm || !sm.isActive) return;
    const rewardGp = sm.rewardGp;
    const rewardXp = sm.rewardXp;
    let { exp, level, statPoints } = state;
    exp += rewardXp;
    let mx = getExpForLevel(level);
    while (exp >= mx) { exp -= mx; level++; statPoints += 3; mx = getExpForLevel(level); }
    const logMsg = `🚨 [돌발 성공!] "${sm.title}" 완료! +${rewardGp} GP, +${rewardXp} XP, 만능 강화석 +1`;
    set({
      gold: state.gold + rewardGp,
      exp, level, statPoints,
      enhancementStones: (state.enhancementStones || 0) + 1,
      suddenMission: null,
      systemLogs: [logMsg, ...state.systemLogs].slice(0, 30),
      activities: [{ id: Date.now(), text: logMsg, timestamp: Date.now(), type: 'sudden_ok' }, ...state.activities].slice(0, 20),
    });
    get()._persist();
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: ['#ef4444', '#fbbf24', '#22c55e'] });
    return { rewardGp, rewardXp };
  },

  failSuddenMission: () => {
    const state = get();
    const sm = state.suddenMission;
    if (!sm) return;
    const logMsg = `😔 [돌발 실패] "${sm.title}" 시간 초과... 다음엔 꼭 성공하자!`;
    set({
      suddenMission: null,
      systemLogs: [logMsg, ...state.systemLogs].slice(0, 30),
      activities: [{ id: Date.now(), text: logMsg, timestamp: Date.now(), type: 'sudden_fail' }, ...state.activities].slice(0, 20),
    });
    get()._persist();
  },

  triggerSuddenMission: () => {
    const state = get();
    if (state.suddenMission) return;
    const pool = SUDDEN_MISSIONS_POOL;
    const sm = pool[Math.floor(Math.random() * pool.length)];
    set({ suddenMission: { ...sm, isActive: true, startedAt: Date.now() } });
  },

  tickSuddenMission: () => {
    const state = get();
    const sm = state.suddenMission;
    if (!sm || !sm.isActive) return;
    const elapsed = Math.floor((Date.now() - sm.startedAt) / 1000);
    const timeLeft = Math.max(0, sm.timeLimit - elapsed);
    if (timeLeft === 0) {
      get().failSuddenMission();
    } else {
      set({ suddenMission: { ...sm, timeLeft } });
    }
  },

  buyPetEgg: (petId) => {
    const state = get();
    const pet = PET_DB[petId];
    if (!pet) return false;
    if (state.gold < pet.cost) return false;
    if (state.ownedPets.includes(petId)) return false;
    const logMsg = `🥚 [펫 획득] ${pet.emoji} ${pet.name} 부화! ${pet.effectText}`;
    set({
      gold: state.gold - pet.cost,
      ownedPets: [...state.ownedPets, petId],
      activePet: state.activePet || petId,
      systemLogs: [logMsg, ...state.systemLogs].slice(0, 30),
      activities: [{ id: Date.now(), text: logMsg, timestamp: Date.now(), type: 'pet' }, ...state.activities].slice(0, 20),
    });
    get()._persist();
    return true;
  },

  equipPet: (petId) => {
    const state = get();
    if (!state.ownedPets.includes(petId)) return;
    set({ activePet: state.activePet === petId ? null : petId });
    get()._persist();
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AVATAR_STORAGE_KEY);
    set({
      characterName: '영웅', characterClass: '수련생', jobClass: '초보 모험가',
      level: 1, exp: 0, gold: 0, streak: 0, lastActiveDay: null,
      stats: { STR: 1, AGI: 1, VIT: 1, INT: 1, WIS: 1, CHA: 1 },
      statPoints: 0,
      quests: DEFAULT_QUESTS.map(q => ({ ...q, completed: false, completedAt: undefined })),
      activities: [], completedToday: 0, totalCompleted: 0,
      currentMonsterIndex: 0, monsterHp: MONSTERS_DB[0].baseHp,
      monsterKillCount: 0, inventory: [], lootDrop: null,
      equippedItems: { HAT: null, WEAPON: null, ARMOR: null },
      combo: 0, isFever: false, systemLogs: [], lastDailyResetKey: null,
      ghostAttackEvent: null, gachaResult: null,
      userTitle: null, unlockedTitles: [], enhancementStones: 0,
      activePet: null, ownedPets: [],
      ghostAttackCount: 0, enhanceSuccessCount: 0, feverTriggerCount: 0, dawnCompleteCount: 0,
      suddenMission: null,
    });
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

// ==========================================
// STYLE: floating-pet keyframe (injected once)
// ==========================================
if (typeof document !== 'undefined' && !document.getElementById('hf-pet-style')) {
  const s = document.createElement('style');
  s.id = 'hf-pet-style';
  s.textContent = `
    @keyframes pet-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    .pet-float { animation: pet-float 2.4s ease-in-out infinite; }
    @keyframes title-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
    .title-float { animation: title-float 3s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// --- Sudden Mission Banner ---
const SuddenMissionBanner = ({ mission, onComplete, onFail }) => {
  const elapsed = Math.floor((Date.now() - mission.startedAt) / 1000);
  const [timeLeft, setTimeLeft] = useState(Math.max(0, mission.timeLimit - elapsed));

  useEffect(() => {
    if (timeLeft <= 0) { onFail(); return; }
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); onFail(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const pct = Math.max(0, (timeLeft / mission.timeLimit) * 100);
  const urgent = timeLeft < 60;

  return (
    <motion.div
      initial={{ y: -120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 200 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-lg"
    >
      <motion.div
        animate={urgent ? { boxShadow: ['0 0 20px #ef4444', '0 0 40px #ef4444', '0 0 20px #ef4444'] } : { boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="rounded-2xl border-2 border-red-500/60 bg-black/90 backdrop-blur-lg p-4"
      >
        <div className="flex items-start gap-3 mb-3">
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="text-2xl flex-shrink-0">🚨</motion.span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-red-300 text-sm leading-tight">{mission.title}</p>
            <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{mission.desc}</p>
          </div>
          <div className={`flex-shrink-0 font-black text-xl tabular-nums ${urgent ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
            {mins}:{secs}
          </div>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-3 border border-white/5">
          <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${urgent ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-red-500'}`} />
        </div>
        <div className="flex gap-2">
          <p className="flex-1 text-xs text-amber-300/60 self-center">보상: +{mission.rewardGp} GP, +{mission.rewardXp} XP, 강화석 ×1</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onComplete}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-black font-black text-sm shadow-lg shadow-emerald-500/30">
            ✅ 완료!
          </motion.button>
          <button onClick={onFail} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/30 text-xs font-bold hover:text-red-400 transition-all">포기</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Pet Display (floating near avatar) ---
const PetDisplay = ({ petId }) => {
  const pet = PET_DB[petId];
  if (!pet) return null;
  return (
    <div className="absolute -top-3 -right-5 z-10 pointer-events-none select-none pet-float" title={`${pet.name}: ${pet.effectText}`}>
      <div className="relative">
        <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' }}>{pet.emoji}</span>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-black/20 rounded-full blur-sm" />
      </div>
    </div>
  );
};

// --- Title Selector Modal ---
const TitleSelectorModal = ({ isOpen, onClose }) => {
  const { unlockedTitles, userTitle, equipTitle } = useGameStore();
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
        className="relative glass rounded-3xl p-7 w-full max-w-md border border-purple-500/25 shadow-2xl shadow-purple-500/10"
      >
        <h2 className="text-xl font-black text-white mb-1 flex items-center gap-2">🏷️ 칭호 관리</h2>
        <p className="text-white/35 text-xs mb-5">해금된 칭호를 선택하면 캐릭터 이름 위에 표시됩니다</p>

        {/* Unlocked titles */}
        {unlockedTitles.length === 0 ? (
          <div className="py-8 text-center text-white/25">
            <div className="text-4xl mb-2">🔒</div>
            <p className="text-sm">아직 해금된 칭호가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {unlockedTitles.map(id => {
              const t = TITLE_DB[id];
              if (!t) return null;
              const isActive = userTitle === id;
              return (
                <motion.button key={id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { equipTitle(id); onClose(); }}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all ${isActive ? 'border-amber-500/50 bg-amber-500/10' : 'border-purple-500/25 bg-purple-500/8 hover:border-purple-400/40'}`}
                >
                  <div className={`font-black text-base bg-gradient-to-r ${t.gradient} bg-clip-text text-transparent title-float`}>[{t.name}]</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/50">{t.effectText}</div>
                    <div className="text-[10px] text-white/25">{t.condition}</div>
                  </div>
                  {isActive && <span className="text-amber-400 font-black text-xs">장착 중 ✓</span>}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Lock info */}
        {Object.values(TITLE_DB).filter(t => !unlockedTitles.includes(t.id)).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-2">미해금 칭호</p>
            {Object.values(TITLE_DB).filter(t => !unlockedTitles.includes(t.id)).map(t => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/25">
                <span>🔒</span>
                <span className="font-bold">[{t.name}]</span>
                <span className="flex-1 text-right">{t.condition}</span>
              </div>
            ))}
          </div>
        )}

        {userTitle && (
          <button onClick={() => { equipTitle(null); onClose(); }} className="w-full mt-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm font-bold hover:bg-white/8 transition-all">칭호 해제</button>
        )}
        <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/30 text-sm font-semibold hover:bg-white/8 transition-all">닫기</button>
      </motion.div>
    </motion.div>
  );
};

// --- Enhancement Modal ---
const EnhancementModal = ({ isOpen, onClose }) => {
  const { inventory, gold, enhancementStones, enhanceItem } = useGameStore();
  const [selectedId, setSelectedId] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | forging | result
  const [result, setResult] = useState(null);

  const equipment = inventory.filter(i => i.type === 'equipment');
  const selected = equipment.find(i => i.instanceId === selectedId);
  const selLv = selected ? (selected.enhanceLevel || 0) : 0;
  const targetLv = selLv + 1;
  const costGp = selected ? ENHANCE_COST_GP[Math.min(selLv, ENHANCE_COST_GP.length - 1)] : 0;
  const successRate = selected ? Math.round(ENHANCE_RATES[Math.min(selLv, ENHANCE_RATES.length - 1)] * 100) : 0;
  const canEnhance = selected && enhancementStones >= 1 && gold >= costGp && phase === 'idle';

  const handleEnhance = () => {
    if (!canEnhance) return;
    setPhase('forging');
    setTimeout(() => {
      const res = enhanceItem(selectedId);
      setResult(res);
      setPhase('result');
    }, 1800);
  };

  const reset = () => { setPhase('idle'); setResult(null); };

  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={phase === 'idle' ? onClose : undefined} />
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 30 }}
        className="relative glass rounded-3xl p-7 w-full max-w-md border border-amber-500/25 shadow-2xl shadow-amber-500/10 overflow-hidden"
      >
        {/* Forge flash animation */}
        <AnimatePresence>
          {phase === 'forging' && (
            <motion.div className="absolute inset-0 z-10 pointer-events-none"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0, 0.5, 0, 0.8, 0] }} transition={{ duration: 1.6 }}
              style={{ background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.6), rgba(239,68,68,0.3), transparent 70%)' }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">🔨</span>
          <h2 className="text-xl font-black text-white">장비 강화</h2>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-white/40">💎 강화석 {enhancementStones}개</span>
            <span className="text-xs text-white/40">🪙 {gold.toLocaleString()} GP</span>
          </div>
        </div>

        {/* Item selector */}
        <div className="mb-4">
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">강화할 장비 선택</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {equipment.length === 0 && <p className="text-xs text-white/25 py-4 text-center">인벤토리에 장비가 없습니다</p>}
            {equipment.map(item => {
              const lv = item.enhanceLevel || 0;
              const r = RARITY_CONFIG[item.rarity];
              const isSel = item.instanceId === selectedId;
              return (
                <button key={item.instanceId} onClick={() => { setSelectedId(item.instanceId); reset(); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${isSel ? 'border-amber-500/50 bg-amber-500/10' : `${r.border} bg-white/[0.02] hover:bg-white/5`}`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className={`text-[10px] px-1 rounded font-black ${r.color} ${r.bg} border ${r.border}`}>{r.label}</span>
                  <span className="text-sm font-bold text-white/85">{lv > 0 ? `+${lv} ` : ''}{item.name}</span>
                  <span className="ml-auto text-xs text-white/30">Lv.{lv}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Enhancement info */}
        {selected && phase === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-white/50">현재 강화 단계</span>
              <span className="font-bold text-white">+{selLv} → <span className="text-amber-300">+{targetLv}</span></span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">성공 확률</span>
              <span className={`font-bold ${successRate >= 70 ? 'text-emerald-300' : successRate >= 40 ? 'text-amber-300' : 'text-red-400'}`}>{successRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">비용</span>
              <span className="font-bold text-white">💎 강화석 ×1 &amp; 🪙 {costGp} GP</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/30">실패 시</span>
              <span className="text-red-400/70">{selLv > 3 ? `+${selLv}에서 +${selLv - 1}로 하락` : '+0으로 초기화'}</span>
            </div>
          </motion.div>
        )}

        {/* Forging animation */}
        {phase === 'forging' && (
          <motion.div className="mb-4 py-8 text-center">
            <motion.div animate={{ rotate: [0, -20, 20, -15, 15, -5, 5, 0], y: [0, -10, 0, -8, 0] }} transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="text-6xl inline-block mb-3">🔨</motion.div>
            <p className="text-amber-300 font-bold animate-pulse">강화 중...</p>
            <div className="flex justify-center gap-1 mt-2">
              {['✨', '💫', '⭐'].map((s, i) => (
                <motion.span key={i} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }} className="text-lg">{s}</motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`mb-4 p-5 rounded-2xl border-2 text-center ${result.success ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10'}`}
          >
            <div className="text-4xl mb-2">{result.success ? '✨' : '💔'}</div>
            <p className={`text-xl font-black mb-1 ${result.success ? 'text-emerald-300' : 'text-red-400'}`}>
              {result.success ? '강화 성공!' : '강화 실패...'}
            </p>
            <p className="text-sm text-white/50">
              {result.success ? `+${result.newLevel} 강화 완료!` : `강화 단계가 +${result.newLevel}(으)로 변경됐습니다`}
            </p>
            {result.newTitles?.length > 0 && (
              <div className="mt-3 p-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
                <p className="text-xs text-amber-300 font-black">🏷️ 새 칭호 해금! [{TITLE_DB[result.newTitles[0]]?.name}]</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="flex gap-2">
          {phase === 'idle' && (
            <>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-semibold hover:bg-white/8 transition-all">닫기</button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleEnhance} disabled={!canEnhance}
                className="flex-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-lg shadow-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                🔨 강화!
              </motion.button>
            </>
          )}
          {phase === 'result' && (
            <>
              <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-semibold hover:bg-white/8 transition-all">닫기</button>
              <button onClick={reset} className="flex-1 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/30 transition-all">다시 강화</button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

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

// --- Avatar (Paper Doll with Class Aura) ---
const AvatarDisplay = ({ avatarSrc, onUpload, level }) => {
  const fileInputRef = useRef(null);
  const { equippedItems, inventory, jobClass, isFever } = useGameStore();

  const getEquippedItem = (slot) => {
    const iid = equippedItems[slot];
    if (!iid) return null;
    return inventory.find(i => i.instanceId === iid) || null;
  };

  const { activePet } = useGameStore(s => ({ activePet: s.activePet }));
  const baseSrc = avatarSrc || './avatar_base.png';
  const aura = CLASS_CONFIG[jobClass]?.aura;

  // Aura gradient string
  const auraGradient = aura
    ? `conic-gradient(from 0deg, ${aura.join(', ')})`
    : null;

  const borderStyle = isFever
    ? '0 0 0 3px #ef4444, 0 0 20px #ef4444, 0 0 40px #f97316'
    : aura
    ? `0 0 0 2px ${aura[0]}, 0 0 16px ${aura[0]}80`
    : undefined;

  return (
    <div className="relative flex-shrink-0">
      {/* Aura ring behind avatar */}
      {aura && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-2xl -m-1 opacity-70"
          style={{ background: auraGradient, filter: 'blur(6px)', zIndex: 0 }}
        />
      )}
      {/* Fever ring */}
      {isFever && (
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.04, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl -m-1 opacity-80"
          style={{ background: 'conic-gradient(from 0deg, #ef4444, #f97316, #fbbf24, #ef4444)', filter: 'blur(5px)', zIndex: 0 }}
        />
      )}

      {/* Pet floating near avatar */}
      {activePet && <PetDisplay petId={activePet} />}

      <div
        className="avatar-glow w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-2 border-purple-500/30 flex items-center justify-center overflow-hidden cursor-pointer group relative"
        style={{ boxShadow: borderStyle, zIndex: 1 }}
        onClick={() => fileInputRef.current?.click()}
      >
        <img src={baseSrc} alt="아바타" className="w-full h-full object-contain" />

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
      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-sm px-3 py-1 rounded-xl shadow-lg shadow-amber-500/40" style={{ zIndex: 2 }}>
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

// --- Combo Overlay ---
const ComboOverlay = ({ combo, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); }, [onDone]);
  const colors = combo >= 10 ? 'text-red-400' : combo >= 5 ? 'text-amber-300' : combo >= 3 ? 'text-purple-300' : 'text-emerald-300';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.3, y: -30 }}
      transition={{ type: 'spring', damping: 12, stiffness: 300 }}
      className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[60] pointer-events-none select-none text-center"
    >
      <div className={`font-black text-5xl md:text-6xl ${colors} drop-shadow-[0_0_20px_currentColor]`}>
        {combo} COMBO!
      </div>
      {combo >= 5 && (
        <div className="text-lg font-bold text-amber-300/80 mt-1">
          {combo >= 10 ? '🔥 UNSTOPPABLE!!' : '⚡ 연속 달성!'}
        </div>
      )}
    </motion.div>
  );
};

// --- Fever Time Banner ---
const FeverTimeBanner = ({ onDismiss }) => {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -60 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[55] pointer-events-none"
    >
      <motion.div
        animate={{ boxShadow: ['0 0 20px #ef4444', '0 0 40px #f97316', '0 0 20px #ef4444'] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="px-8 py-4 rounded-2xl border-2 border-red-500/60 bg-black/80 backdrop-blur-sm text-center"
      >
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-red-400">
          🔥 FEVER TIME! 🔥
        </div>
        <div className="text-sm text-amber-200/70 mt-1">모든 퀘스트 완료! 이후 보상 ×1.5 배율 적용</div>
      </motion.div>
    </motion.div>
  );
};

// --- Class Promote Modal ---
const ClassPromoteModal = ({ isOpen, onClose }) => {
  const { stats, jobClass, promoteClass } = useGameStore();
  const [promoting, setPromoting] = useState(null);

  const availableClasses = Object.entries(CLASS_CONFIG).filter(([cls, cfg]) => cfg.check && cfg.check(stats));

  const handlePromote = (cls) => {
    setPromoting(cls);
    setTimeout(() => {
      promoteClass(cls);
      setPromoting(null);
      onClose();
      confetti({ particleCount: 250, spread: 140, origin: { y: 0.5 }, colors: ['#fbbf24', '#a855f7', '#3b82f6', '#ef4444', '#22c55e'] });
    }, 1200);
  };

  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.8, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 40 }}
        className="relative glass rounded-3xl p-8 w-full max-w-md border border-amber-500/30 shadow-2xl shadow-amber-500/10 text-center overflow-hidden"
      >
        {/* Flash animation when promoting */}
        <AnimatePresence>
          {promoting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1, 0] }}
              transition={{ duration: 1.0 }}
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at center, ${CLASS_CONFIG[promoting]?.aura?.[0]}60, transparent 70%)` }}
            />
          )}
        </AnimatePresence>

        <h2 className="text-2xl font-black text-white mb-2">⚡ 전직 가능!</h2>
        <p className="text-white/40 text-sm mb-6">조건을 달성한 클래스로 전직할 수 있습니다</p>

        {availableClasses.length === 0 ? (
          <div className="py-8 text-white/30">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-sm">아직 전직 조건을 달성하지 못했습니다</p>
            <div className="mt-4 space-y-2 text-xs">
              {Object.entries(CLASS_CONFIG).filter(([k]) => k !== '초보 모험가').map(([cls, cfg]) => (
                <div key={cls} className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/5">
                  <span>{cfg.icon} {cls}</span>
                  <span className="text-white/30">{cfg.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {availableClasses.map(([cls, cfg]) => {
              const isCurrentClass = jobClass === cls;
              return (
                <motion.button
                  key={cls}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isCurrentClass || !!promoting}
                  onClick={() => handlePromote(cls)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isCurrentClass
                      ? 'border-amber-500/40 bg-amber-500/10 opacity-60 cursor-not-allowed'
                      : 'border-purple-500/30 bg-purple-500/10 hover:border-purple-400/50 hover:bg-purple-500/15'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{cfg.icon}</div>
                    <div>
                      <div className="font-black text-white text-lg">{cfg.title}</div>
                      <div className="text-sm text-white/40">{cfg.desc}</div>
                      {isCurrentClass && <div className="text-xs text-amber-400 mt-1">현재 직업</div>}
                    </div>
                    {!isCurrentClass && <div className="ml-auto text-purple-300 text-sm font-bold">전직 →</div>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 font-semibold hover:bg-white/8 transition-all">닫기</button>
      </motion.div>
    </motion.div>
  );
};

// --- Gacha Modal ---
const GachaModal = ({ result, onClose }) => {
  const [phase, setPhase] = useState('shake'); // shake → reveal
  useEffect(() => {
    const t = setTimeout(() => setPhase('reveal'), 1400);
    return () => clearTimeout(t);
  }, []);

  const { item, boxType } = result;
  const rarity = RARITY_CONFIG[item.rarity];
  const isLegendary = item.rarity === 'LEGENDARY';
  const isEpic = item.rarity === 'EPIC';

  useEffect(() => {
    if (phase === 'reveal') {
      const colors = isLegendary ? ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff']
        : isEpic ? ['#a855f7', '#8b5cf6', '#ec4899'] : ['#3b82f6', '#6366f1'];
      confetti({ particleCount: isLegendary ? 200 : isEpic ? 130 : 60, spread: 80, origin: { y: 0.6 }, colors });
    }
  }, [phase]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={phase === 'reveal' ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-sm text-center">

        {phase === 'shake' && (
          <motion.div
            animate={{ x: [-12, 12, -8, 8, -5, 5, -2, 2, 0], rotate: [-6, 6, -4, 4, -2, 2, 0] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="text-9xl mx-auto select-none"
            style={{ filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.8))' }}
          >
            {boxType === 'SILVER' ? '🪙' : '🏆'}
          </motion.div>
        )}

        {phase === 'reveal' && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          >
            <div className="text-8xl mb-4 select-none" style={{ filter: isLegendary ? 'drop-shadow(0 0 30px rgba(245,158,11,0.9))' : isEpic ? 'drop-shadow(0 0 20px rgba(168,85,247,0.8))' : 'drop-shadow(0 0 10px rgba(59,130,246,0.6))' }}>
              {item.emoji}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-6 rounded-3xl border-2 ${rarity.bg} ${rarity.border} mx-auto`}
              style={{ boxShadow: rarity.shadow }}
            >
              <div className={`text-xs font-black px-3 py-1 rounded-full ${rarity.bg} ${rarity.color} border ${rarity.border} inline-block mb-3`}>
                {rarity.label} {isLegendary ? '✨' : isEpic ? '💫' : ''}
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{item.name}</h3>
              <p className="text-sm text-white/60">{item.desc}</p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-lg shadow-lg shadow-amber-500/40"
            >
              🎉 획득!
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// --- Ghost Attack Modal ---
const GhostAttackModal = ({ event, onClose }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.7, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40 }}
        transition={{ type: 'spring', damping: 16, stiffness: 220 }}
        className="relative glass rounded-3xl p-8 w-full max-w-sm border border-purple-500/30 shadow-2xl shadow-purple-900/30 text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />

        <motion.div
          animate={{ y: [0, -8, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-7xl mb-4"
        >
          👻
        </motion.div>

        <h2 className="text-2xl font-black text-purple-300 mb-2">미루기 망령 침입!</h2>
        <p className="text-white/50 text-sm mb-5">미완료 퀘스트 {event.incompleteCount}개 → 패널티 발동</p>

        <div className="space-y-3 mb-5">
          <div className="flex justify-between items-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <span className="text-sm text-white/60">원래 손실 예정</span>
            <span className="font-bold text-red-400">-{event.rawPenalty} GP</span>
          </div>
          {event.totalDefense > 0 && (
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-sm text-white/60">장비 방어력 감면</span>
              <span className="font-bold text-emerald-400">+{event.totalDefense} 방어</span>
            </div>
          )}
          <div className="flex justify-between items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-sm font-bold text-white/80">실제 손실</span>
            <span className="text-xl font-black text-amber-400">-{event.actualPenalty} GP</span>
          </div>
        </div>

        {event.totalDefense > 0 && (
          <p className="text-xs text-emerald-400/70 mb-5 leading-relaxed">
            🛡️ [{event.defenseItems}]의 방어력 덕분에<br />{event.rawPenalty - event.actualPenalty} GP를 막아냈습니다!
          </p>
        )}

        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-base shadow-lg shadow-purple-600/30">
          ⚔️ 맞서 싸우겠다!
        </motion.button>
      </motion.div>
    </motion.div>
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
      <AnimatePresence>
        {slashVisible && (
          <motion.div
            initial={{ opacity: 0, x: -20, rotate: -30 }}
            animate={{ opacity: [0, 1, 1, 0], x: 80, rotate: 15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute top-1/2 left-6 -translate-y-1/2 text-3xl z-10 pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.8))' }}
          >⚔️</motion.div>
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
  const { characterName, setCharacterName, characterClass, setCharacterClass, resetAll, triggerDailyReset } = useGameStore();
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
                {avatarSrc ? <img src={avatarSrc} alt="아바타" className="w-full h-full object-contain" /> : <span className="text-2xl">⚔️</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition-all">업로드</button>
                {avatarSrc && <button onClick={removeAvatar} className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-sm font-semibold hover:bg-red-500/25 transition-all">삭제</button>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); e.target.value = ''; }} className="hidden" />
            </div>
          </div>
          {/* Daily Reset */}
          <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <p className="text-sm font-semibold text-white/60 mb-2">📅 일일 초기화</p>
            <p className="text-xs text-white/30 mb-3">퀘스트를 초기화합니다. 미완료 퀘스트가 있으면 미루기 망령이 침입합니다!</p>
            <button onClick={() => { triggerDailyReset(); onClose(); }}
              className="w-full py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-bold hover:bg-purple-600/40 transition-all">
              👻 일일 초기화 실행
            </button>
          </div>
          <div className="flex gap-3 pt-2">
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
  const typeIcon  = { level: '🌟', monster: '⚔️', ghost: '👻', promote: '⚡', quest: '✅', enhance_ok: '🔨', enhance_fail: '💔', sudden_ok: '🚨', sudden_fail: '😔', pet: '🐾' };
  const typeBg    = { level: 'bg-amber-500/5 border-amber-500/15', monster: 'bg-rose-500/5 border-rose-500/15', ghost: 'bg-purple-500/5 border-purple-500/15', promote: 'bg-indigo-500/5 border-indigo-500/15', quest: 'bg-white/[0.02] border-white/5', enhance_ok: 'bg-amber-500/5 border-amber-500/15', enhance_fail: 'bg-red-500/5 border-red-500/15', sudden_ok: 'bg-emerald-500/5 border-emerald-500/15', sudden_fail: 'bg-slate-500/5 border-slate-500/15', pet: 'bg-blue-500/5 border-blue-500/15' };
  const typeColor = { level: 'text-amber-300', monster: 'text-rose-300', ghost: 'text-purple-300', promote: 'text-indigo-300', quest: 'text-white/80', enhance_ok: 'text-amber-300', enhance_fail: 'text-red-400', sudden_ok: 'text-emerald-300', sudden_fail: 'text-slate-400', pet: 'text-blue-300' };
  return (
    <div className="space-y-3">
      {activities.slice(0, 10).map((activity, index) => (
        <motion.div key={activity.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${typeBg[activity.type] || typeBg.quest}`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${activity.type === 'level' ? 'bg-amber-500/15' : activity.type === 'ghost' ? 'bg-purple-500/15' : activity.type === 'promote' ? 'bg-indigo-500/15' : 'bg-purple-500/10'}`}>
            {typeIcon[activity.type] || '✅'}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${typeColor[activity.type] || typeColor.quest}`}>{activity.text}</p>
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

// --- System Logs Feed ---
const SystemLogsFeed = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-white/20">
        <span className="text-3xl mb-2">🛡️</span>
        <p className="text-sm">시스템 로그가 없습니다</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-purple-200/70 leading-relaxed">
          {log}
        </div>
      ))}
    </div>
  );
};

// --- Today Summary Card ---
const TodaySummaryCard = ({ completedToday, totalQuests, streak, isFever, combo }) => {
  const progressPercent = totalQuests > 0 ? Math.round((completedToday / totalQuests) * 100) : 0;
  return (
    <div className={`rounded-2xl p-6 md:p-8 border transition-all ${isFever ? 'border-red-500/40 bg-red-900/10' : 'glass border-white/6'}`}
      style={isFever ? { boxShadow: '0 0 30px rgba(239,68,68,0.15)' } : undefined}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white/80">📊 오늘의 현황</h2>
        <div className="flex items-center gap-3">
          {combo > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-amber-300 bg-amber-500/15 px-2 py-1 rounded-lg border border-amber-500/25">⚡ {combo} COMBO</span>
            </div>
          )}
          {isFever && (
            <motion.span animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
              className="text-xs font-black text-red-300 bg-red-500/20 px-2 py-1 rounded-lg border border-red-500/30">
              🔥 FEVER
            </motion.span>
          )}
          <div className="flex items-center gap-1.5"><span className="streak-fire text-lg">🔥</span><span className="text-orange-300 font-bold text-lg">{streak}</span><span className="text-white/30 text-xs">일 연속</span></div>
        </div>
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
      <div className="px-5 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">오늘의 토벌전</span>
          {cycle > 0 && <span className="text-xs font-bold text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/15">강화 +{cycle}</span>}
        </div>
      </div>

      <div className="relative flex flex-col items-center py-5 px-4">
        <AnimatePresence>
          {lastDamage && <DamageNumber key={lastDamage.id} damage={lastDamage.damage} isCrit={lastDamage.isCrit} onDone={onDamageDone} />}
        </AnimatePresence>

        <div className="absolute inset-0 rounded-2xl" style={{ background: monster.tier === 'boss' ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)' : 'radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />

        <motion.div
          animate={isShaking ? { x: [-10, 10, -7, 7, -4, 4, 0], rotate: [-5, 5, -3, 3, 0] } : { x: 0, rotate: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-7xl mb-3 select-none relative z-10"
          style={{ filter: monster.tier === 'boss' ? 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' : 'drop-shadow(0 0 12px rgba(139,92,246,0.4))' }}
        >
          {monster.emoji}
        </motion.div>

        <div className="text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${tier.bg} ${tier.color} ${tier.border} border`}>{tier.label}</span>
            <h3 className="text-base font-bold text-white/90">{monster.name}</h3>
          </div>
          <p className="text-xs text-white/35 mb-3 px-2 leading-relaxed">{monster.desc}</p>
          <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/8">
            <span className="text-white/35">약점</span>
            <span className={`font-bold ${weakness.textClass}`}>{weakness.icon} {weakness.label}</span>
            <span className="text-white/25">→ x1.5 데미지</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className="text-white/40 font-bold">HP</span>
          <span className={`font-bold tabular-nums ${hpPercent < 25 ? 'text-red-400 animate-pulse' : 'text-white/60'}`}>{monsterHp} / {maxHp}</span>
        </div>
        <div className="h-5 bg-black/40 rounded-full overflow-hidden border border-white/6 relative">
          <motion.div
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full relative ${hpPercent > 60 ? 'bg-gradient-to-r from-emerald-700 to-emerald-400' : hpPercent > 25 ? 'bg-gradient-to-r from-amber-700 to-amber-400' : 'bg-gradient-to-r from-red-800 to-red-500'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full" />
          </motion.div>
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-xs text-white/20">{Math.round(hpPercent)}%</span>
        </div>
      </div>

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

      <div className="mx-5 mb-5 p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs text-center text-purple-300/50 leading-relaxed">
        퀘스트를 완료하면 자동으로 데미지가 가해집니다<br />
        <span className={`font-bold ${weakness.textClass}`}>{weakness.icon} {weakness.label}</span> 관련 퀘스트는 <span className="text-yellow-400/70 font-bold">치명타!</span>
      </div>
    </div>
  );
};

// --- Item Card (4-tier rarity) ---
const ItemCard = ({ item, onUse, onEquip, isEquipped, onEnhance }) => {
  const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.COMMON;
  const slotCfg = item.slot ? SLOT_CONFIG[item.slot] : null;
  const isLegendary = item.rarity === 'LEGENDARY';
  const isEpic = item.rarity === 'EPIC';
  const lv = item.enhanceLevel || 0;
  const enhanced = lv > 0 ? getEnhancedStats(item) : item;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isEquipped ? 'border-amber-500/50 bg-amber-500/5' : `${rarity.bg} ${rarity.border}`}`}
      style={{ boxShadow: isEquipped ? undefined : rarity.shadow }}>
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
        <span className="text-2xl" style={{ filter: isLegendary ? 'drop-shadow(0 0 8px rgba(245,158,11,0.8))' : isEpic ? 'drop-shadow(0 0 6px rgba(168,85,247,0.6))' : undefined }}>
          {item.emoji}
        </span>
        {lv > 0 && <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1 rounded border border-amber-500/30">+{lv}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.color} border ${rarity.border}`}>{rarity.label}</span>
          {slotCfg && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/20">{slotCfg.icon} {slotCfg.label}</span>}
          {isEquipped && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">장착 중</span>}
          <span className="text-sm font-bold text-white/90 truncate">{lv > 0 ? `+${lv} ` : ''}{item.name}</span>
        </div>
        <p className="text-xs text-white/40">{item.desc}</p>
        {enhanced.defense > 0 && <p className="text-[10px] text-blue-400/60 mt-0.5">🛡️ 방어력 {enhanced.defense}{lv > 0 ? <span className="text-amber-400/50"> (강화됨)</span> : ''}</p>}
        {enhanced.bonusMultiplier > 1.0 && <p className="text-[10px] text-amber-400/60 mt-0.5">✨ 보상 ×{enhanced.bonusMultiplier}{lv > 0 ? <span className="text-amber-400/40"> (강화됨)</span> : ''}</p>}
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
        {onEnhance && (
          <button onClick={onEnhance} className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all active:scale-95">🔨</button>
        )}
        {onUse && (
          <button onClick={onUse} className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/30 transition-all active:scale-95">사용</button>
        )}
      </div>
    </motion.div>
  );
};

// --- Inventory Panel ---
const InventoryPanel = ({ onOpenEnhance }) => {
  const { inventory, useItem, equipItem, equippedItems, enhancementStones } = useGameStore();
  const equipment   = inventory.filter(i => i.type === 'equipment');
  const consumables = inventory.filter(i => i.type === 'consumable');
  const isEquipped  = (instanceId) => Object.values(equippedItems).includes(instanceId);

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-white/20">
        <span className="text-5xl mb-3">🎒</span>
        <p className="text-sm font-medium">인벤토리가 비어있습니다</p>
        <p className="text-xs mt-1">몬스터를 처치하거나 가차를 뽑으면 아이템을 획득합니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhancement Stones counter */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-white/30">💎 만능 강화석</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-300">{enhancementStones}개</span>
          {equipment.length > 0 && (
            <button onClick={onOpenEnhance}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 font-bold hover:bg-amber-500/25 transition-all">
              🔨 강화
            </button>
          )}
        </div>
      </div>

      {equipment.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-2">장비 아이템 ({equipment.length})</p>
          <div className="flex gap-2 mb-3">
            {Object.entries(SLOT_CONFIG).map(([slot, cfg]) => {
              const iid = equippedItems[slot];
              const item = iid ? inventory.find(i => i.instanceId === iid) : null;
              const rarity = item ? RARITY_CONFIG[item.rarity] : null;
              const lv = item?.enhanceLevel || 0;
              return (
                <div key={slot} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl border text-center ${item ? `${rarity?.bg} ${rarity?.border}` : 'bg-white/[0.02] border-white/8'}`}
                  style={{ boxShadow: item ? rarity?.shadow : undefined }}>
                  <span className="text-lg leading-none">{item ? item.emoji : cfg.icon}</span>
                  <span className="text-[9px] font-bold text-white/30">{cfg.label}</span>
                  {lv > 0 && <span className="text-[8px] font-black text-amber-300">+{lv}</span>}
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {equipment.map(item => (
              <ItemCard key={item.instanceId} item={item} isEquipped={isEquipped(item.instanceId)}
                onEquip={() => equipItem(item.instanceId)}
                onEnhance={onOpenEnhance} />
            ))}
          </div>
          <p className="text-[10px] text-white/20 mt-2 text-center">장착한 장비는 퀘스트 완료 시 스탯 보너스와 보상 배율을 줍니다</p>
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

// --- Shop Panel (Gacha + Pets + Enhancement Stones) ---
const ShopPanel = ({ onBuy }) => {
  const { gold, enhancementStones, ownedPets, activePet, buyPetEgg, equipPet } = useGameStore();
  const [shopTab, setShopTab] = useState('gacha');

  const boxes = [
    { type: 'SILVER', cost: 50,  name: '명예로운 은빛 상자', emoji: '🪙', color: 'border-slate-400/40 bg-slate-500/10', btnColor: 'from-slate-500 to-slate-400', rates: 'C 60% / B 30% / A 9% / S 1%' },
    { type: 'GOLD',   cost: 150, name: '전설의 금빛 상자',   emoji: '🏆', color: 'border-amber-500/50 bg-amber-500/10', btnColor: 'from-amber-500 to-yellow-400', rates: 'C 20% / B 40% / A 30% / S 10%', highlight: true },
  ];

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🏪</span>
        <h3 className="text-base font-bold text-white/80">상점</h3>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-white/40 text-xs">💎 강화석 {enhancementStones}</span>
          <span className="text-amber-300 font-bold">🪙 {gold.toLocaleString()} GP</span>
        </div>
      </div>

      {/* Shop tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5">
        {[{k:'gacha',label:'🎲 가차'},{k:'pet',label:'🐾 펫'},{k:'stone',label:'💎 강화석'}].map(t => (
          <button key={t.k} onClick={() => setShopTab(t.k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${shopTab === t.k ? 'bg-purple-500/25 text-purple-300 border border-purple-500/30' : 'text-white/30 hover:text-white/60'}`}>{t.label}</button>
        ))}
      </div>

      {/* Gacha */}
      {shopTab === 'gacha' && (
        <>
          <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            {Object.entries(RARITY_CONFIG).map(([key, r]) => (
              <div key={key} className="text-center">
                <div className={`text-[10px] font-black px-1.5 py-1 rounded-lg ${r.bg} ${r.color} border ${r.border}`}>{r.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {boxes.map((box) => (
              <motion.div key={box.type} whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-2xl border-2 ${box.color} ${box.highlight ? 'relative overflow-hidden' : ''}`}
                style={{ boxShadow: box.highlight ? '0 0 20px rgba(245,158,11,0.15)' : undefined }}
              >
                {box.highlight && <div className="absolute top-2 right-2 text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">BEST</div>}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{box.emoji}</span>
                  <div><div className="font-bold text-white/90 text-sm">{box.name}</div><div className="text-xs text-white/40 mt-0.5">{box.rates}</div></div>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} disabled={gold < box.cost} onClick={() => onBuy(box.type)}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all bg-gradient-to-r ${box.btnColor} text-black shadow-lg disabled:opacity-30 disabled:cursor-not-allowed`}>
                  🎲 뽑기 — {box.cost} GP
                </motion.button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Pet Shop */}
      {shopTab === 'pet' && (
        <div className="space-y-3">
          <p className="text-xs text-white/30 leading-relaxed">신비한 펫 알을 부화시켜 동반자를 얻으세요! 펫은 퀘스트 보상에 보너스를 줍니다.</p>
          {Object.values(PET_DB).map(pet => {
            const owned = ownedPets.includes(pet.id);
            const isActive = activePet === pet.id;
            return (
              <motion.div key={pet.id} whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-2xl border-2 transition-all ${isActive ? 'border-emerald-500/50 bg-emerald-500/8' : owned ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl pet-float">{pet.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-white/90 text-sm">{pet.name}</div>
                    <div className="text-xs text-white/40">{pet.effectText}</div>
                  </div>
                  {isActive && <span className="text-xs font-black text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/25">동행 중</span>}
                </div>
                {owned ? (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => equipPet(pet.id)}
                    className={`w-full py-2.5 rounded-xl font-black text-sm transition-all ${isActive ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-blue-500/20 border border-blue-500/30 text-blue-300'}`}>
                    {isActive ? '🐾 동행 해제' : '🐾 동행 설정'}
                  </motion.button>
                ) : (
                  <motion.button whileTap={{ scale: 0.95 }} disabled={gold < pet.cost}
                    onClick={() => { const ok = buyPetEgg(pet.id); if (!ok) alert('GP가 부족합니다!'); }}
                    className="w-full py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25 disabled:opacity-30 disabled:cursor-not-allowed">
                    🥚 부화 — {pet.cost} GP
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Enhancement Stones */}
      {shopTab === 'stone' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center">
            <div className="text-5xl mb-2">💎</div>
            <p className="font-black text-white text-lg">만능 강화석</p>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">장비 강화에 필요한 핵심 재료입니다.<br />돌발 퀘스트 성공 시 무료로 획득할 수도 있어요!</p>
            <div className="mt-3 text-lg font-black text-amber-300">보유: {enhancementStones}개</div>
          </div>
          {[{qty:1,cost:80},{qty:3,cost:220},{qty:5,cost:350}].map(({qty,cost}) => (
            <motion.button key={qty} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
              disabled={gold < cost}
              onClick={() => {
                if (gold < cost) { alert('GP가 부족합니다!'); return; }
                useGameStore.getState().set?.({ gold: gold - cost, enhancementStones: enhancementStones + qty });
                // Direct set via store
                useGameStore.setState(s => ({ gold: s.gold - cost, enhancementStones: s.enhancementStones + qty }));
                useGameStore.getState()._persist();
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-amber-500/30 bg-amber-500/8 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/15 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💎</span>
                <div className="text-left">
                  <div className="font-black text-white">강화석 ×{qty}</div>
                  {qty >= 3 && <div className="text-[10px] text-emerald-400">{qty >= 5 ? '🎁 최고가성비!' : '💰 소량 할인'}</div>}
                </div>
              </div>
              <div className="text-amber-300 font-black">🪙 {cost} GP</div>
            </motion.button>
          ))}
          <p className="text-[10px] text-white/20 text-center leading-relaxed">강화 성공으로 '파괴의 손가락' 칭호를 노려보세요!</p>
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
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.1, duration: 0.5 }} className="text-6xl mb-2 relative">{monster.emoji}</motion.div>
        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg ${tier.bg} ${tier.color} ${tier.border} border mb-2`}>{tier.label}</span>
        <h2 className="text-xl font-black text-white mb-1">{monster.name} <span className="text-amber-300">처치!</span></h2>
        <p className="text-sm text-white/40 mb-5">내면의 악습을 물리쳤습니다!</p>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-2 mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <span className="text-3xl">🪙</span>
          <span className="text-3xl font-black text-amber-300">+{loot.gold} GP</span>
        </motion.div>
        {loot.items.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">아이템 드롭!</p>
            <div className="space-y-2">
              {loot.items.map((item, i) => {
                const rarity = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.COMMON;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.12 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left ${rarity.bg} ${rarity.border}`}
                    style={{ boxShadow: rarity.shadow }}>
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${rarity.bg} ${rarity.color} border ${rarity.border}`}>{rarity.label}</span>
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
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-base shadow-lg shadow-amber-500/40 hover:shadow-xl transition-all">
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
    characterName, characterClass, jobClass,
    level, exp, gold, streak,
    stats, statPoints, quests,
    activities, completedToday, totalCompleted,
    currentMonsterIndex, monsterHp, monsterKillCount, inventory, lootDrop, systemLogs,
    isFever, combo, enhancementStones,
    userTitle, unlockedTitles,
    suddenMission,
    completeQuest, addQuest, removeQuest, allocateStat, clearLootDrop,
    buyGachaBox, clearGachaResult, gachaResult,
    ghostAttackEvent, clearGhostAttack,
    triggerSuddenMission, completeSuddenMission, failSuddenMission,
  } = useGameStore();

  const { avatarSrc, uploadAvatar } = useAvatar();
  const [showAddQuest, setShowAddQuest] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showClassPromote, setShowClassPromote] = useState(false);
  const [showEnhancement, setShowEnhancement] = useState(false);
  const [showTitleSelector, setShowTitleSelector] = useState(false);
  const [newTitleNotif, setNewTitleNotif] = useState(null); // { id, name }
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [rightTab, setRightTab] = useState('battle');
  const [lastDamage, setLastDamage] = useState(null);
  const [showCombo, setShowCombo] = useState(null);
  const [showFeverBanner, setShowFeverBanner] = useState(false);

  // Sudden mission: random trigger every ~30s with 5% chance
  useEffect(() => {
    const interval = setInterval(() => {
      if (!useGameStore.getState().suddenMission) {
        if (Math.random() < 0.05) {
          useGameStore.getState().triggerSuddenMission();
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const maxExp = getExpForLevel(level);
  const xpPercentage = Math.min(100, (exp / maxExp) * 100);
  const completedCount = quests.filter(q => q.completed).length;
  const pendingQuests = quests.filter(q => !q.completed);
  const doneQuests = quests.filter(q => q.completed);

  // Check if any class promotion is available
  const canPromote = Object.entries(CLASS_CONFIG).some(([cls, cfg]) => cfg.check && cfg.check(stats) && cls !== jobClass);

  const handleCompleteQuest = (questId) => {
    const result = completeQuest(questId);
    if (!result) return;
    if (result.leveledUp) setLevelUpLevel(result.newLevel);
    if (result.damage) {
      setLastDamage({ id: Date.now(), damage: result.damage, isCrit: result.isCrit });
      setRightTab('battle');
    }
    if (result.combo >= 1) setShowCombo(result.combo);
    if (result.triggerFever) setShowFeverBanner(true);
    if (result.newTitles?.length > 0) {
      const titleId = result.newTitles[0];
      setNewTitleNotif({ id: titleId, name: TITLE_DB[titleId]?.name });
    }
  };

  const handleLootClose = () => {
    clearLootDrop();
    setRightTab('inventory');
  };

  const handleBuyGacha = (boxType) => {
    const ok = buyGachaBox(boxType);
    if (!ok) alert('GP가 부족합니다!');
  };

  const rightTabs = [
    { key: 'battle',    icon: '⚔️', label: '토벌전' },
    { key: 'inventory', icon: '🎒', label: inventory.length > 0 ? `인벤토리 (${inventory.length})` : '인벤토리' },
    { key: 'shop',      icon: '🏪', label: '상점' },
    { key: 'log',       icon: '📜', label: '기록' },
  ];

  const jobCfg = CLASS_CONFIG[jobClass];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-4 md:py-5">
          <div className="flex items-center gap-5">
            <AvatarDisplay avatarSrc={avatarSrc} onUpload={uploadAvatar} level={level} />
            <div className="flex-1 min-w-0">
              {/* Equipped title floating above name */}
              {userTitle && TITLE_DB[userTitle] && (
                <motion.div
                  className={`mb-0.5 text-xs font-black bg-gradient-to-r ${TITLE_DB[userTitle].gradient} bg-clip-text text-transparent title-float cursor-pointer`}
                  onClick={() => setShowTitleSelector(true)}
                  title="칭호 변경"
                >
                  [{TITLE_DB[userTitle].name}]
                </motion.div>
              )}
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className="font-fantasy text-xl md:text-2xl gold-text truncate font-bold">{characterName}</h1>
                <span className="text-purple-300/70 text-xs font-semibold bg-purple-500/15 px-2.5 py-1 rounded-lg whitespace-nowrap border border-purple-500/15">{characterClass}</span>
                {/* Job class badge */}
                {jobClass !== '초보 모험가' && jobCfg && (
                  <motion.span
                    animate={{ boxShadow: [`0 0 8px ${jobCfg.aura?.[0]}60`, `0 0 16px ${jobCfg.aura?.[0]}80`, `0 0 8px ${jobCfg.aura?.[0]}60`] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs font-black px-2.5 py-1 rounded-lg border whitespace-nowrap"
                    style={{ borderColor: `${jobCfg.aura?.[0]}50`, background: `${jobCfg.aura?.[0]}15`, color: jobCfg.aura?.[0] }}
                  >
                    {jobCfg.icon} {jobCfg.title}
                  </motion.span>
                )}
                {/* Promote button */}
                {canPromote && (
                  <button onClick={() => setShowClassPromote(true)}
                    className="text-xs font-black px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 animate-pulse hover:bg-amber-500/25 transition-all">
                    ⚡ 전직 가능!
                  </button>
                )}
                {/* Title selector */}
                <button onClick={() => setShowTitleSelector(true)}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300/70 hover:text-purple-300 hover:bg-purple-500/20 transition-all">
                  🏷️ {unlockedTitles.length > 0 ? `칭호 (${unlockedTitles.length})` : '칭호'}
                </button>
              </div>
              <div className="flex items-center gap-4 mb-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm"><span>🪙</span><span className="text-amber-300 font-bold">{gold.toLocaleString()}</span><span className="text-white/25 text-xs">GP</span></div>
                <div className="w-px h-4 bg-white/8" />
                <div className="flex items-center gap-1.5 text-sm"><span className="streak-fire">🔥</span><span className="text-orange-300 font-bold">{streak}</span><span className="text-white/25 text-xs">일 연속</span></div>
                {combo > 0 && (<>
                  <div className="w-px h-4 bg-white/8" />
                  <div className="flex items-center gap-1.5 text-sm"><span>⚡</span><span className="text-amber-200 font-bold">{combo}</span><span className="text-white/25 text-xs">콤보</span></div>
                </>)}
                {isFever && (<>
                  <div className="w-px h-4 bg-white/8" />
                  <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
                    className="flex items-center gap-1 text-sm text-red-400 font-black">🔥 FEVER</motion.div>
                </>)}
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
              <div className="overflow-y-auto scrollbar-thin px-6 md:px-7 pb-4 space-y-5 flex-1">
                {Object.entries(stats).map(([key, value]) => (
                  <StatBar key={key} statKey={key} value={value} onAllocate={allocateStat} canAllocate={statPoints > 0} />
                ))}
              </div>

              {/* Class progress */}
              <div className="mx-5 mb-5 p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
                <p className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">전직 조건</p>
                {Object.entries(CLASS_CONFIG).filter(([k]) => k !== '초보 모험가').map(([cls, cfg]) => {
                  const met = cfg.check && cfg.check(stats);
                  const isCurrentJob = jobClass === cls;
                  return (
                    <div key={cls} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${isCurrentJob ? 'bg-amber-500/10 border border-amber-500/20' : met ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.02] border border-white/5'}`}>
                      <span>{cfg.icon}</span>
                      <span className={`font-semibold ${isCurrentJob ? 'text-amber-300' : met ? 'text-emerald-300' : 'text-white/30'}`}>{cls}</span>
                      <span className="text-white/20 flex-1">{cfg.desc}</span>
                      {isCurrentJob && <span className="text-amber-400">✓</span>}
                      {met && !isCurrentJob && <span className="text-emerald-400">✓</span>}
                    </div>
                  );
                })}
                {canPromote && (
                  <button onClick={() => setShowClassPromote(true)}
                    className="w-full mt-2 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black hover:bg-amber-500/30 transition-all animate-pulse">
                    ⚡ 전직하기!
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* ===== CENTER COLUMN: Daily Goals ===== */}
          <div className="lg:col-span-5 flex flex-col gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <TodaySummaryCard completedToday={completedCount} totalQuests={quests.length} streak={streak} isFever={isFever} combo={combo} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={`rounded-2xl p-6 md:p-8 border flex flex-col transition-all ${isFever ? 'border-red-500/30 bg-red-900/5' : 'glass border-purple-500/10'}`}
              style={{
                minHeight: 'calc(100vh - 22rem)',
                boxShadow: isFever ? '0 0 40px rgba(239,68,68,0.1)' : undefined,
              }}
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

          {/* ===== RIGHT COLUMN: Battle / Inventory / Shop / Log ===== */}
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
                  {rightTab === 'inventory' && (
                    <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-4 md:p-5">
                      <InventoryPanel onOpenEnhance={() => setShowEnhancement(true)} />
                    </motion.div>
                  )}
                  {rightTab === 'shop' && (
                    <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <ShopPanel onBuy={handleBuyGacha} />
                    </motion.div>
                  )}
                  {rightTab === 'log' && (
                    <motion.div key="log" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-5 md:p-6 space-y-6">
                      <div>
                        <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">활동 기록</h3>
                        <ActivityFeed activities={activities} />
                      </div>
                      {systemLogs.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3">시스템 로그</h3>
                          <SystemLogsFeed logs={systemLogs} />
                        </div>
                      )}
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


      {/* ===== OVERLAYS & MODALS ===== */}

      {/* Sudden Mission Banner */}
      <AnimatePresence>
        {suddenMission && (
          <SuddenMissionBanner
            mission={suddenMission}
            onComplete={() => { completeSuddenMission(); }}
            onFail={() => { failSuddenMission(); }}
          />
        )}
      </AnimatePresence>

      {/* Combo overlay */}
      <AnimatePresence>
        {showCombo && (
          <ComboOverlay key={`combo-${showCombo}-${Date.now()}`} combo={showCombo} onDone={() => setShowCombo(null)} />
        )}
      </AnimatePresence>

      {/* Fever time banner */}
      <AnimatePresence>
        {showFeverBanner && (
          <FeverTimeBanner onDismiss={() => setShowFeverBanner(false)} />
        )}
      </AnimatePresence>

      {/* New title unlock notification */}
      <AnimatePresence>
        {newTitleNotif && (
          <motion.div
            initial={{ opacity: 0, y: 60, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 60, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[65] w-80 pointer-events-none"
          >
            <div className="rounded-2xl border border-amber-500/40 bg-black/85 backdrop-blur-lg p-4 text-center shadow-xl shadow-amber-500/10">
              <div className="text-xl mb-1">🏷️</div>
              <p className="text-amber-300 font-black text-sm">새 칭호 해금!</p>
              <p className={`text-base font-black mt-0.5 bg-gradient-to-r ${TITLE_DB[newTitleNotif.id]?.gradient} bg-clip-text text-transparent`}>
                [{newTitleNotif.name}]
              </p>
              <p className="text-white/40 text-xs mt-1">{TITLE_DB[newTitleNotif.id]?.effectText}</p>
            </div>
            {/* Auto-dismiss */}
            {(() => { setTimeout(() => setNewTitleNotif(null), 4000); return null; })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddQuest && <AddQuestModal isOpen={showAddQuest} onClose={() => setShowAddQuest(false)} onAdd={addQuest} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showClassPromote && <ClassPromoteModal isOpen={showClassPromote} onClose={() => setShowClassPromote(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showEnhancement && <EnhancementModal isOpen={showEnhancement} onClose={() => setShowEnhancement(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showTitleSelector && <TitleSelectorModal isOpen={showTitleSelector} onClose={() => setShowTitleSelector(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {levelUpLevel && <LevelUpOverlay level={levelUpLevel} onDismiss={() => setLevelUpLevel(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {lootDrop && <LootModal loot={lootDrop} onClose={handleLootClose} />}
      </AnimatePresence>
      <AnimatePresence>
        {gachaResult && <GachaModal result={gachaResult} onClose={() => { clearGachaResult(); setRightTab('inventory'); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {ghostAttackEvent && <GhostAttackModal event={ghostAttackEvent} onClose={clearGhostAttack} />}
      </AnimatePresence>
    </div>
  );
};


// ==========================================
// RENDER
// ==========================================
const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
