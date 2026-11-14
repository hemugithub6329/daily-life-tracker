import { useState, useEffect } from 'react'
import storage from '../utils/fileStorage.js'
import { emit, on, EVENTS } from '../utils/events.js'

const DEFAULT_SUBJECTS = [
  { id: 'history', name: 'History (Ancient, Medieval, Modern)', lessonCount: 61, color: 'bg-violet-500', lightColor: 'bg-violet-100', textColor: 'text-violet-700', isDefault: true },
  { id: 'eco', name: 'Fundamentals of Economics', lessonCount: 39, color: 'bg-amber-500', lightColor: 'bg-amber-100', textColor: 'text-amber-700', isDefault: true },
  { id: 'ethics', name: 'Ethics, Life, and beyond (for Mains)', lessonCount: 47, color: 'bg-rose-500', lightColor: 'bg-rose-100', textColor: 'text-rose-700', isDefault: true },
  { id: 'geo', name: 'Geography, Disaster Management, Env, S&T', lessonCount: 48, color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700', isDefault: true },
  { id: 'env', name: 'Environment & Climate Change', lessonCount: 34, color: 'bg-cyan-500', lightColor: 'bg-cyan-100', textColor: 'text-cyan-700', isDefault: true },
  { id: 'polity', name: 'Polity, Governance, & Society', lessonCount: 71, color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', isDefault: true },
  { id: 'scitech', name: 'Science, Tech and Innovation', lessonCount: 21, color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-100', textColor: 'text-fuchsia-700', isDefault: true },
  { id: 'essay', name: 'Essay (Mains Module)', lessonCount: 6, color: 'bg-lime-500', lightColor: 'bg-lime-100', textColor: 'text-lime-700', isDefault: true }
]

const PSIR_SEASONS = [
  { id: 'season1', name: 'Season 1: Western Political Thinkers (Paper 1)', lessonCount: 33, color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', isDefault: true },
  { id: 'season2', name: 'Season 2: Indian Political Thinkers (Paper 1)', lessonCount: 13, color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', isDefault: true },
  { id: 'watch_before_s3', name: 'Watch Before Season 3: PSIR Mains 2024 (Magic at MisFits)', lessonCount: 1, color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700', isDefault: true },
  { id: 'season3', name: 'Season 3: Political Ideologies (Paper 1)', lessonCount: 12, color: 'bg-pink-500', lightColor: 'bg-pink-100', textColor: 'text-pink-700', isDefault: true },
  { id: 'season4', name: 'Season 4: Miscellaneous Mind (Political Theory, Justice, etc)', lessonCount: 12, color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', isDefault: true },
  { id: 'season5', name: 'Season 5: International Relations & the World', lessonCount: 22, color: 'bg-yellow-500', lightColor: 'bg-yellow-100', textColor: 'text-yellow-700', isDefault: true },
  { id: 'season6', name: 'Season 6: India and the World', lessonCount: 13, color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', isDefault: true },
  { id: 'season7', name: 'Season 7 (Finale): Politics, Politics, and Politics', lessonCount: 19, color: 'bg-teal-500', lightColor: 'bg-teal-100', textColor: 'text-teal-700', isDefault: true }
]

const MAIN_SUBJECTS = ['history', 'eco', 'ethics', 'geo']
const PSIR_MAIN_SEASONS = ['season1', 'season2', 'season3', 'season4']
const COLORS = [
  { bg: 'bg-violet-500', light: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-rose-500', light: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-fuchsia-500', light: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-lime-500', light: 'bg-lime-100', text: 'text-lime-700' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700' }
]

function MisfitsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('gs') // 'gs' or 'psir'
  const [gsEpisodes, setGsEpisodes] = useState({})
  const [psirEpisodes, setPsirEpisodes] = useState({})
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS)
  const [psirSeasons, setPsirSeasons] = useState(PSIR_SEASONS)
  const [currentEpisode, setCurrentEpisode] = useState('')
  const [activeSubject, setActiveSubject] = useState(null)
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectEpisodes, setNewSubjectEpisodes] = useState(10)
  const [editingSubject, setEditingSubject] = useState(null)
  const [editEpisodeCount, setEditEpisodeCount] = useState(10)
  const [editSubjectName, setEditSubjectName] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const episodesData = await storage.getMisfitsEpisodes()
    const psirEpisodesData = await storage.getPsirEpisodes()
    const customSubjects = await storage.getCustomMisfitsSubjects()
    const customPsirSeasons = await storage.getCustomPsirSeasons()

    // Migrate old data: 'none'/'completed'/'wrong' → 'not-started'/'reading'/'revision'/'mastered'
    const migratedGsEpisodes = {}
    const migratedPsirEpisodes = {}
    
    Object.entries(episodesData).forEach(([key, status]) => {
      if (status === 'none') migratedGsEpisodes[key] = 'not-started'
      else if (status === 'completed') migratedGsEpisodes[key] = 'reading'
      else if (status === 'wrong') migratedGsEpisodes[key] = 'revision'
      else migratedGsEpisodes[key] = status
    })
    
    Object.entries(psirEpisodesData).forEach(([key, status]) => {
      if (status === 'none') migratedPsirEpisodes[key] = 'not-started'
      else if (status === 'completed') migratedPsirEpisodes[key] = 'reading'
      else if (status === 'wrong') migratedPsirEpisodes[key] = 'revision'
      else migratedPsirEpisodes[key] = status
    })

    // Merge default and custom subjects
    const mergedSubjects = [...DEFAULT_SUBJECTS]
    customSubjects.forEach(custom => {
      const existingIndex = mergedSubjects.findIndex(s => s.id === custom.id)
      if (existingIndex >= 0) {
        mergedSubjects[existingIndex] = custom
      } else {
        mergedSubjects.push(custom)
      }
    })

    // Merge default and custom PSIR seasons
    const mergedPsirSeasons = [...PSIR_SEASONS]
    customPsirSeasons.forEach(custom => {
      const existingIndex = mergedPsirSeasons.findIndex(s => s.id === custom.id)
      if (existingIndex >= 0) {
        mergedPsirSeasons[existingIndex] = custom
      } else {
        mergedPsirSeasons.push(custom)
      }
    })

    setGsEpisodes(migratedGsEpisodes)
    setPsirEpisodes(migratedPsirEpisodes)
    setSubjects(mergedSubjects)
    setPsirSeasons(mergedPsirSeasons)
  }

  const saveEpisodes = async (newEpisodes, isPsir = false) => {
    if (isPsir) {
      await storage.savePsirEpisodes(newEpisodes)
      setPsirEpisodes(newEpisodes)
    } else {
      await storage.saveMisfitsEpisodes(newEpisodes)
      setGsEpisodes(newEpisodes)
    }
    emit(EVENTS.MISFITS_UPDATED, newEpisodes)
  }

  const getCurrentEpisodes = () => activeTab === 'psir' ? psirEpisodes : gsEpisodes
  const getCurrentSubjects = () => activeTab === 'psir' ? psirSeasons : subjects

  const saveSubjects = async (newSubjects) => {
    // Save all non-default subjects as custom
    const customSubjects = newSubjects.filter(s => !s.isDefault)
    if (storage.saveCustomMisfitsSubjects) {
      await storage.saveCustomMisfitsSubjects(customSubjects)
    }
    setSubjects(newSubjects)
    emit(EVENTS.MISFITS_UPDATED, { subjects: newSubjects })
  }

  const addNewSubject = async () => {
    if (!newSubjectName.trim() || newSubjectEpisodes < 1) return
    
    const newId = `custom-${Date.now()}`
    const colorIndex = (subjects.length) % COLORS.length
    const color = COLORS[colorIndex]
    
    const newSubject = {
      id: newId,
      name: newSubjectName.trim(),
      lessonCount: parseInt(newSubjectEpisodes),
      color: color.bg,
      lightColor: color.light,
      textColor: color.text,
      isDefault: false
    }
    
    const updatedSubjects = [...subjects, newSubject]
    await saveSubjects(updatedSubjects)
    
    setShowAddSubjectForm(false)
    setNewSubjectName('')
    setNewSubjectEpisodes(10)
  }

  const editSubjectDetails = async (subjectId, newName, newCount) => {
    if (!newName.trim() || newCount < 1) return
    
    const updatedSubjects = subjects.map(s => 
      s.id === subjectId ? { ...s, name: newName.trim(), lessonCount: newCount, isDefault: false } : s
    )
    await saveSubjects(updatedSubjects)
    
    // Clear any old episode data beyond the new count
    const newEpisodes = { ...episodes }
    for (let i = newCount + 1; i <= 500; i++) {
      delete newEpisodes[`${subjectId}-${i}`]
    }
    await saveEpisodes(newEpisodes)
    
    setEditingSubject(null)
    setEditSubjectName('')
  }

  const deleteSubject = async (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId)
    if (confirm(`Are you sure you want to delete "${subject?.name}"? All its progress data will be lost.`)) {
      const updatedSubjects = subjects.filter(s => s.id !== subjectId)
      await saveSubjects(updatedSubjects)
      
      // Remove all episodes for this subject
      const newEpisodes = { ...episodes }
      Object.keys(newEpisodes).forEach(key => {
        if (key.startsWith(`${subjectId}-`)) {
          delete newEpisodes[key]
        }
      })
      await saveEpisodes(newEpisodes)
    }
  }

  // 4-state toggle: not-started → reading → revision → mastered → not-started
  const toggleEpisodeStatus = (subject, episodeNum) => {
    const key = `${subject}-${episodeNum}`
    const currentEpisodes = getCurrentEpisodes()
    const currentStatus = currentEpisodes[key] || 'not-started'
    
    let newStatus
    if (currentStatus === 'not-started') newStatus = 'reading'
    else if (currentStatus === 'reading') newStatus = 'revision'
    else if (currentStatus === 'revision') newStatus = 'mastered'
    else newStatus = 'not-started'
    
    const newEpisodes = { ...currentEpisodes, [key]: newStatus }
    saveEpisodes(newEpisodes, activeTab === 'psir')
  }

  const addCustomEpisode = async () => {
    if (!currentEpisode.trim() || !activeSubject) return
    
    const subject = subjects.find(s => s.id === activeSubject)
    if (!subject) return
    
    // Get next episode number
    const nextEpisodeNum = subject.lessonCount + 1
    
    // Add the episode with custom name as metadata
    const episodeKey = `${activeSubject}-${nextEpisodeNum}`
    const newEpisodes = { 
      ...episodes, 
      [episodeKey]: 'not-started', // Start as not-started
      [`${episodeKey}-name`]: currentEpisode.trim() // Store custom name
    }
    await saveEpisodes(newEpisodes)
    
    // Increase lesson count for this subject
    const updatedSubjects = subjects.map(s => 
      s.id === activeSubject ? { ...s, lessonCount: nextEpisodeNum } : s
    )
    await saveSubjects(updatedSubjects)
    
    setCurrentEpisode('')
    setActiveSubject(null)
  }

  const getEpisodeStatus = (subject, episodeNum) => {
    const key = `${subject}-${episodeNum}`
    const currentEpisodes = getCurrentEpisodes()
    return currentEpisodes[key] || 'not-started'
  }
  
  const getEpisodeName = (subject, episodeNum) => {
    const nameKey = `${subject}-${episodeNum}-name`
    const currentEpisodes = getCurrentEpisodes()
    return currentEpisodes[nameKey] || null
  }
  
  const getStatusLabel = (status) => {
    if (status === 'not-started') return 'Not Started'
    if (status === 'reading') return 'Reading'
    if (status === 'revision') return 'Revision'
    if (status === 'mastered') return 'Mastered'
    return 'Not Started'
  }

  const getSubjectProgress = (subjectIds) => {
    let score = 0
    let total = 0
    const currentSubjects = getCurrentSubjects()
    
    subjectIds.forEach(subjectId => {
      const subject = currentSubjects.find(s => s.id === subjectId)
      const lessonCount = subject ? subject.lessonCount : 10
      
      for (let i = 1; i <= lessonCount; i++) {
        const status = getEpisodeStatus(subjectId, i)
        // Weighted scoring: not-started=0, reading=25, revision=75, mastered=100
        if (status === 'reading') score += 0.25
        else if (status === 'revision') score += 0.75
        else if (status === 'mastered') score += 1
        total++
      }
    })
    
    return total > 0 ? Math.round((score / total) * 100) : 0
  }

  const getSingleSubjectProgress = (subjectId) => {
    const currentSubjects = getCurrentSubjects()
    const subject = currentSubjects.find(s => s.id === subjectId)
    const lessonCount = subject ? subject.lessonCount : 10
    let score = 0
    let mastered = 0
    let revision = 0
    let reading = 0
    
    for (let i = 1; i <= lessonCount; i++) {
      const status = getEpisodeStatus(subjectId, i)
      if (status === 'mastered') { score += 1; mastered++ }
      else if (status === 'revision') { score += 0.75; revision++ }
      else if (status === 'reading') { score += 0.25; reading++ }
    }
    
    return { 
      score, 
      total: lessonCount, 
      percentage: lessonCount > 0 ? Math.round((score / lessonCount) * 100) : 0,
      mastered,
      revision,
      reading,
      notStarted: lessonCount - mastered - revision - reading
    }
  }
  
  const getStatusBreakdown = (subjectId) => {
    const progress = getSingleSubjectProgress(subjectId)
    const parts = []
    if (progress.mastered > 0) parts.push(`${progress.mastered} mastered`)
    if (progress.revision > 0) parts.push(`${progress.revision} revision`)
    if (progress.reading > 0) parts.push(`${progress.reading} reading`)
    if (progress.notStarted > 0) parts.push(`${progress.notStarted} not started`)
    return parts.join(' • ') || 'Not started'
  }

  // Status colors for syllabus coverage
  const getStatusColor = (status) => {
    if (status === 'mastered') return 'bg-emerald-500 text-white shadow-md border-emerald-600'
    if (status === 'revision') return 'bg-amber-500 text-white shadow-md border-amber-600'
    if (status === 'reading') return 'bg-blue-500 text-white shadow-md border-blue-600'
    return 'bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-400'
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Calculate stats for each status
  const getStatusStats = (subjectIds, targetStatus) => {
    let count = 0
    let total = 0
    const currentSubjects = getCurrentSubjects()
    
    subjectIds.forEach(subjectId => {
      const subject = currentSubjects.find(s => s.id === subjectId)
      const lessonCount = subject ? subject.lessonCount : 10
      
      for (let i = 1; i <= lessonCount; i++) {
        const status = getEpisodeStatus(subjectId, i)
        if (status === targetStatus) count++
        total++
      }
    })
    
    return { count, total, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }
  }

  // Not Started stats
  const notStartedCore4 = getStatusStats(core4Ids, 'not-started')
  const notStartedAll = getStatusStats(allSubjectIds, 'not-started')
  
  // Reading stats
  const readingCore4 = getStatusStats(core4Ids, 'reading')
  const readingAll = getStatusStats(allSubjectIds, 'reading')
  
  // Revision stats
  const revisionCore4 = getStatusStats(core4Ids, 'revision')
  const revisionAll = getStatusStats(allSubjectIds, 'revision')
  
  // Mastered stats
  const masteredCore4 = getStatusStats(core4Ids, 'mastered')
  const masteredAll = getStatusStats(allSubjectIds, 'mastered')

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl mx-auto modal-enter max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-indigo-500 to-blue-500 rounded-t-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Misfits Episodes Tracker
              </h2>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white text-3xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex gap-2 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('gs')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'gs' 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                GS Subjects
              </button>
              <button
                onClick={() => setActiveTab('psir')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  activeTab === 'psir' 
                    ? 'bg-white text-purple-600 shadow-md' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                PSIR Seasons
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Progress Dashboard - 6 Status Bars */}
            <div className="space-y-3">
              {/* Not Started (0%) Section */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded bg-slate-400 text-white flex items-center justify-center text-xs font-bold">-</span>
                  <h3 className="font-bold text-slate-900 text-sm">Not Started (0%)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-700">GS Paper 1 (4 Core)</span>
                      <span className="text-sm font-bold text-slate-600">{notStartedCore4.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${notStartedCore4.percentage}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {notStartedCore4.count} / {notStartedCore4.total} topics
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-700">All GS Subjects</span>
                      <span className="text-sm font-bold text-slate-600">{notStartedAll.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400" style={{ width: `${notStartedAll.percentage}%` }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {notStartedAll.count} / {notStartedAll.total} topics
                    </div>
                  </div>
                </div>
              </div>

              {/* Reading (25%) Section */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs font-bold">Rd</span>
                  <h3 className="font-bold text-blue-900 text-sm">Reading (25%)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-blue-700">GS Paper 1 (4 Core)</span>
                      <span className="text-sm font-bold text-blue-600">{readingCore4.percentage}%</span>
                    </div>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${readingCore4.percentage}%` }} />
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {readingCore4.count} / {readingCore4.total} topics
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-blue-700">All GS Subjects</span>
                      <span className="text-sm font-bold text-blue-600">{readingAll.percentage}%</span>
                    </div>
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${readingAll.percentage}%` }} />
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {readingAll.count} / {readingAll.total} topics
                    </div>
                  </div>
                </div>
              </div>

              {/* Revision (75%) Section */}
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-bold">R</span>
                  <h3 className="font-bold text-amber-900 text-sm">Revision (75%)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-amber-700">GS Paper 1 (4 Core)</span>
                      <span className="text-sm font-bold text-amber-600">{revisionCore4.percentage}%</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${revisionCore4.percentage}%` }} />
                    </div>
                    <div className="text-xs text-amber-500 mt-1">
                      {revisionCore4.count} / {revisionCore4.total} topics
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-amber-700">All GS Subjects</span>
                      <span className="text-sm font-bold text-amber-600">{revisionAll.percentage}%</span>
                    </div>
                    <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${revisionAll.percentage}%` }} />
                    </div>
                    <div className="text-xs text-amber-500 mt-1">
                      {revisionAll.count} / {revisionAll.total} topics
                    </div>
                  </div>
                </div>
              </div>

              {/* Mastered (100%) Section */}
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">M</span>
                  <h3 className="font-bold text-emerald-900 text-sm">Mastered (100%)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-emerald-700">GS Paper 1 (4 Core)</span>
                      <span className="text-sm font-bold text-emerald-600">{masteredCore4.percentage}%</span>
                    </div>
                    <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${masteredCore4.percentage}%` }} />
                    </div>
                    <div className="text-xs text-emerald-500 mt-1">
                      {masteredCore4.count} / {masteredCore4.total} topics
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-emerald-700">All GS Subjects</span>
                      <span className="text-sm font-bold text-emerald-600">{masteredAll.percentage}%</span>
                    </div>
                    <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${masteredAll.percentage}%` }} />
                    </div>
                    <div className="text-xs text-emerald-500 mt-1">
                      {masteredAll.count} / {masteredAll.total} topics
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.map(subject => {
                const subjectProgress = getSubjectProgress([subject.id])
                
                return (
                  <div key={subject.id} className="border rounded-xl overflow-hidden flex flex-col">
                    {/* Subject Header */}
                    <div className={`${subject.color} text-white p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{subject.name}</h4>
                          <span className="text-xs opacity-90">{getStatusBreakdown(subject.id)}</span>
                        </div>
                        <span className="text-lg font-bold opacity-90">{subjectProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-500"
                          style={{ width: `${subjectProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Subject Actions (Edit/Delete) - available for all subjects */}
                    <div className="p-2 bg-gray-100 border-b flex gap-1">
                      <button
                        onClick={() => {
                          setEditingSubject(subject.id)
                          setEditEpisodeCount(subject.lessonCount)
                          setEditSubjectName(subject.name)
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSubject(subject.id)}
                        className="flex-1 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Episodes Grid */}
                    <div className="p-3 bg-gray-50 flex-1 flex flex-col">
                      {editingSubject === subject.id ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-gray-700">
                              Subject Name:
                            </label>
                            <input
                              type="text"
                              value={editSubjectName}
                              onChange={(e) => setEditSubjectName(e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded mt-1"
                              placeholder="Enter subject name..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-700">
                              Number of Topics/Lessons:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={editEpisodeCount}
                              onChange={(e) => setEditEpisodeCount(parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 text-xs border rounded mt-1"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => editSubjectDetails(subject.id, editSubjectName, editEpisodeCount)}
                              className="flex-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSubject(null)}
                              className="flex-1 px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div 
                            className="grid gap-1 max-h-48 overflow-y-auto scrollbar-thin"
                            style={{ 
                              gridTemplateColumns: `repeat(${Math.min(5, Math.ceil(Math.sqrt(subject.lessonCount)))}, minmax(0, 1fr))`
                            }}
                          >
                            {Array.from({ length: subject.lessonCount }, (_, i) => i + 1).map(episodeNum => {
                              const status = getEpisodeStatus(subject.id, episodeNum)
                              const customName = getEpisodeName(subject.id, episodeNum)
                              const tooltipText = customName 
                                ? `Topic ${episodeNum}: "${customName}" - ${getStatusLabel(status)}`
                                : `Topic ${episodeNum}: ${getStatusLabel(status)}`
                              return (
                                <button
                                  key={episodeNum}
                                  onClick={() => toggleEpisodeStatus(subject.id, episodeNum)}
                                  className={`
                                    aspect-square flex items-center justify-center text-xs rounded
                                    border transition-all hover:scale-110
                                    ${getStatusColor(status)}
                                  `}
                                  title={tooltipText}
                                >
                                  {episodeNum}
                                </button>
                              )
                            })}
                          </div>

                          {/* Add Custom Episode */}
                          {activeSubject === subject.id ? (
                            <div className="mt-3 flex gap-2">
                              <input
                                type="text"
                                placeholder="Episode name..."
                                value={currentEpisode}
                                onChange={(e) => setCurrentEpisode(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addCustomEpisode()}
                                className="flex-1 px-2 py-1 text-sm border rounded"
                                autoFocus
                              />
                              <button
                                onClick={addCustomEpisode}
                                className="px-2 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => setActiveSubject(null)}
                                className="px-2 py-1 bg-gray-300 text-gray-700 text-sm rounded"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setActiveSubject(subject.id)}
                              className={`mt-auto pt-2 w-full py-1.5 text-xs font-medium rounded ${subject.lightColor} ${subject.textColor} hover:opacity-80 transition-opacity`}
                            >
                              + Add Custom Episode
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Add New Subject Card */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-64 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer" onClick={() => setShowAddSubjectForm(true)}>
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-semibold text-gray-600 text-center">Add New Subject</p>
                <p className="text-xs text-gray-500 mt-1 text-center">Click to add a custom subject</p>
              </div>
            </div>

            {/* Add Subject Form Modal */}
            {showAddSubjectForm && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-bold text-blue-900">Add New Subject</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Modern History, Constitution, etc."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addNewSubject()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Episodes/Lessons</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newSubjectEpisodes}
                    onChange={(e) => setNewSubjectEpisodes(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addNewSubject}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Subject
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubjectForm(false)
                      setNewSubjectName('')
                      setNewSubjectEpisodes(10)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">M</span>
                <span className="text-slate-600">Mastered (100%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">R</span>
                <span className="text-slate-600">Revision (75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">Rd</span>
                <span className="text-slate-600">Reading (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded border-2 border-slate-300 bg-white"></span>
                <span className="text-slate-600">Not Started</span>
              </div>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Click any topic to cycle through: Not Started → Reading → Revision → Mastered
            </p>

            {/* Close Button */}
            <div className="flex justify-center pt-4 border-t">
              <button 
                onClick={onClose}
                className="btn-primary px-8"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MisfitsModal
