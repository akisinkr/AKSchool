'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopicLibrary } from '@/components/admin/TopicLibrary'
import { TopicPreview } from '@/components/admin/TopicPreview'

interface SubjectData {
  id: string
  name: string
  currentTopicId: string | null
  currentTopicName: string | null
  rotationMode: 'auto' | 'manual'
  topics: Array<{
    id: string
    display_name: string
    difficulty: number
    cpa_anchor: string | null
    sharon_analogy: string | null
    tags: string[]
    kis_curriculum_aligned: boolean
    is_active: boolean
  }>
}

export default function CurriculumPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [studentId, setStudentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewTopic, setPreviewTopic] = useState<SubjectData['topics'][number] | null>(null)
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    const res = await fetch('/api/admin-curriculum')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setSubjects(data.subjects)
    setStudentId(data.studentId)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleChangeTopic(subjectId: string, topicId: string) {
    if (!studentId) return
    setSaving(true)
    await fetch('/api/admin-curriculum', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, subjectId, topicId }),
    })
    await loadData()
    setSaving(false)
  }

  async function handleToggleRotation(subjectId: string, currentMode: 'auto' | 'manual') {
    if (!studentId) return
    setSaving(true)
    const newMode = currentMode === 'auto' ? 'manual' : 'auto'
    await fetch('/api/admin-curriculum', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, subjectId, rotationMode: newMode }),
    })
    await loadData()
    setSaving(false)
  }

  function handlePreview(subjectId: string, topicId: string) {
    const subject = subjects.find((s) => s.id === subjectId)
    const topic = subject?.topics.find((t) => t.id === topicId)
    if (topic) setPreviewTopic(topic)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading curriculum...</div>
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-800">Curriculum Management</h2>

      {saving && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
          Saving changes...
        </div>
      )}

      {subjects.map((subject) => (
        <div key={subject.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-base font-semibold ${
                subject.name.toLowerCase() === 'math' ? 'text-amber-700' : 'text-teal-700'
              }`}>
                {subject.name}
              </h3>
              <p className="text-sm text-gray-500">
                Current topic: <span className="font-medium text-gray-700">{subject.currentTopicName || 'None set'}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">Rotation:</span>
              <button
                onClick={() => handleToggleRotation(subject.id, subject.rotationMode)}
                className={`relative w-20 h-8 rounded-full transition-colors ${
                  subject.rotationMode === 'auto' ? 'bg-amber-400' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
                    subject.rotationMode === 'auto' ? 'translate-x-12' : 'translate-x-1'
                  }`}
                />
                <span className={`absolute inset-0 flex items-center text-[10px] font-medium text-white ${
                  subject.rotationMode === 'auto' ? 'justify-start pl-2' : 'justify-end pr-2'
                }`}>
                  {subject.rotationMode === 'auto' ? 'Auto' : 'Manual'}
                </span>
              </button>
            </div>
          </div>

          <TopicLibrary
            topics={subject.topics}
            currentTopicId={subject.currentTopicId}
            onSelectTopic={(topicId) => handleChangeTopic(subject.id, topicId)}
            onPreviewTopic={(topicId) => handlePreview(subject.id, topicId)}
          />
        </div>
      ))}

      <TopicPreview topic={previewTopic} onClose={() => setPreviewTopic(null)} />
    </div>
  )
}
