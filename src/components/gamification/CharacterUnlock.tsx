'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface CharacterUnlockProps {
  characterName: string | null
  show: boolean
  onDismiss: () => void
}

const RARITY_GLOWS: Record<string, string> = {
  common: 'shadow-amber-300/50',
  uncommon: 'shadow-emerald-300/50',
  rare: 'shadow-violet-400/60',
  legendary: 'shadow-yellow-400/80',
}

export function CharacterUnlock({ characterName, show, onDismiss }: CharacterUnlockProps) {
  if (!characterName) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: [0, 1.15, 1], rotate: [−15, 5, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl"
          >
            {/* Glow effect */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center mb-6 shadow-lg shadow-amber-300/50"
            >
              {/* Character placeholder */}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-5xl"
              >
                ✨
              </motion.span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm font-medium text-amber-500 uppercase tracking-wider mb-1"
            >
              New Character Unlocked!
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-amber-800 mb-6"
            >
              {characterName}
            </motion.p>

            {/* Sparkle burst */}
            <div className="relative h-8 mb-4">
              {[...Array(8)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg left-1/2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 50 - 10,
                    y: Math.sin((i * Math.PI * 2) / 8) * 30 - 10,
                  }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.05, repeat: 1 }}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onDismiss}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-semibold rounded-full transition-colors"
            >
              Collect! 🎉
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
