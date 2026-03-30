'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  common: { bg: 'bg-gray-50', border: 'border-gray-200', glow: '', label: 'bg-gray-100 text-gray-500' },
  uncommon: { bg: 'bg-emerald-50', border: 'border-emerald-200', glow: 'shadow-emerald-100', label: 'bg-emerald-100 text-emerald-600' },
  rare: { bg: 'bg-violet-50', border: 'border-violet-200', glow: 'shadow-violet-100', label: 'bg-violet-100 text-violet-600' },
  legendary: { bg: 'bg-yellow-50', border: 'border-yellow-300', glow: 'shadow-yellow-200 shadow-lg', label: 'bg-yellow-100 text-yellow-700' },
}

interface Character {
  id: string
  name: string
  name_ko: string | null
  rarity: string
  description_en: string | null
  earned: boolean
  earned_at: string | null
}

export default function CollectionPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Character | null>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/collection')
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setCharacters(data.characters)
      setTotalEarned(data.totalEarned)
      setTotalAvailable(data.totalAvailable)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-pink-50 flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-4xl">🎨</motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-pink-50 to-amber-50">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 max-w-lg mx-auto">
        <Link href="/" className="text-sm text-violet-400 hover:text-violet-500">← Back</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">My Collection</h1>
        <p className="text-sm text-gray-500 mt-1">
          {totalEarned} of {totalAvailable} characters
        </p>

        {/* Progress bar */}
        <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden mt-3">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-300 to-pink-300 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${totalAvailable > 0 ? (totalEarned / totalAvailable) * 100 : 0}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="px-5 pb-12 max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {characters.map((char, i) => {
            const style = RARITY_STYLES[char.rarity] || RARITY_STYLES.common
            return (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => char.earned && setSelected(char)}
                className={`relative rounded-2xl border p-3 text-center transition-all ${
                  char.earned
                    ? `${style.bg} ${style.border} ${style.glow} hover:scale-105`
                    : 'bg-gray-100/50 border-gray-200/50 opacity-40'
                }`}
              >
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  char.earned ? style.bg : 'bg-gray-200/50'
                }`}>
                  <span className="text-2xl">{char.earned ? '✨' : '❓'}</span>
                </div>
                <p className={`text-xs font-medium truncate ${char.earned ? 'text-gray-700' : 'text-gray-400'}`}>
                  {char.earned ? char.name : '???'}
                </p>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${style.label}`}>
                  {char.rarity}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6"
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-xl"
          >
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              RARITY_STYLES[selected.rarity]?.bg || 'bg-gray-100'
            } ${RARITY_STYLES[selected.rarity]?.glow || ''}`}>
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{selected.name}</h3>
            {selected.name_ko && <p className="text-sm text-gray-400">{selected.name_ko}</p>}
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
              RARITY_STYLES[selected.rarity]?.label || ''
            }`}>
              {selected.rarity}
            </span>
            {selected.description_en && (
              <p className="text-sm text-gray-600 mt-3">{selected.description_en}</p>
            )}
            {selected.earned_at && (
              <p className="text-xs text-gray-400 mt-2">Earned {new Date(selected.earned_at).toLocaleDateString()}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-4 px-6 py-2 bg-violet-400 hover:bg-violet-500 text-white font-medium rounded-full transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
