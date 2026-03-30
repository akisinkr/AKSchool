'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface PointsAnimationProps {
  points: number
  show: boolean
  onComplete?: () => void
}

export function PointsAnimation({ points, show, onComplete }: PointsAnimationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: 1, y: -30, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-amber-400/90 text-white px-6 py-3 rounded-full shadow-lg">
            <motion.span
              className="text-2xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              ✨
            </motion.span>
            <motion.span
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              +{points} pts
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
