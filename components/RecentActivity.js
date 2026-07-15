import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store.js';

const CATEGORY_DETAILS = {
  STR: { icon: '🗡️', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  AGI: { icon: '🦅', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  VIT: { icon: '🧡', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  INT: { icon: '📘', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  WIS: { icon: '🔮', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  CHA: { icon: '👑', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
};

export default function RecentActivity() {
  const activities = useGameStore((state) => state.activities);

  // 상대적인 시간 포맷 함수
  const formatRelativeTime = (isoString) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    return new Date(isoString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[11px] text-white/50 font-bold uppercase tracking-wider">전투/모험 일지 (최근 활동)</h3>
        <span className="text-[9px] bg-black/40 px-2 py-0.5 rounded border border-white/5 text-white/40">
          {activities.length} Logs
        </span>
      </div>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[360px] md:max-h-[460px] scrollbar-thin">
        <AnimatePresence initial={false}>
          {activities.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center border border-dashed border-white/5 rounded-xl bg-black/10">
              <span className="text-2xl mb-1.5 opacity-30">📜</span>
              <p className="text-[10px] text-white/30">기록된 모험 일지가 없습니다.<br/>새로운 특별 활동을 추가해 보세요.</p>
            </div>
          ) : (
            activities.map((act) => {
              const details = CATEGORY_DETAILS[act.category] || CATEGORY_DETAILS.STR;
              return (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: 20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  {/* 카테고리 심볼 아이콘 */}
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-base flex-shrink-0 ${details.color}`}>
                    {details.icon}
                  </div>

                  {/* 텍스트 내용 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white/80 truncate">
                      {act.activityName}
                    </h4>
                    <div className="flex items-center gap-2 text-[9px] text-white/30 mt-0.5">
                      <span>{act.durationMinutes}분</span>
                      <span>·</span>
                      <span className="uppercase text-purple-400 font-bold">
                        {act.category} +{act.statsGained.amount}
                      </span>
                    </div>
                  </div>

                  {/* 가산 경험치 및 시간 정보 */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] font-black text-purple-400 block">
                      +{act.xpGained} XP
                    </span>
                    <span className="text-[8px] text-white/20 mt-0.5 block font-medium">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
