'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { WarmFeedback } from '@/components/shared/WarmFeedback'
import { PointsAnimation } from '@/components/shared/PointsAnimation'

interface DragDropProps {
  stem: string
  tiles: string[]
  blanks: string[]
  correctMapping: Record<string, string>
  warmResponseCorrect: string
  warmResponseIncorrect: string
  isAriaPlaying: boolean
  onComplete: (correct: boolean, retried: boolean, retryCorrect: boolean | null) => void
}

export function DragDrop({
  stem,
  tiles,
  blanks,
  correctMapping,
  warmResponseCorrect,
  warmResponseIncorrect,
  isAriaPlaying,
  onComplete,
}: DragDropProps) {
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const [filledBlanks, setFilledBlanks] = useState<Record<string, string>>({})
  const [usedTiles, setUsedTiles] = useState<Set<string>>(new Set())
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showPoints, setShowPoints] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [firstWasWrong, setFirstWasWrong] = useState(false)

  const allFilled = blanks.every((b) => filledBlanks[b] !== undefined)

  function handleTileTap(tile: string) {
    if (showFeedback || usedTiles.has(tile)) return
    setSelectedTile(tile)
  }

  function handleBlankTap(blank: string) {
    if (showFeedback) return

    // If blank is already filled, tap it to remove the tile
    if (filledBlanks[blank] !== undefined) {
      const removedTile = filledBlanks[blank]
      setFilledBlanks((prev) => {
        const next = { ...prev }
        delete next[blank]
        return next
      })
      setUsedTiles((prev) => {
        const next = new Set(prev)
        next.delete(removedTile)
        return next
      })
      return
    }

    // Place selected tile into blank
    if (!selectedTile) return
    setFilledBlanks((prev) => ({ ...prev, [blank]: selectedTile }))
    setUsedTiles((prev) => new Set(prev).add(selectedTile))
    setSelectedTile(null)
  }

  function handleCheck() {
    const correct = blanks.every((b) => filledBlanks[b] === correctMapping[b])
    setIsCorrect(correct)
    setShowFeedback(true)

    if (correct) {
      setShowPoints(true)
      setTimeout(() => onComplete(true, firstWasWrong, firstWasWrong ? true : null), 2000)
    } else if (attempt === 0) {
      setFirstWasWrong(true)
      setTimeout(() => {
        setShowFeedback(false)
        setFilledBlanks({})
        setUsedTiles(new Set())
        setSelectedTile(null)
        setAttempt(1)
      }, 2000)
    } else {
      setTimeout(() => onComplete(false, true, false), 2000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <PointsAnimation points={5} show={showPoints} />

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 text-sm text-amber-400"
      >
        Tap a number, then tap the blank to place it. Tap a filled blank to remove it.
      </motion.p>

      {attempt === 1 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 text-sm text-orange-400 font-medium">
          Try again!
        </motion.p>
      )}

      {isAriaPlaying && (
        <motion.div className="mb-6 flex items-center gap-2 text-amber-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🎤</motion.span>
          <span className="text-sm">Miss Aria...</span>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-amber-900 text-center font-medium mb-8 max-w-md"
      >
        {stem}
      </motion.p>

      {/* Blanks */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {blanks.map((blank, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => handleBlankTap(blank)}
            className={`min-w-[80px] h-12 px-4 rounded-xl border-2 border-dashed text-lg font-medium flex items-center justify-center transition-colors ${
              filledBlanks[blank]
                ? 'bg-amber-100 border-amber-400 text-amber-900'
                : selectedTile
                  ? 'border-amber-400 bg-amber-50 text-amber-400 cursor-pointer'
                  : 'border-amber-200 bg-white text-amber-300'
            }`}
          >
            {filledBlanks[blank] || '?'}
          </motion.button>
        ))}
      </div>

      {/* Tiles */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {tiles.map((tile, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: usedTiles.has(tile) ? 0.4 : 1, scale: 1 }}
            transition={{ delay: 0.05 * i }}
            whileHover={!usedTiles.has(tile) && !showFeedback ? { scale: 1.08 } : {}}
            whileTap={!usedTiles.has(tile) && !showFeedback ? { scale: 0.92 } : {}}
            onClick={() => handleTileTap(tile)}
            disabled={usedTiles.has(tile) || showFeedback}
            className={`px-5 py-2 rounded-xl text-lg font-medium shadow-sm transition-colors ${
              selectedTile === tile
                ? 'bg-amber-400 text-white border-2 border-amber-500'
                : 'bg-white border-2 border-amber-200 text-amber-900'
            }`}
          >
            {tile}
          </motion.button>
        ))}
      </div>

      {/* Check button */}
      {allFilled && !showFeedback && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleCheck}
          className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white text-lg font-semibold rounded-full shadow-md transition-colors"
        >
          Check ✓
        </motion.button>
      )}

      <WarmFeedback
        type={isCorrect ? 'correct' : 'incorrect'}
        message={isCorrect ? warmResponseCorrect : warmResponseIncorrect}
        show={showFeedback}
      />
    </div>
  )
}
