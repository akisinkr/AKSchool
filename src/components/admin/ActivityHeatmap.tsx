'use client'

interface DayData {
  date: string
  completed: boolean
  points: number
}

interface ActivityHeatmapProps {
  days: DayData[]
}

export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
  // Show last 28 days (4 weeks)
  const last28 = days.slice(-28)

  // Pad to fill 4 complete weeks
  while (last28.length < 28) {
    last28.unshift({ date: '', completed: false, points: 0 })
  }

  const weeks: DayData[][] = []
  for (let i = 0; i < last28.length; i += 7) {
    weeks.push(last28.slice(i, i + 7))
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  function getCellColor(day: DayData): string {
    if (!day.date) return 'bg-gray-50'
    if (!day.completed) return 'bg-gray-100'
    if (day.points >= 100) return 'bg-amber-400'
    if (day.points >= 50) return 'bg-amber-300'
    return 'bg-amber-200'
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Activity (last 4 weeks)</h3>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-4 h-4 flex items-center justify-center">
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-4 h-4 rounded-sm ${getCellColor(day)}`}
                title={day.date ? `${day.date}: ${day.points} pts` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-gray-400">Less</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-amber-200" />
        <div className="w-3 h-3 rounded-sm bg-amber-300" />
        <div className="w-3 h-3 rounded-sm bg-amber-400" />
        <span className="text-[10px] text-gray-400">More</span>
      </div>
    </div>
  )
}
