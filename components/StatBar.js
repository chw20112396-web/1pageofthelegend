import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store.js';

const STAT_INFO = {
  str: { label: 'STR', name: '힘 (STR)', icon: '🗡️', color: 'from-red-600 to-red-500', bg: 'bg-red-950/40', border: 'border-red-500/30', text: 'text-red-400', desc: '러닝, 웨이트 등 피지컬 트레이닝 활동을 관장합니다.' },
  agi: { label: 'AGI', name: '민첩 (AGI)', icon: '🦅', color: 'from-green-600 to-green-500', bg: 'bg-green-950/40', border: 'border-green-500/30', text: 'text-green-400', desc: '알고리즘 해결 속도 향상, 타이트한 집중 코딩을 관장합니다.' },
  vit: { label: 'VIT', name: '체력 (VIT)', icon: '🧡', color: 'from-orange-600 to-orange-500', bg: 'bg-orange-950/40', border: 'border-orange-500/30', text: 'text-orange-400', desc: '코어 운동 및 피지컬 신체 밸런스 유지를 관장합니다.' },
  int: { label: 'INT', name: '지능 (INT)', icon: '📘', color: 'from-blue-600 to-blue-500', bg: 'bg-blue-950/40', border: 'border-blue-500/30', text: 'text-blue-400', desc: '전공 서적 독서, 수학 논리, AI 알고리즘 학습을 관장합니다.' },
  wis: { label: 'WIS', name: '지혜 (WIS)', icon: '🔮', color: 'from-purple-600 to-purple-500', bg: 'bg-purple-950/40', border: 'border-purple-500/30', text: 'text-purple-400', desc: '시스템 아키텍처 설계, 기술 윤리 분석, 회고 작성을 관장합니다.' },
  cha: { label: 'CHA', name: '매력 (CHA)', icon: '👑', color: 'from-yellow-600 to-yellow-500', bg: 'bg-yellow-950/40', border: 'border-yellow-500/30', text: 'text-yellow-400', desc: '개발자 기술 커뮤니티 협업, 기술 세미나 발표를 관장합니다.' }
};

export default function StatBar({ statKey, value }) {
  const info = STAT_INFO[statKey];
  const [showTooltip, setShowTooltip] = useState(false);
  const unallocatedPoints = useGameStore((state) => state.userProfile.stats.unallocatedPoints);
  const allocateStat = useGameStore((state) => state.allocateStat);

  // 스탯의 최대 가이드라인 수치 (100 기준 게이지)
  const maxLimit = 100;
  const percentage = Math.min(100, (value / maxLimit) * 100);

  const handleAllocate = (e) => {
    e.stopPropagation();
    if (unallocatedPoints > 0) {
      allocateStat(statKey);
    }
  };

  return (
    <div 
      className="relative flex flex-col items-center select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip(!showTooltip)}
    >
      {/* 툴팁/상세 모달 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-16 top-0 z-50 w-52 p-4 rounded-xl glass border border-white/10 shadow-2xl text-xs pointer-events-auto"
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <span>{info.icon}</span>
              <span class={info.text}>{info.name}</span>
            </div>
            <p className="text-white/60 leading-relaxed mb-3">{info.desc}</p>
            <div className="flex justify-between items-center bg-black/30 p-2 rounded-lg">
              <span className="text-white/40">현재 수치:</span>
              <span className="font-bold text-white text-sm">{value} / 100</span>
            </div>

            {unallocatedPoints > 0 && (
              <button
                onClick={handleAllocate}
                className="w-full mt-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-center cursor-pointer transition-all active:scale-95 shadow-md shadow-amber-500/20"
              >
                + 스탯 포인트 1 투자
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 수직 프로그레스 바 외관 */}
      <div className={`relative w-9 h-36 md:h-44 rounded-full ${info.bg} border ${info.border} overflow-hidden shadow-inner flex flex-col justify-end cursor-pointer group`}>
        {/* 채워지는 게이지 바 */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          className={`w-full rounded-full bg-gradient-to-t ${info.color} relative shadow-[0_0_12px_rgba(255,255,255,0.2)]`}
        >
          {/* 눈금 또는 빛 반사 라인 */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/40 filter blur-[0.5px]"></div>
        </motion.div>

        {/* 바 내부 오버레이 수치 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-between py-3 pointer-events-none">
          <span className="text-[10px] text-white/30 font-bold group-hover:text-white/60 transition-colors uppercase tracking-widest">{info.label}</span>
          <span className="text-xs font-black text-white/80 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{value}</span>
        </div>
      </div>

      {/* 하단 아이콘 표식 */}
      <div className={`mt-2 w-7 h-7 rounded-full bg-black/40 border ${info.border} flex items-center justify-center text-sm shadow`}>
        {info.icon}
      </div>
    </div>
  );
}
