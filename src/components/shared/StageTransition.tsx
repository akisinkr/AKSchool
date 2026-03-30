'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface StageTransitionProps {
  children: ReactNode
  stageKey: string
  backgroundColor?: string
}

export function StageTransition({ children, stageKey, backgroundColor = '#FFF8F0' }: StageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stageKey}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen w-full flex flex-col items-center justify-center"
        style={{ backgroundColor }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
