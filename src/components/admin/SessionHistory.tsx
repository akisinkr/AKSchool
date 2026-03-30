'use client'

interface SessionRow {
  id: string
  date: string
  subjectName: string
  topicName: string
  pointsEarned: number
  completed: boolean
  reengagementTriggers: number
  hintsRequested: number
}

interface SessionHistoryProps {
  sessions: SessionRow[]
}

export function SessionHistory({ sessions }: SessionHistoryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">Recent Sessions</h3>
      </div>

      {sessions.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          No sessions yet
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-50">
              <th className="px-5 py-2 font-medium">Date</th>
              <th className="px-5 py-2 font-medium">Subject</th>
              <th className="px-5 py-2 font-medium">Topic</th>
              <th className="px-5 py-2 font-medium text-right">Points</th>
              <th className="px-5 py-2 font-medium text-right">Focus</th>
              <th className="px-5 py-2 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 text-gray-600">{s.date}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    s.subjectName.toLowerCase() === 'math'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-teal-50 text-teal-600'
                  }`}>
                    {s.subjectName}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-700">{s.topicName}</td>
                <td className="px-5 py-3 text-right font-medium text-amber-600">
                  +{s.pointsEarned}
                </td>
                <td className="px-5 py-3 text-right">
                  {s.reengagementTriggers > 0 ? (
                    <span className="text-orange-500" title={`${s.reengagementTriggers} re-engagement triggers`}>
                      ⚠️ {s.reengagementTriggers}
                    </span>
                  ) : (
                    <span className="text-green-500">✓</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {s.completed ? (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                      Partial
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
