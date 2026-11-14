import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { on, EVENTS } from '../utils/events.js'

const DEFAULT_SUBJECTS = [
  { id: 'history', name: 'History', lessonCount: 61 },
  { id: 'eco', name: 'Economics', lessonCount: 39 },
  { id: 'ethics', name: 'Ethics', lessonCount: 47 },
  { id: 'geo', name: 'Geography', lessonCount: 48 },
  { id: 'env', name: 'Environment', lessonCount: 34 },
  { id: 'polity', name: 'Polity', lessonCount: 71 },
  { id: 'scitech', name: 'Science & Tech', lessonCount: 21 },
  { id: 'essay', name: 'Essay', lessonCount: 6 }
]

const CORE_4_SUBJECTS = ['history', 'eco', 'geo', 'polity']

function SyllabusProgressDashboard() {
  const [episodes, setEpisodes] = useState({})
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS)

  useEffect(() => {
    loadData()

    const unsubscribe = on(EVENTS.MISFITS_UPDATED, () => {
      loadData()
    })

    return () => unsubscribe()
  }, [])

  const loadData = async () => {
    const episodesData = await storage.getMisfitsEpisodes()
    const customSubjects = await storage.getCustomMisfitsSubjects() || []
    
    // Merge: custom subjects override defaults with same ID
    const activeCustomSubjects = customSubjects.filter(subject => !subject.deleted)
    const customIds = new Set(activeCustomSubjects.map(s => s.id))
    const deletedIds = new Set(customSubjects.filter(subject => subject.deleted).map(s => s.id))
    const merged = [
      ...DEFAULT_SUBJECTS.filter(s => !customIds.has(s.id) && !deletedIds.has(s.id)),
      ...activeCustomSubjects
    ]
    setSubjects(merged)
    setEpisodes(episodesData || {})
  }

  const getEpisodeStatus = (subject, episodeNum) => {
    const key = `${subject}-${episodeNum}`
    return episodes[key] || 'not-started'
  }

  const getStatusStats = (subjectIds, targetStatus) => {
    let count = 0
    let total = 0
    
    subjectIds.forEach(subjectId => {
      const subject = subjects.find(s => s.id === subjectId)
      const lessonCount = subject ? subject.lessonCount : 10
      
      for (let i = 1; i <= lessonCount; i++) {
        const status = getEpisodeStatus(subjectId, i)
        if (status === targetStatus) count++
        total++
      }
    })
    
    return { count, total, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }
  }

  const getPendingCount = (subjectIds, minStatus) => {
    // Count topics that haven't reached at least minStatus
    let pending = 0
    
    subjectIds.forEach(subjectId => {
      const subject = subjects.find(s => s.id === subjectId)
      const lessonCount = subject ? subject.lessonCount : 10
      
      for (let i = 1; i <= lessonCount; i++) {
        const status = getEpisodeStatus(subjectId, i)
        const statusValue = { 'not-started': 0, 'reading': 1, 'revision': 2, 'mastered': 3 }
        if (statusValue[status] < statusValue[minStatus]) {
          pending++
        }
      }
    })
    
    return pending
  }

  const core4Ids = CORE_4_SUBJECTS.filter(id => subjects.some(s => s.id === id))
  const allSubjectsIds = subjects.map(s => s.id)

  // Calculate stats for each status
  const notStartedStats = {
    core4: getStatusStats(core4Ids, 'not-started'),
    all: getStatusStats(allSubjectsIds, 'not-started')
  }

  const readingStats = {
    core4: getStatusStats(core4Ids, 'reading'),
    all: getStatusStats(allSubjectsIds, 'reading')
  }

  const revisionStats = {
    core4: getStatusStats(core4Ids, 'revision'),
    all: getStatusStats(allSubjectsIds, 'revision')
  }

  const masteredStats = {
    core4: getStatusStats(core4Ids, 'mastered'),
    all: getStatusStats(allSubjectsIds, 'mastered')
  }

  const readingPending = {
    core4: getPendingCount(core4Ids, 'reading'),
    all: getPendingCount(allSubjectsIds, 'reading')
  }

  const revisionPending = {
    core4: getPendingCount(core4Ids, 'revision'),
    all: getPendingCount(allSubjectsIds, 'revision')
  }

  const masteredPending = {
    core4: getPendingCount(core4Ids, 'mastered'),
    all: getPendingCount(allSubjectsIds, 'mastered')
  }

  const ProgressCard = ({ title, subtitle, icon, core4Stats, allStats, pending, pendingLabel, colorClass }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center text-white font-bold`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {/* GS Paper 1 (Core 4) */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">GS Paper 1 (4 Core)</span>
          <span className="text-lg font-bold text-slate-800">{core4Stats.percentage}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full ${colorClass} transition-all duration-500`}
            style={{ width: `${core4Stats.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">
            {core4Stats.count} / {core4Stats.total} topics
          </span>
          {pending && (
            <span className="text-amber-600 font-medium">
              {pending.core4} {pendingLabel}
            </span>
          )}
        </div>
      </div>

      {/* All Subjects */}
      <div className="p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">All GS Subjects</span>
          <span className="text-lg font-bold text-slate-800">{allStats.percentage}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
          <div 
            className={`h-full ${colorClass} transition-all duration-500`}
            style={{ width: `${allStats.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">
            {allStats.count} / {allStats.total} topics
          </span>
          {pending && (
            <span className="text-amber-600 font-medium">
              {pending.all} {pendingLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Syllabus Progress Breakdown
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mastered Card */}
        <ProgressCard
          title="Mastered"
          subtitle="100% - Completed 3rd revision"
          icon="M"
          core4Stats={masteredStats.core4}
          allStats={masteredStats.all}
          pending={masteredPending}
          pendingLabel="after revision"
          colorClass="bg-emerald-500"
        />

        {/* Revision Card */}
        <ProgressCard
          title="Revision"
          subtitle="75% - Completed 2nd revision"
          icon="R"
          core4Stats={revisionStats.core4}
          allStats={revisionStats.all}
          pending={revisionPending}
          pendingLabel="after 1st watch"
          colorClass="bg-amber-500"
        />

        {/* Reading Card */}
        <ProgressCard
          title="Reading"
          subtitle="25% - Watched once"
          icon="Rd"
          core4Stats={readingStats.core4}
          allStats={readingStats.all}
          pending={readingPending}
          pendingLabel="not started"
          colorClass="bg-blue-500"
        />

        {/* Not Started Card */}
        <ProgressCard
          title="Not Started"
          subtitle="0% - Haven't begun"
          icon="-"
          core4Stats={notStartedStats.core4}
          allStats={notStartedStats.all}
          colorClass="bg-slate-400"
        />
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">
        Click any topic in Syllabus Mapper to cycle through: Not Started → Reading → Revision → Mastered
      </p>
    </div>
  )
}

export default SyllabusProgressDashboard
