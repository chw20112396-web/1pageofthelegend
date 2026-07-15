import React from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store.js';

const DIFFICULTY_STYLES = {
  EASY: { badge: 'bg-green-500/10 text-green-400 border-green-500/20', text: '쉬움' },
  MEDIUM: { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: '보통' },
  HARD: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', text: '어려움' },
  EPIC: { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', text: 'EPIC' }
};

export default function QuestItem({ quest }) {
  const completeQuest = useGameStore((state) => state.completeQuest);

  const handleComplete = () => {
    if (quest.isCompleted) return;

    // 퀘스트 완료 트랜잭션 실행
    completeQuest(quest.id, (didLevelUp) => {
      // 1. 일반 완료 폭죽
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#fbbf24', '#7c3aed', '#3b82f6', '#10b981']
      });

      // 2. 만약 레벨업을 달성했다면 추가 대형 축하 연출
      if (didLevelUp) {
        setTimeout(() => {
          // 좌측에서 발사
          confetti({
            particleCount: 150,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          // 우측에서 발사
          confetti({
            particleCount: 150,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 300);
      }
    });
  };

  const style = DIFFICULTY_STYLES[quest.difficulty] || DIFFICULTY_STYLES.EASY;

  return (
    <motion.div
      layout
      whileHover={!quest.isCompleted ? { scale: 1.01, translateY: -1 } : {}}
      whileTap={!quest.isCompleted ? { scale: 0.99 } : {}}
      className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
        quest.isCompleted
          ? 'bg-black/20 border-white/5 opacity-40'
          : 'bg-white/[0.02] border-white/5 hover:border-purple-500/30 shadow-md shadow-black/10'
      }`}
    >
      {/* 체크박스 형태의 완료 버튼 */}
      <button
        onClick={handleComplete}
        disabled={quest.isCompleted}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
          quest.isCompleted
            ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-indigo-500 text-white'
            : 'border-purple-500/40 hover:border-purple-400 bg-black/30'
        }`}
      >
        {quest.isCompleted && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xs font-bold"
          >
            ✓
          </motion.span>
        )}
      </button>

      {/* 퀘스트 텍스트 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={`text-sm font-semibold truncate ${
              quest.isCompleted ? 'line-through text-white/40' : 'text-white/80'
            }`}
          >
            {quest.title}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black uppercase ${style.badge}`}>
            {style.text}
          </span>
        </div>

        {/* 보상 정보 */}
        <div className="flex items-center gap-3 text-[10px] font-medium text-white/30">
          <span className="flex items-center gap-0.5">
            <strong className="text-yellow-500/80 font-bold">🪙</strong>
            <span>{quest.reward.gold} GP</span>
          </span>
          <span>·</span>
          <span className="flex items-center gap-0.5">
            <strong className="text-purple-400/80 font-bold">⚡</strong>
            <span>{quest.reward.xp} XP</span>
          </span>
          {quest.reward.itemId && (
            <>
              <span>·</span>
              <span className="text-amber-300 font-bold flex items-center gap-0.5">
                🎁 <span>전리품 보장</span>
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
