/**
 * Web Push notification utilities.
 * Handles browser subscription and permission management.
 * Actual push delivery is handled by Supabase Edge Functions (deployed separately).
 */

export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (!('Notification' in window)) return 'denied'
  return await Notification.requestPermission()
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) return null

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
  })

  return subscription
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    return await subscription.unsubscribe()
  }
  return false
}

export interface NotificationPrefs {
  sessionReminders: boolean
  weeklyReport: boolean
  streakAlert: boolean
  rewardUnlocked: boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  sessionReminders: true,
  weeklyReport: true,
  streakAlert: true,
  rewardUnlocked: true,
}

// Bilingual notification templates
export const NOTIFICATION_TEMPLATES = {
  sessionReminder: {
    en: { title: 'Time to learn!', body: "Sharon, Miss Aria is waiting for you! Let's start today's session." },
    ko: { title: '학습 시간이에요!', body: 'Sharon, Miss Aria가 기다리고 있어요! 오늘 세션을 시작하세요.' },
  },
  streakAlert: {
    en: { title: "Don't lose your streak!", body: "Sharon hasn't completed today's session yet. {streak} day streak at risk!" },
    ko: { title: '연속 기록을 유지하세요!', body: 'Sharon이 아직 오늘 세션을 완료하지 않았어요. {streak}일 연속 기록이 위험해요!' },
  },
  weeklyReport: {
    en: { title: "Sharon's Weekly Report", body: "This week's learning report is ready. {points} points earned!" },
    ko: { title: 'Sharon의 주간 리포트', body: '이번 주 학습 리포트가 준비되었습니다. {points}점 획득!' },
  },
  rewardUnlocked: {
    en: { title: 'Reward Unlocked! 🎉', body: 'Sharon reached {milestone} points! Time to celebrate!' },
    ko: { title: '보상 달성! 🎉', body: 'Sharon이 {milestone}포인트를 달성했어요! 축하해주세요!' },
  },
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
