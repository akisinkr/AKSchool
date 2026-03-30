'use client'

import { useState } from 'react'

interface Topic {
  id: string
  display_name: string
  difficulty: number
  tags: string[]
  kis_curriculum_aligned: boolean
  is_active: boolean
}

interface TopicLibraryProps {
  topics: Topic[]
  currentTopicId: string | null
  onSelectTopic: (topicId: string) => void
  onPreviewTopic: (topicId: string) => void
}

export function TopicLibrary({ topics, currentTopicId, onSelectTopic, onPreviewTopic }: TopicLibraryProps) {
  const [filter, setFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null)

  const filtered = topics.filter((t) => {
    if (filter && !t.display_name.toLowerCase().includes(filter.toLowerCase())) return false
    if (difficultyFilter !== null && t.difficulty !== difficultyFilter) return false
    return true
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Topic Library</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search topics..."
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
          />
          <select
            value={difficultyFilter ?? ''}
            onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400"
          >
            <option value="">All levels</option>
            <option value="1">Easy</option>
            <option value="2">Medium</option>
            <option value="3">Hard</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {filtered.map((topic) => {
          const isCurrent = topic.id === currentTopicId
          return (
            <div
              key={topic.id}
              className={`px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 ${
                isCurrent ? 'bg-amber-50/50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium truncate ${isCurrent ? 'text-amber-700' : 'text-gray-700'}`}>
                    {topic.display_name}
                  </p>
                  {isCurrent && (
                    <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      Current
                    </span>
                  )}
                  {topic.kis_curriculum_aligned && (
                    <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      KIS
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">
                    {'●'.repeat(topic.difficulty)}{'○'.repeat(3 - topic.difficulty)}
                  </span>
                  <div className="flex gap-1">
                    {topic.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <button
                  onClick={() => onPreviewTopic(topic.id)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Preview
                </button>
                {!isCurrent && (
                  <button
                    onClick={() => onSelectTopic(topic.id)}
                    className="text-xs text-amber-600 hover:text-amber-700 px-2 py-1 rounded border border-amber-200 hover:border-amber-300 bg-amber-50 transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No topics match your filters
          </div>
        )}
      </div>
    </div>
  )
}
