'use client'

interface TopicPreviewProps {
  topic: {
    display_name: string
    difficulty: number
    cpa_anchor: string | null
    sharon_analogy: string | null
    tags: string[]
    kis_curriculum_aligned: boolean
  } | null
  onClose: () => void
}

export function TopicPreview({ topic, onClose }: TopicPreviewProps) {
  if (!topic) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{topic.display_name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Difficulty */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Difficulty</p>
            <p className="text-sm text-gray-700">
              {'●'.repeat(topic.difficulty)}{'○'.repeat(3 - topic.difficulty)}{' '}
              {topic.difficulty === 1 ? 'Easy' : topic.difficulty === 2 ? 'Medium' : 'Hard'}
            </p>
          </div>

          {/* CPA Anchor */}
          {topic.cpa_anchor && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">CPA Framework</p>
              <p className="text-sm text-gray-700 leading-relaxed">{topic.cpa_anchor}</p>
            </div>
          )}

          {/* Sharon's Analogy */}
          {topic.sharon_analogy && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sharon&apos;s Analogy</p>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-sm text-amber-800 italic">&ldquo;{topic.sharon_analogy}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {topic.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* KIS Aligned */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Curriculum Alignment</p>
            <p className="text-sm text-gray-700">
              {topic.kis_curriculum_aligned ? '✓ KIS Seoul aligned' : '— Not yet verified'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
