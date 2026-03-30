'use client'

interface SubjectAccuracyProps {
  subjects: Array<{
    name: string
    colorTheme: 'math' | 'english'
    accuracy: number
    totalQuestions: number
    correctAnswers: number
  }>
}

export function SubjectAccuracy({ subjects }: SubjectAccuracyProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Subject Accuracy</h3>

      <div className="space-y-4">
        {subjects.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-medium ${
                s.colorTheme === 'math' ? 'text-amber-700' : 'text-teal-700'
              }`}>
                {s.name}
              </span>
              <span className="text-sm text-gray-500">
                {s.accuracy}% ({s.correctAnswers}/{s.totalQuestions})
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  s.colorTheme === 'math' ? 'bg-amber-400' : 'bg-teal-400'
                }`}
                style={{ width: `${s.accuracy}%` }}
              />
            </div>
          </div>
        ))}

        {subjects.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">No data yet</p>
        )}
      </div>
    </div>
  )
}
