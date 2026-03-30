'use client'

import { useState, useEffect, useCallback } from 'react'

interface TeacherNote {
  id: string
  subject: string | null
  source: string | null
  note_text: string
  note_language: string
  created_at: string
}

interface SchoolMaterial {
  id: string
  material_type: string
  subject: string | null
  week_of: string | null
  file_url: string | null
  notes: string | null
  created_at: string
}

interface LearnerProfile {
  strengths: string[]
  development_areas: string[]
  focus_notes: Record<string, string>
  personal_context: Record<string, unknown>
  current_school_context: Record<string, unknown>
}

export default function SchoolInputPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [materials, setMaterials] = useState<SchoolMaterial[]>([])
  const [profile, setProfile] = useState<LearnerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // New note form
  const [noteSubject, setNoteSubject] = useState('')
  const [noteSource, setNoteSource] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteLanguage, setNoteLanguage] = useState('en')
  const [saving, setSaving] = useState(false)

  // New material form
  const [matType, setMatType] = useState('other')
  const [matSubject, setMatSubject] = useState('')
  const [matNotes, setMatNotes] = useState('')

  const loadData = useCallback(async () => {
    const res = await fetch('/api/school-input')
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setStudentId(data.studentId)
    setNotes(data.teacherNotes)
    setMaterials(data.schoolMaterials)
    setProfile(data.learnerProfile)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleAddNote() {
    if (!noteText.trim() || !studentId) return
    setSaving(true)
    await fetch('/api/school-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'teacher_note',
        studentId,
        subject: noteSubject || null,
        source: noteSource || null,
        noteText: noteText.trim(),
        language: noteLanguage,
      }),
    })
    setNoteText('')
    setNoteSubject('')
    setNoteSource('')
    await loadData()
    setSaving(false)
  }

  async function handleAddMaterial() {
    if (!studentId) return
    setSaving(true)
    await fetch('/api/school-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'school_material',
        studentId,
        materialType: matType,
        subject: matSubject || null,
        notes: matNotes || null,
      }),
    })
    setMatNotes('')
    setMatSubject('')
    setMatType('other')
    await loadData()
    setSaving(false)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading school input...</div>
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-800">School Input</h2>

      {saving && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-700">
          Saving...
        </div>
      )}

      {/* ===== Teacher Notes ===== */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Teacher Feedback Notes</h3>

        {/* Add note form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subject</label>
              <select
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="">General</option>
                <option value="Math">Math</option>
                <option value="English">English</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Source</label>
              <input
                type="text"
                value={noteSource}
                onChange={(e) => setNoteSource(e.target.value)}
                placeholder="e.g. Teacher Kim, Parent-teacher conf"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Language</label>
              <select
                value={noteLanguage}
                onChange={(e) => setNoteLanguage(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="en">English</option>
                <option value="ko">Korean</option>
              </select>
            </div>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter teacher feedback or notes..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim() || saving}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:bg-gray-300 transition-colors"
          >
            Add Note
          </button>
        </div>

        {/* Existing notes */}
        {notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  {note.subject && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      note.subject === 'Math' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
                    }`}>{note.subject}</span>
                  )}
                  {note.source && <span className="text-xs text-gray-400">{note.source}</span>}
                  <span className="text-xs text-gray-300">{new Date(note.created_at).toLocaleDateString()}</span>
                  <span className="text-xs text-gray-300">{note.note_language === 'ko' ? '🇰🇷' : '🇺🇸'}</span>
                </div>
                <p className="text-sm text-gray-700">{note.note_text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No teacher notes yet</p>
        )}
      </div>

      {/* ===== School Materials ===== */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">School Materials</h3>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select
                value={matType}
                onChange={(e) => setMatType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="vocab_list">Vocab List</option>
                <option value="worksheet">Worksheet</option>
                <option value="test">Test</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Subject</label>
              <select
                value={matSubject}
                onChange={(e) => setMatSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
              >
                <option value="">General</option>
                <option value="Math">Math</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
          <textarea
            value={matNotes}
            onChange={(e) => setMatNotes(e.target.value)}
            placeholder="Notes about this material..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none"
          />
          <button
            onClick={handleAddMaterial}
            disabled={saving}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg disabled:bg-gray-300 transition-colors"
          >
            Add Material
          </button>
        </div>

        {materials.length > 0 ? (
          <div className="space-y-2">
            {materials.map((mat) => (
              <div key={mat.id} className="bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {mat.material_type}
                    </span>
                    {mat.subject && <span className="text-xs text-gray-500">{mat.subject}</span>}
                    <span className="text-xs text-gray-300">{new Date(mat.created_at).toLocaleDateString()}</span>
                  </div>
                  {mat.notes && <p className="text-sm text-gray-600 mt-1">{mat.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No materials uploaded yet</p>
        )}
      </div>

      {/* ===== Learner Profile ===== */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-700">Sharon&apos;s Learner Profile</h3>

        {profile && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Focus & Learning Style</p>
              <div className="space-y-1">
                {Object.entries(profile.focus_notes).map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-700">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Personal Context</p>
              <div className="space-y-1">
                {Object.entries(profile.personal_context).map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-700">{Array.isArray(val) ? (val as string[]).join(', ') : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">School Context</p>
              <div className="space-y-1">
                {Object.entries(profile.current_school_context).map(([key, val]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-700">{val === null ? '—' : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400 italic">Auto-updated from session data and uploads. Manual overrides available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
