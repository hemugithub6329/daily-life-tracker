import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import storage from '../utils/fileStorage.js'
import { getDaysInWeek, formatDate, formatDisplayDate } from '../utils/dateUtils.js'
import { on, HABITS_UPDATED } from '../utils/events.js'
import { addDays, format } from 'date-fns'

function WeeklyChart({ fixedHabits }) {
  const [weekData, setWeekData] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [stats, setStats] = useState({ perfectDays: 0, avgTasks: 0, successRate: 0 })

  useEffect(() => {
    loadWeekData()
    
    const unsubscribeHabits = on(HABITS_UPDATED, (payload) => {
      // Always reload for undo/redo
      if (payload?.action === 'undo' || payload?.action === 'redo') {
        loadWeekData()
      } else {
        loadWeekData()
      }
    })
    
    return () => unsubscribeHabits()
  }, [selectedWeek, fixedHabits])

  const loadWeekData = async () => {
    const days = getDaysInWeek(selectedWeek)
    const data = []
    let perfectDays = 0
    let totalCompleted = 0
    let totalTasks = 0
    
    for (const day of days) {
      const dateKey = formatDate(day)
      const habits = await storage.getHabits(dateKey)
      const customHabits = await storage.getCustomHabits(dateKey)
      
      // Calculate completion with new data structure
      // habits is object {habitName: boolean}, customHabits is array [{text, completed}]
      const fixedCompleted = Object.values(habits).filter(Boolean).length
      const customCompleted = customHabits.filter(h => h.status === 'completed').length
      const completedHabits = fixedCompleted + customCompleted
      
      const totalHabits = Object.keys(habits).length + customHabits.length
      const percentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0
      
      if (percentage === 100) perfectDays++
      totalCompleted += completedHabits
      totalTasks += totalHabits
      
      data.push({
        day: format(day, 'EEE'),
        date: dateKey,
        percentage,
        completed: completedHabits,
        total: totalHabits,
        fullDate: formatDisplayDate(day)
      })
    }
    
    const avgTasks = days.length > 0 ? (totalCompleted / days.length).toFixed(1) : 0
    const successRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0
    
    setWeekData(data)
    setStats({ perfectDays, avgTasks, successRate })
  }

  const handlePrevWeek = () => {
    setSelectedWeek(prev => addDays(prev, -7))
  }

  const handleNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7))
  }

  const getBarColor = (percentage) => {
    if (percentage === 100) return '#16a34a'
    if (percentage >= 85) return '#22c55e'
    if (percentage >= 50) return '#84cc16'
    if (percentage >= 25) return '#a3e635'
    return '#dcfce7'
  }

  return (
    <div className="glass-card glass-card-hover p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Weekly Progress
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevWeek} className="btn-secondary text-sm py-1 px-2">←</button>
          <button onClick={() => setSelectedWeek(new Date())} className="btn-secondary text-sm py-1 px-2">Today</button>
          <button onClick={handleNextWeek} className="btn-secondary text-sm py-1 px-2">→</button>
        </div>
      </div>

      <div className="flex-grow h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weekData}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip 
              formatter={(value, name, props) => [
                `${props.payload.completed}/${props.payload.total} (${value}%)`,
                'Completed'
              ]}
              labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]} barSize={35}>
              {weekData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats below chart per Prompt 4 spec */}
      <div className="mt-4 pt-4 border-t border-gray-200/50">
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">Perfect Days</p>
              <p className="text-lg font-bold text-green-600">{stats.perfectDays}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg: {stats.avgTasks}/day</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Success Rate</p>
            <p className="text-lg font-bold text-purple-600">{stats.successRate}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeeklyChart
