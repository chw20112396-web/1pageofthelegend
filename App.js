import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, shopItems } from './store.js';
import StatBar from './components/StatBar.js';
import CharacterDisplay from './components/CharacterDisplay.js';
import QuestItem from './components/QuestItem.js';
import RecentActivity from './components/RecentActivity.js';

export default function App() {
  const { userProfile, quests, inventory, securityAlert, resetSecurityAlert, resetAllData, logActivity, buyItem, useConsumable, equipItem } = useGameStore();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // 활동 추가 모달 상태
  const [activityName, setActivityName] = useState('');
  const [category, setCategory] = useState('STR');
  const [duration, setDuration] = useState(30);

  // 스탯 키 리스트
  const statKeys = ['str', 'agi', 'vit', 'int', 'wis', 'cha'];

  // 신규 활동 등록 핸들러
  const handleAddActivity = (e) => {
    e.preventDefault();
    if (!activityName.trim()) return;

    logActivity(activityName, category, duration);
    setActivityName('');
    setShowAddActivity(false);
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans pb-16">
      
      {/* 1. 상단 레벨 & 크고 아름다운 대형 XP 바 */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 pt-6 md:pt-8">
        <div className="glass rounded-2xl p-4 md:p-5 border border-purple-500/20 shadow-lg shadow-purple-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* 레벨 및 프로필 헤더 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-950 to-indigo-950 border border-purple-500/30 flex items-center justify-center text-2xl relative shadow-md">
                <span>🛡️</span>
                <span className="absolute -bottom-1.5 -right-1.5 bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                  L.{userProfile.level}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-fantasy text-lg md:text-xl text-yellow-100 font-black tracking-wide gold-text">
                    {userProfile.name}
                  </h1>
                  <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    Shadow Warrior
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                  <span className="flex items-center gap-1">🪙 <strong className="text-yellow-400 font-semibold">{userProfile.gold}</strong> GP</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">🔥 <strong className="text-orange-400 font-semibold">{userProfile.streakDays}</strong> 일 연속 모험</span>
                </div>
              </div>
            </div>

            {/* 대형 XP 게이지 바 */}
            <div className="flex-1 md:max-w-xl">
              <div className="flex justify-between items-center text-xs mb-1.5 text-white/50">
                <span className="font-bold text-purple-300">누적 성장 경험치 (EXP)</span>
                <span className="font-mono">{userProfile.currentXp} / {userProfile.nextLevelXp} XP ({Math.round((userProfile.currentXp / userProfile.nextLevelXp) * 100)}%)</span>
              </div>
              <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-white/5 relative p-[1px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(userProfile.currentXp / userProfile.nextLevelXp) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="xp-bar-fill h-full rounded-full"
                ></motion.div>
              </div>
            </div>

            {/* 골드 퀵 버튼 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShop(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/25 hover:to-yellow-500/25 border border-amber-500/20 hover:border-amber-500/40 text-amber-300 transition-all cursor-pointer shadow active:scale-95"
              >
                🛒 모험가 상점
              </button>
              <button
                onClick={() => setShowInventory(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/25 hover:to-indigo-500/25 border border-purple-500/20 hover:border-purple-500/40 text-purple-300 transition-all cursor-pointer shadow active:scale-95"
              >
                🎒 내 가방
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. 중앙 3단 RPG 레이아웃 및 4. 하단 퀘스트 패널 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* [왼쪽 컬럼 - 6대 스탯 수직 바 패널] (lg:col-span-3) */}
        <section className="lg:col-span-3 glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-xs text-white/50 font-bold uppercase tracking-wider mb-1">HERO STATS</h3>
            <p className="text-[10px] text-white/30">스탯 바를 터치하여 포인트를 수동 분배하세요.</p>
          </div>
          
          <div className="flex justify-between items-center gap-2 py-4">
            {statKeys.map((key) => (
              <StatBar key={key} statKey={key} value={userProfile.stats[key]} />
            ))}
          </div>

          <div className="mt-2 pt-4 border-t border-white/5 text-center">
            {userProfile.stats.unallocatedPoints > 0 ? (
              <span className="inline-block text-[11px] text-amber-300 font-extrabold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full animate-bounce">
                ✨ 분배 가능 능력치: {userProfile.stats.unallocatedPoints}pt
              </span>
            ) : (
              <span className="text-[10px] text-white/25">
                모든 가용 포인트 분배 완료
              </span>
            )}
          </div>
        </section>

        {/* [중앙 컬럼 - 등신대 일러스트 패널] (lg:col-span-5) */}
        <section className="lg:col-span-5 glass rounded-2xl border border-white/5 bg-gradient-to-b from-indigo-950/20 to-slate-900/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-radial-at-t from-purple-500/10 via-transparent to-transparent pointer-events-none"></div>
          <CharacterDisplay />
        </section>

        {/* [오른쪽 컬럼 - 최근 활동 피드 카드] (lg:col-span-4) */}
        <section className="lg:col-span-4 glass rounded-2xl p-5 border border-white/5 bg-slate-950/30">
          <RecentActivity />
        </section>

        {/* [하단 가로 컬럼 - Daily Quests 패널] (lg:col-span-12) */}
        <section className="lg:col-span-12 glass rounded-2xl p-5 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs text-white/50 font-bold uppercase tracking-wider">오늘의 퀘스트 (DAILY & EPIC QUESTS)</h3>
              <p className="text-[10px] text-white/30">현실 완료 직후 체크하여 보상을 수령하세요.</p>
            </div>
            <span className="text-xs text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              완료 보상 스트릭 멀티플라이어: x{useGameStore.getState().userProfile ? getStreakMultiplier(userProfile.streakDays).toFixed(2) : '1.00'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quests.map((quest) => (
              <QuestItem key={quest.id} quest={quest} />
            ))}
          </div>
        </section>

      </main>

      {/* ======================================= */}
      <!-- 3. 플로팅 활동 기록 작성 모달 (FAB 클릭) -->
      {/* ======================================= */}
      <button
        onClick={() => setShowAddActivity(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30 flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer transition-all border border-purple-400/30 text-white font-black text-2xl"
        title="새로운 특별 활동 기록 완료"
      >
        ＋
      </button>

      {/* 활동 추가 모달 오버레이 */}
      <AnimatePresence>
        {showAddActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddActivity(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>

            {/* 모달 윈도우 */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-2xl p-6 border border-purple-500/30 shadow-2xl z-10"
            >
              <h3 className="font-fantasy text-lg text-yellow-100 gold-text font-black mb-4">⚔️ 새로운 훈련 및 활동 기록</h3>
              
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1">수행한 활동명</label>
                  <input
                    type="text"
                    required
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="예: 알고리즘 문제 해결 학습, 고강도 러닝 5km"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 mb-1">스탯 카테고리</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'STR', label: '🗡️ STR' },
                      { key: 'AGI', label: '🦅 AGI' },
                      { key: 'VIT', label: '🧡 VIT' },
                      { key: 'INT', label: '📘 INT' },
                      { key: 'WIS', label: '🔮 WIS' },
                      { key: 'CHA', label: '👑 CHA' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCategory(item.key)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          category === item.key
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                            : 'bg-black/30 border-white/5 text-white/40 hover:border-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-white/50 mb-1">
                    <span>수행 시간 (소요시간)</span>
                    <span className="text-purple-300 font-mono">{duration} 분</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-white/20 mt-1">
                    <span>10분</span>
                    <span>90분</span>
                    <span>180분</span>
                  </div>
                </div>

                {/* 획득 경험치 실시간 프리뷰 */}
                <div className="bg-purple-950/20 border border-purple-500/10 rounded-xl p-3 text-center">
                  <span className="text-[10px] text-white/40 block font-bold">예상 획득 보상</span>
                  <div className="mt-1 text-sm font-bold text-purple-300">
                    +{Math.round((duration / 30) * 15 * getStreakMultiplier(userProfile.streakDays))} EXP 가산
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddActivity(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white font-semibold text-xs cursor-pointer active:scale-95 transition-all"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                  >
                    일지 쓰기 및 완료
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      <!-- 4. 가상 모험가 상점 오버레이 모달         -->
      {/* ======================================= */}
      <AnimatePresence>
        {showShop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShop(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl glass rounded-2xl p-6 border border-amber-500/30 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <h3 className="font-fantasy text-lg text-yellow-100 gold-text font-black">🛒 모험가 조각 상점</h3>
                <div className="flex items-center gap-1 text-xs">
                  <span>보유 골드:</span>
                  <span className="text-yellow-400 font-black">🪙 {userProfile.gold} GP</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.map((item) => (
                  <div key={item.itemId} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-white/95">{item.name}</h4>
                        <span className="text-[10px] font-mono text-yellow-400 bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/10">
                          🪙 {item.price}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed mt-1.5">{item.description}</p>
                    </div>

                    <button
                      onClick={() => buyItem(item.itemId)}
                      disabled={userProfile.gold < item.price}
                      className={`w-full mt-3 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                        userProfile.gold >= item.price
                          ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/15'
                          : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {userProfile.gold >= item.price ? '구매 완료하기' : '골드가 부족합니다'}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowShop(false)}
                className="w-full mt-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/5"
              >
                상점 나가기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      <!-- 5. 가방(인벤토리) 관리 모달               -->
      {/* ======================================= */}
      <AnimatePresence>
        {showInventory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInventory(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-2xl p-6 border border-purple-500/30 shadow-2xl z-10"
            >
              <h3 className="font-fantasy text-lg text-yellow-100 gold-text font-black mb-4 pb-2 border-b border-white/5">🎒 모험가 가방 (Inventory)</h3>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {inventory.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl opacity-20">🎒</span>
                    <p className="text-xs text-white/30 mt-2">가방이 비어있습니다. 상점을 이용해 보세요.</p>
                  </div>
                ) : (
                  inventory.map((item) => (
                    <div key={item.itemId} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white/90">{item.name}</h4>
                          <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-white/40">x{item.quantity}</span>
                        </div>
                        <p className="text-[10px] text-white/40 mt-1">{item.description}</p>
                      </div>

                      {/* 아이템 종류별 행동 */}
                      <div>
                        {item.type === 'EQUIPMENT' ? (
                          <button
                            onClick={() => equipItem(item.itemId)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              item.isEquipped
                                ? 'bg-yellow-500 text-black shadow-md shadow-yellow-500/10'
                                : 'bg-purple-600 text-white hover:bg-purple-500'
                            }`}
                          >
                            {item.isEquipped ? '장착 해제' : '아이템 장착'}
                          </button>
                        ) : item.type === 'CONSUMABLE' ? (
                          <button
                            onClick={() => useConsumable(item.itemId)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[10px] font-black transition-all cursor-pointer"
                          >
                            즉시 사용
                          </button>
                        ) : (
                          <span className="text-[9px] text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded font-bold">수집형</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => setShowInventory(false)}
                className="w-full mt-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/5"
              >
                가방 닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      <!-- 6. 보안 검사 시간 왜곡 / 무결성 경보 모달 -->
      {/* ======================================= */}
      <AnimatePresence>
        {securityAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md"></div>
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-sm glass border border-red-500/50 rounded-2xl p-6 text-center shadow-2xl z-10"
            >
              <span className="text-4xl block mb-3">🚨</span>
              <h3 className="text-lg font-black text-red-400 mb-2">시간의 균열 감지됨 (어뷰징 감지)</h3>
              <p className="text-xs text-white/60 leading-relaxed mb-6">
                {securityAlert}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    resetAllData();
                    resetSecurityAlert();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-extrabold text-xs cursor-pointer shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  기록 롤백 초기화 및 봉인 해제
                </button>
                <button
                  onClick={resetSecurityAlert}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 text-[10px] font-bold transition-all cursor-pointer"
                >
                  단순 경고 해제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
