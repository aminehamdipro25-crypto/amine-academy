import type { Achievement } from './types'

// مكتبة الإنجازات الكاملة — نظام التلعيب
export const ACHIEVEMENTS_LIBRARY: Omit<Achievement, 'unlockedAt'>[] = [
  // ── البداية ──────────────────────────────────────────────
  {
    id: 'first_login',
    title: 'First Step',
    titleAr: 'الخطوة الأولى',
    description: 'Welcome to your journey!',
    descriptionAr: 'مرحباً بك في رحلتك!',
    icon: '🌟',
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'first_exercise',
    title: 'Exercise Explorer',
    titleAr: 'مستكشف التمارين',
    description: 'Complete your first exercise',
    descriptionAr: 'أكمل تمرينك الأول',
    icon: '🏃',
    points: 100,
    tier: 'bronze',
  },
  // ── الاستمرارية ──────────────────────────────────────────
  {
    id: 'streak_3',
    title: '3-Day Streak',
    titleAr: '3 أيام متتالية',
    description: 'Exercise 3 days in a row',
    descriptionAr: 'تمرين 3 أيام متتالية',
    icon: '🔥',
    points: 150,
    tier: 'bronze',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    titleAr: 'محارب الأسبوع',
    description: '7 days in a row!',
    descriptionAr: '7 أيام متتالية!',
    icon: '⚡',
    points: 300,
    tier: 'silver',
  },
  {
    id: 'streak_30',
    title: 'Monthly Champion',
    titleAr: 'بطل الشهر',
    description: '30 days of dedication!',
    descriptionAr: '30 يوماً من التفاني!',
    icon: '👑',
    points: 1000,
    tier: 'gold',
  },
  // ── الإنجازات الخاصة ─────────────────────────────────────
  {
    id: 'focus_master',
    title: 'Focus Master',
    titleAr: 'سيد التركيز',
    description: 'Complete 10 focus exercises',
    descriptionAr: 'أكمل 10 تمارين تركيز',
    icon: '🎯',
    points: 200,
    tier: 'silver',
  },
  {
    id: 'balance_pro',
    title: 'Balance Pro',
    titleAr: 'محترف التوازن',
    description: 'Master 5 balance exercises',
    descriptionAr: 'أتقن 5 تمارين توازن',
    icon: '🌊',
    points: 200,
    tier: 'silver',
  },
  {
    id: 'energy_release',
    title: 'Energy Release',
    titleAr: 'تفريغ الطاقة',
    description: 'Complete 15 energy exercises',
    descriptionAr: 'أكمل 15 تمرين طاقة',
    icon: '💥',
    points: 250,
    tier: 'silver',
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    titleAr: 'الفراشة الاجتماعية',
    description: 'Complete all social exercises',
    descriptionAr: 'أكمل كل تمارين التفاعل',
    icon: '🦋',
    points: 400,
    tier: 'gold',
  },
  {
    id: 'platinum_star',
    title: 'Platinum Star',
    titleAr: 'النجم البلاتيني',
    description: 'Reach 5000 total points',
    descriptionAr: 'احصل على 5000 نقطة إجمالية',
    icon: '💎',
    points: 500,
    tier: 'platinum',
  },
]

export function checkAchievements(
  totalPoints: number,
  streak: number,
  completedByCategory: Record<string, number>
): string[] {
  const unlocked: string[] = []

  if (streak >= 3)  unlocked.push('streak_3')
  if (streak >= 7)  unlocked.push('streak_7')
  if (streak >= 30) unlocked.push('streak_30')

  if ((completedByCategory.focus ?? 0) >= 10)  unlocked.push('focus_master')
  if ((completedByCategory.balance ?? 0) >= 5) unlocked.push('balance_pro')
  if ((completedByCategory.energy ?? 0) >= 15) unlocked.push('energy_release')
  if (totalPoints >= 5000) unlocked.push('platinum_star')

  return unlocked
}

export function getAchievement(id: string): Omit<Achievement, 'unlockedAt'> | undefined {
  return ACHIEVEMENTS_LIBRARY.find(a => a.id === id)
}
