import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// XP JRPG 성장 곡선 공식 적용
export const getXpThreshold = (level) => {
  if (level <= 4) {
    return 25 * level;
  }
  return Math.round(0.25 * Math.pow(level, 2) + 10 * level + 139.75);
};

// 연속 기록 Streak 멀티플라이어 계산 공식
export const getStreakMultiplier = (days) => {
  if (days < 3) return 1.0;
  if (days < 7) return 1.1;
  if (days < 14) return 1.25;
  if (days < 30) return 1.4;
  return 1.6;
};

// 초기 퀘스트 더미 데이터 목록
const initialQuests = [
  {
    id: 'q-1',
    type: 'DAILY',
    title: '아침 10분 가벼운 러닝 및 스트레칭',
    difficulty: 'EASY',
    targetCategory: 'STR',
    reward: { xp: 20, gold: 15 },
    isCompleted: false,
    completedAt: null,
    expirationDate: ''
  },
  {
    id: 'q-2',
    type: 'DAILY',
    title: '수학적 명제 논리 및 이산 구조 학습 40분',
    difficulty: 'MEDIUM',
    targetCategory: 'INT',
    reward: { xp: 50, gold: 35 },
    isCompleted: false,
    completedAt: null,
    expirationDate: ''
  },
  {
    id: 'q-3',
    type: 'DAILY',
    title: '알고리즘 복잡도 개선 및 구현 완료',
    difficulty: 'HARD',
    targetCategory: 'AGI',
    reward: { xp: 120, gold: 80 },
    isCompleted: false,
    completedAt: null,
    expirationDate: ''
  },
  {
    id: 'q-4',
    type: 'DAILY',
    title: '기술 윤리 분석 및 아카이브 회고 작성',
    difficulty: 'EASY',
    targetCategory: 'WIS',
    reward: { xp: 20, gold: 15 },
    isCompleted: false,
    completedAt: null,
    expirationDate: ''
  },
  {
    id: 'q-epic-1',
    type: 'EPIC',
    title: '주간 데이터 아키텍처 포트폴리오 구축 및 시스템 아웃라인 완료',
    difficulty: 'EPIC',
    reward: { xp: 500, gold: 300, itemId: 'trophy_cup' },
    isCompleted: false,
    completedAt: null,
    expirationDate: ''
  }
];

// 가상 상점 아이템 마스터
export const shopItems = [
  {
    itemId: 'potion_wis',
    name: '지혜의 비약 (소비형)',
    type: 'CONSUMABLE',
    price: 150,
    description: '사용 시점부터 당일 자정까지 INT 획득 경험치 배율 1.5배 보정',
    effects: { targetStat: 'INT', bonusMultiplier: 1.5 }
  },
  {
    itemId: 'potion_life',
    name: '생명의 묘약 (소비형)',
    type: 'CONSUMABLE',
    price: 300,
    description: '사용 즉시 깨진 연속 Streak 일수를 기적적으로 원상태로 긴급 소생',
    effects: { targetStat: 'VIT', flatBonus: 0 } // 특수 효과
  },
  {
    itemId: 'belt_fit',
    name: '모험가의 피트니스 벨트 (장비형)',
    type: 'EQUIPMENT',
    price: 450,
    description: '장착 시 STR 관련 활동 완수 시 획득 경험치 보너스 +5 가산',
    effects: { targetStat: 'STR', flatBonus: 5 }
  },
  {
    itemId: 'pen_blue',
    name: '기획자의 제도용 블루 펜 (장비형)',
    type: 'EQUIPMENT',
    price: 500,
    description: '장착 시 WIS 및 INT 관련 활동 경험치 5% 복리 증폭',
    effects: { targetStat: 'WIS', bonusMultiplier: 1.05 }
  },
  {
    itemId: 'trophy_cup',
    name: '황금빛 노력의 성배 Trophy (수집형)',
    type: 'COLLECTIBLE',
    price: 1000,
    description: '전용 업적실 내 진열용 희귀 엠블럼 (장착 효과 없음)',
    effects: {}
  }
];

export const useGameStore = create(
  persist(
    (set, get) => ({
      userProfile: {
        name: 'ShadowKnight',
        avatarId: 'warrior',
        level: 1,
        currentXp: 0,
        nextLevelXp: getXpThreshold(1),
        gold: 150,
        streakDays: 3,
        lastActiveDate: new Date().toISOString().split('T')[0],
        stats: {
          str: 15,
          agi: 10,
          vit: 12,
          int: 8,
          wis: 8,
          cha: 10,
          unallocatedPoints: 3
        }
      },
      quests: initialQuests,
      activities: [
        {
          id: 'act-init-1',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          activityName: '알고리즘 문제 해결 트레이닝',
          category: 'INT',
          durationMinutes: 60,
          xpGained: 20,
          statsGained: { stat: 'int', amount: 5 },
          streakBonusApplied: 1.1
        },
        {
          id: 'act-init-2',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          activityName: '피지컬 웨이트 트레이닝 세션',
          category: 'STR',
          durationMinutes: 45,
          xpGained: 15,
          statsGained: { stat: 'str', amount: 10 },
          streakBonusApplied: 1.1
        }
      ],
      inventory: [
        {
          itemId: 'belt_fit',
          name: '모험가의 피트니스 벨트 (장비형)',
          type: 'EQUIPMENT',
          quantity: 1,
          isEquipped: true,
          effects: { targetStat: 'STR', flatBonus: 5 }
        }
      ],
      lastLoggedTime: Date.now(),
      securityAlert: null,

      // [기능 1] 스탯 수동 분배 액션
      allocateStat: (statKey) => {
        set((state) => {
          const profile = state.userProfile;
          if (profile.stats.unallocatedPoints <= 0) return {};
          
          return {
            userProfile: {
              ...profile,
              stats: {
                ...profile.stats,
                [statKey]: (profile.stats[statKey] || 0) + 1,
                unallocatedPoints: profile.stats.unallocatedPoints - 1
              }
            }
          };
        });
      },

      // [기능 2] 퀘스트 달성 완료 처리 액션
      completeQuest: (questId, onSuccess) => {
        // 시간 조작 위변조 체크
        const now = Date.now();
        if (now < get().lastLoggedTime) {
          set({ securityAlert: '시스템 시간 왜곡이 감지되었습니다. 진행 내용이 비활성화됩니다.' });
          return;
        }

        set((state) => {
          const questIndex = state.quests.findIndex((q) => q.id === questId);
          if (questIndex === -1 || state.quests[questIndex].isCompleted) return {};

          const updatedQuests = [...state.quests];
          const quest = { ...updatedQuests[questIndex], isCompleted: true, completedAt: new Date().toISOString() };
          updatedQuests[questIndex] = quest;

          // 보상 정산
          let xpReward = quest.reward.xp;
          let goldReward = quest.reward.gold;

          // 스트릭 보너스 적용
          const streakMultiplier = getStreakMultiplier(state.userProfile.streakDays);
          xpReward = Math.round(xpReward * streakMultiplier);
          goldReward = Math.round(goldReward * streakMultiplier);

          // 경험치 가산 및 레벨업 연산
          let newXp = state.userProfile.currentXp + xpReward;
          let newLevel = state.userProfile.level;
          let nextLevelThreshold = state.userProfile.nextLevelXp;
          let unallocatedPoints = state.userProfile.stats.unallocatedPoints;
          let didLevelUp = false;

          let newStats = { ...state.userProfile.stats };

          // 레벨업 루프
          while (newXp >= nextLevelThreshold) {
            newXp -= nextLevelThreshold;
            newLevel += 1;
            nextLevelThreshold = getXpThreshold(newLevel);
            unallocatedPoints += 1;
            didLevelUp = true;

            // 자동 기본 레벨 보너스 (모든 스탯 증가 공식: S_bonus = floor(L/2), 최대 50포인트 한도)
            const autoBonus = Math.min(50, Math.floor(newLevel / 2));
            Object.keys(newStats).forEach((key) => {
              if (key !== 'unallocatedPoints') {
                newStats[key] += autoBonus;
              }
            });
          }

          // 인벤토리 보상 아이템 드롭 확률 처리
          const updatedInventory = [...state.inventory];
          if (quest.reward.itemId) {
            const existingItem = updatedInventory.find((i) => i.itemId === quest.reward.itemId);
            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              const shopItem = shopItems.find((i) => i.itemId === quest.reward.itemId);
              if (shopItem) {
                updatedInventory.push({
                  ...shopItem,
                  quantity: 1,
                  isEquipped: false
                });
              }
            }
          }

          // 콜백 실행 (Confetti 등)
          if (onSuccess) {
            setTimeout(() => onSuccess(didLevelUp), 50);
          }

          return {
            quests: updatedQuests,
            userProfile: {
              ...state.userProfile,
              level: newLevel,
              currentXp: newXp,
              nextLevelXp: nextLevelThreshold,
              gold: state.userProfile.gold + goldReward,
              stats: {
                ...newStats,
                unallocatedPoints
              }
            },
            inventory: updatedInventory,
            lastLoggedTime: now
          };
        });
      },

      // [기능 3] 신규 활동 기록 수동 등록 액션
      logActivity: (activityName, category, durationMinutes) => {
        // 시간 조작 위변조 체크
        const now = Date.now();
        if (now < get().lastLoggedTime) {
          set({ securityAlert: '비정상 시계열 조작 모드가 감지되어 활동 로그 기능이 정지되었습니다.' });
          return;
        }

        set((state) => {
          // 디폴트 매핑 테이블에 비례한 스탯 및 XP 계산
          // 30분 STR 고강도 러닝 기준: STR +20, VIT +10, XP +15
          // 60분 INT AI 학습 기준: INT +25, WIS +5, XP +20
          let baseStr = 0, baseAgi = 0, baseVit = 0, baseInt = 0, baseWis = 0, baseCha = 0;
          let baseXP = 10;

          const factor = durationMinutes / 30; // 30분 비례 기준
          if (category === 'STR') {
            baseStr = Math.round(20 * factor);
            baseVit = Math.round(10 * factor);
            baseXP = Math.round(15 * factor);
          } else if (category === 'INT') {
            baseInt = Math.round(15 * factor);
            baseWis = Math.round(5 * factor);
            baseXP = Math.round(15 * factor);
          } else if (category === 'AGI') {
            baseAgi = Math.round(20 * factor);
            baseXP = Math.round(15 * factor);
          } else if (category === 'VIT') {
            baseVit = Math.round(20 * factor);
            baseStr = Math.round(5 * factor);
            baseXP = Math.round(15 * factor);
          } else if (category === 'WIS') {
            baseWis = Math.round(20 * factor);
            baseInt = Math.round(5 * factor);
            baseXP = Math.round(10 * factor);
          } else if (category === 'CHA') {
            baseCha = Math.round(20 * factor);
            baseWis = Math.round(5 * factor);
            baseXP = Math.round(20 * factor);
          }

          // 스트릭 배율 적용
          const streakMultiplier = getStreakMultiplier(state.userProfile.streakDays);
          const finalXP = Math.round(baseXP * streakMultiplier);

          // 장착 장비의 버프 효과 적용
          // 예: 피트니스 벨트 장착 시 STR 활동 완료 시 XP +5 가산
          let bonusXpFromItems = 0;
          let bonusMultiplierFromItems = 1.0;

          state.inventory.forEach((item) => {
            if (item.isEquipped && item.effects) {
              if (item.effects.targetStat === category) {
                if (item.effects.flatBonus) bonusXpFromItems += item.effects.flatBonus;
                if (item.effects.bonusMultiplier) bonusMultiplierFromItems *= item.effects.bonusMultiplier;
              }
            }
          });

          const totalXpGained = Math.round((finalXP + bonusXpFromItems) * bonusMultiplierFromItems);

          // 경험치 가산 및 레벨업 연산
          let newXp = state.userProfile.currentXp + totalXpGained;
          let newLevel = state.userProfile.level;
          let nextLevelThreshold = state.userProfile.nextLevelXp;
          let unallocatedPoints = state.userProfile.stats.unallocatedPoints;

          let newStats = { ...state.userProfile.stats };
          newStats.str += baseStr;
          newStats.agi += baseAgi;
          newStats.vit += baseVit;
          newStats.int += baseInt;
          newStats.wis += baseWis;
          newStats.cha += baseCha;

          // 레벨업 루프
          while (newXp >= nextLevelThreshold) {
            newXp -= nextLevelThreshold;
            newLevel += 1;
            nextLevelThreshold = getXpThreshold(newLevel);
            unallocatedPoints += 1;

            const autoBonus = Math.min(50, Math.floor(newLevel / 2));
            Object.keys(newStats).forEach((key) => {
              if (key !== 'unallocatedPoints') {
                newStats[key] += autoBonus;
              }
            });
          }

          // 활동 로그 엔트리 생성
          const newActivity = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            activityName,
            category,
            durationMinutes,
            xpGained: totalXpGained,
            statsGained: {
              stat: category.toLowerCase(),
              amount: baseStr || baseAgi || baseVit || baseInt || baseWis || baseCha
            },
            streakBonusApplied: streakMultiplier
          };

          return {
            activities: [newActivity, ...state.activities].slice(0, 15), // 최대 15개 보관
            userProfile: {
              ...state.userProfile,
              level: newLevel,
              currentXp: newXp,
              nextLevelXp: nextLevelThreshold,
              stats: {
                ...newStats,
                unallocatedPoints
              }
            },
            lastLoggedTime: now
          };
        });
      },

      // [기능 4] 아이템 장착/장착 해제 토글
      equipItem: (itemId) => {
        set((state) => {
          const updatedInventory = state.inventory.map((item) => {
            if (item.itemId === itemId && item.type === 'EQUIPMENT') {
              return { ...item, isEquipped: !item.isEquipped };
            }
            return item;
          });
          return { inventory: updatedInventory };
        });
      },

      // [기능 5] 아이템 골드 구매 상점 액션
      buyItem: (itemId) => {
        const itemToBuy = shopItems.find((i) => i.itemId === itemId);
        if (!itemToBuy) return;

        set((state) => {
          if (state.userProfile.gold < itemToBuy.price) return {};

          const updatedInventory = [...state.inventory];
          const existingItemIndex = updatedInventory.findIndex((i) => i.itemId === itemId);

          if (existingItemIndex !== -1) {
            updatedInventory[existingItemIndex] = {
              ...updatedInventory[existingItemIndex],
              quantity: updatedInventory[existingItemIndex].quantity + 1
            };
          } else {
            updatedInventory.push({
              ...itemToBuy,
              quantity: 1,
              isEquipped: false
            });
          }

          return {
            userProfile: {
              ...state.userProfile,
              gold: state.userProfile.gold - itemToBuy.price
            },
            inventory: updatedInventory
          };
        });
      },

      // [기능 6] 소비성 아이템 사용 액션
      useConsumable: (itemId) => {
        set((state) => {
          const itemIndex = state.inventory.findIndex((i) => i.itemId === itemId && i.type === 'CONSUMABLE');
          if (itemIndex === -1 || state.inventory[itemIndex].quantity <= 0) return {};

          const updatedInventory = [...state.inventory];
          const item = { ...updatedInventory[itemIndex] };
          item.quantity -= 1;

          if (item.quantity === 0) {
            updatedInventory.splice(itemIndex, 1);
          } else {
            updatedInventory[itemIndex] = item;
          }

          // 포션 특수 기능
          let extraProfileUpdate = {};
          if (itemId === 'potion_life') {
            // 깨진 스트릭 소생: 스트릭 강제 +1 증가
            extraProfileUpdate = { streakDays: state.userProfile.streakDays + 1 };
          }

          return {
            inventory: updatedInventory,
            userProfile: {
              ...state.userProfile,
              ...extraProfileUpdate
            }
          };
        });
      },

      // 보안 감지 리셋용
      resetSecurityAlert: () => set({ securityAlert: null }),

      // 데이터 전체 초기화 (수동 세이브 복원 시 유용)
      resetAllData: () => {
        set({
          userProfile: {
            name: 'ShadowKnight',
            avatarId: 'warrior',
            level: 1,
            currentXp: 0,
            nextLevelXp: getXpThreshold(1),
            gold: 150,
            streakDays: 3,
            lastActiveDate: new Date().toISOString().split('T')[0],
            stats: {
              str: 15,
              agi: 10,
              vit: 12,
              int: 8,
              wis: 8,
              cha: 10,
              unallocatedPoints: 3
            }
          },
          quests: initialQuests,
          activities: [],
          inventory: [],
          lastLoggedTime: Date.now(),
          securityAlert: null
        });
      }
    }),
    {
      name: 'rpg-self-improvement-store', // LocalStorage Key
      partialize: (state) => ({
        userProfile: state.userProfile,
        quests: state.quests,
        activities: state.activities,
        inventory: state.inventory,
        lastLoggedTime: state.lastLoggedTime
      })
    }
  )
);
