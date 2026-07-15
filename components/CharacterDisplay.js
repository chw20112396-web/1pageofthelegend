import React from 'react';
import { motion } from 'https://esm.sh/framer-motion@10.12.16';
import { useGameStore } from '../store.js';

export default function CharacterDisplay() {
  const profile = useGameStore((state) => state.userProfile);
  const inventory = useGameStore((state) => state.inventory);
  const equipItem = useGameStore((state) => state.equipItem);

  const equippedItems = inventory.filter((item) => item.isEquipped);

  return (
    <div className="relative flex flex-col items-center justify-between h-full min-h-[420px] p-4">
      
      {/* 1. 상단 캐릭터 칭호 및 이름 */}
      <div className="text-center z-10">
        <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest bg-amber-950/40 border border-amber-500/20 px-3 py-1 rounded-full">
          Lv. {profile.level} 전설의 모험가
        </span>
        <h2 className="font-fantasy text-2xl md:text-3xl text-yellow-100 gold-text mt-2 font-black filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {profile.name}
        </h2>
      </div>

      {/* 2. 중앙 캐릭터 이미지 & 아우라 */}
      <div className="relative w-full max-w-[280px] flex-1 flex items-center justify-center py-6">
        
        {/* 마법진/오라 애니메이션 효과 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute w-64 h-64 rounded-full border border-dashed border-purple-500/20 bg-gradient-to-tr from-purple-600/5 to-transparent filter blur-sm pointer-events-none"
        ></motion.div>

        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-52 h-52 rounded-full bg-indigo-500/5 filter blur-3xl pointer-events-none"
        ></motion.div>

        {/* 캐릭터 등신대 일러스트 */}
        <motion.img
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          src="./warrior.png"
          alt="Warrior Character"
          className="relative z-10 max-h-[300px] object-contain drop-shadow-[0_15px_20px_rgba(0,0,0,0.7)]"
          onError={(e) => {
            // 이미지 부재 시 대체 그래픽 렌더링
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />

        {/* 이미지 로딩 실패 시 렌더링될 플랫 일러스트 대체용 실루엣 */}
        <div className="hidden absolute z-10 w-full h-[260px] flex-col items-center justify-center bg-gradient-to-b from-indigo-950/80 to-slate-900 border border-indigo-500/20 rounded-2xl p-4 shadow-lg shadow-black/50">
          <span className="text-6xl mb-4">🛡️</span>
          <span className="text-white/40 text-xs">영웅 이미지를 불러올 수 없습니다.</span>
        </div>
      </div>

      {/* 3. 하단 장착 장비 퀵 슬롯 */}
      <div className="w-full z-10 mt-2">
        <h3 className="text-[10px] text-white/40 font-bold uppercase tracking-wider text-center mb-2">장착된 전설의 보물</h3>
        
        <div className="flex justify-center gap-4">
          {[0, 1].map((index) => {
            const item = equippedItems[index];

            return (
              <div key={index} className="relative group">
                {item ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => equipItem(item.itemId)}
                    className="relative w-12 h-12 rounded-xl bg-gradient-to-b from-indigo-950 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 cursor-pointer flex items-center justify-center text-2xl shadow-lg transition-all"
                    title={`${item.name} (클릭 시 장착 해제)`}
                  >
                    {/* 장착 상태 글로우 링 */}
                    <div className="absolute inset-0 rounded-xl border border-yellow-500/30 filter animate-pulse"></div>
                    <span>{item.itemId === 'belt_fit' ? '🥊' : '🖊️'}</span>

                    {/* 툴팁 */}
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-36 p-2 rounded-lg glass border border-white/10 text-[9px] text-white/80 leading-normal pointer-events-none text-center shadow-2xl">
                      <p className="font-bold text-yellow-400">{item.name}</p>
                      <p className="mt-1 text-white/50">{item.description}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-dashed border-white/10 bg-black/20 flex items-center justify-center text-white/10" title="장착 장비 없음">
                    <span className="text-sm">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
