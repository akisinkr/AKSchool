'use client'

import { useState, useEffect, useCallback } from 'react'

const MILESTONES = [500, 1500, 3500]
const RARITY_COLORS: Record<string, string> = {
  common: 'bg-gray-100 text-gray-600',
  uncommon: 'bg-emerald-50 text-emerald-600',
  rare: 'bg-violet-50 text-violet-600',
  legendary: 'bg-yellow-50 text-yellow-700',
}

interface Reward {
  id: string
  milestone_pts: number
  description_en: string | null
  description_ko: string | null
  earned_at: string | null
  confirmed_at: string | null
}

interface Message {
  id: string
  message_text: string
  message_language: string
  queued_at: string
  delivered_at: string | null
  parent_profiles: { name: string } | null
}

interface EarnedCharacter {
  earned_at: string
  earned_trigger: string
  characters: {
    id: string
    name: string
    name_ko: string | null
    rarity: string
    description_en: string | null
    illustration_url: string | null
  }
}

export default function RewardsPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [characters, setCharacters] = useState<EarnedCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Message form
  const [msgText, setMsgText] = useState('')
  const [msgLang, setMsgLang] = useState('en')
  const [msgFrom, setMsgFrom] = useState('dad')

  // Reward form
  const [rewardMilestone, setRewardMilestone] = useState(500)
  const [rewardDescEn, setRewardDescEn] = useState('')
  const [rewardDescKo, setRewardDescKo] = useState('')

  const loadData = useCallback(async () => {
    const res = await fetch('/api/admin-rewards')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setStudentId(data.studentId)
    setTotalPoints(data.totalPoints)
    setRewards(data.rewards)
    setMessages(data.messages)
    setCharacters(data.charactersEarned)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleAddReward() {
    if (!studentId) return
    setSaving(true)
    await fetch('/api/admin-rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reward',
        studentId,
        milestonePts: rewardMilestone,
        descriptionEn: rewardDescEn || null,
        descriptionKo: rewardDescKo || null,
      }),
    })
    setRewardDescEn('')
    setRewardDescKo('')
    await loadData()
    setSaving(false)
  }

  async function handleSendMessage() {
    if (!msgText.trim() || !studentId) return
    setSaving(true)
    const parentId = msgFrom === 'dad'
      ? 'b1000000-0000-0000-0000-000000000001'
      : 'b1000000-0000-0000-0000-000000000002'
    await fetch('/api/admin-rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'message',
        studentId,
        fromParentId: parentId,
        messageText: msgText.trim(),
        language: msgLang,
      }),
    })
    setMsgText('')
    await loadData()
    setSaving(false)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading rewards...</div>
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-800">Rewards & Messages</h2>

      {saving && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">Saving...</div>
      )}

      {/* ===== Milestone Tracker ===== */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Milestone Tracker</h3>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-4">Current: <span className="font-bold text-amber-600">{totalPoints} pts</span></p>
          <div className="space-y-3">
            {MILESTONES.map((m) => {
              const reward = rewards.find((r) => r.milestone_pts === m)
              const earned = totalPoints >= m
              return (
                <div key={m} className={`flex items-center justify-between p-3 rounded-lg border ${earned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div>
                    <p className={`text-sm font-medium ${earned ? 'text-amber-700' : 'text-gray-500'}`}>
                      {earned ? '🏆' : '🔒'} {m} pts
                    </p>
                    {reward && (
                      <p className="text-xs text-gray-500 mt-0.5">{reward.description_en || 'No reward set'}</p>
                    )}
                  </div>
                  {earned && !reward?.confirmed_at && (
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">Ready to claim!</span>
                  )}
                  {reward?.confirmed_at && (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Confirmed ✓</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add custom reward */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-400">Set a reward description</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={rewardMilestone}
                onChange={(e) => setRewardMilestone(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                {MILESTONES.map((m) => (
                  <option key={m} value={m}>{m} pts</option>
                ))}
              </select>
              <input
                type="text"
                value={rewardDescEn}
                onChange={(e) => setRewardDescEn(e.target.value)}
                placeholder="English description"
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
              <input
                type="text"
                value={rewardDescKo}
                onChange={(e) => setRewardDescKo(e.target.value)}
                placeholder="Korean description"
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <button
              onClick={handleAddReward}
              disabled={saving}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:bg-gray-300 transition-colors"
            >
              Set Reward
            </button>
          </div>
        </div>
      </div>

      {/* ===== Parent Messages ===== */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Parent Messages</h3>
        <p className="text-xs text-gray-400">Messages are read by Miss Aria at the start of Sharon&apos;s next session.</p>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">From</label>
              <select
                value={msgFrom}
                onChange={(e) => setMsgFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="dad">아빠 (Dad)</option>
                <option value="mom">엄마 (Mom)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Language</label>
              <select
                value={msgLang}
                onChange={(e) => setMsgLang(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="en">English</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </div>
          <textarea
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Write a message for Sharon..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!msgText.trim() || saving}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:bg-gray-300 transition-colors"
          >
            Queue Message
          </button>
        </div>

        {messages.length > 0 ? (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {(msg.parent_profiles as Record<string, string>)?.name || 'Parent'}
                  </span>
                  <span className="text-xs text-gray-300">{new Date(msg.queued_at).toLocaleDateString()}</span>
                  {msg.delivered_at ? (
                    <span className="text-xs text-green-500">Delivered ✓</span>
                  ) : (
                    <span className="text-xs text-amber-500">Queued</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{msg.message_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No messages yet</p>
        )}
      </div>

      {/* ===== Character Collection ===== */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Character Collection</h3>
        <p className="text-xs text-gray-400">{characters.length} characters earned</p>

        {characters.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {characters.map((c, i) => {
              const char = c.characters
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    RARITY_COLORS[char.rarity] || 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="text-2xl">✨</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{char.name}</p>
                  {char.name_ko && <p className="text-xs text-gray-400">{char.name_ko}</p>}
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${RARITY_COLORS[char.rarity] || ''}`}>
                    {char.rarity}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-3xl mb-2">🎨</p>
            <p className="text-sm text-gray-400">No characters earned yet. Every 100 points unlocks a new one!</p>
          </div>
        )}
      </div>
    </div>
  )
}
