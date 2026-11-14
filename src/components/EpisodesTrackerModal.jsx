import { useEffect, useState } from 'react'
import storage from '../utils/fileStorage.js'
import { emit, EVENTS } from '../utils/events.js'
import pyqPapersData from '../data/pyq-papers-data.json'
import { useAppBackHandler } from '../utils/backNavigation.js'

const GS_SUBJECTS = [
  { id: 'history', name: 'History (Ancient, Medieval, Modern)', lessonCount: 61, color: 'bg-violet-500', lightColor: 'bg-violet-100', textColor: 'text-violet-700', itemType: 'Episode', isDefault: true },
  { id: 'eco', name: 'Fundamentals of Economics', lessonCount: 39, color: 'bg-amber-500', lightColor: 'bg-amber-100', textColor: 'text-amber-700', itemType: 'Episode', isDefault: true },
  { id: 'ethics', name: 'Ethics, Life, and beyond (for Mains)', lessonCount: 47, color: 'bg-rose-500', lightColor: 'bg-rose-100', textColor: 'text-rose-700', itemType: 'Episode', isDefault: true },
  { id: 'geo', name: 'Geography, Disaster Management, Env, S&T', lessonCount: 48, color: 'bg-emerald-500', lightColor: 'bg-emerald-100', textColor: 'text-emerald-700', itemType: 'Episode', isDefault: true },
  { id: 'env', name: 'Environment & Climate Change', lessonCount: 34, color: 'bg-cyan-500', lightColor: 'bg-cyan-100', textColor: 'text-cyan-700', itemType: 'Episode', isDefault: true },
  { id: 'polity', name: 'Polity, Governance, & Society', lessonCount: 71, color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', itemType: 'Episode', isDefault: true },
  { id: 'scitech', name: 'Science, Tech and Innovation', lessonCount: 21, color: 'bg-fuchsia-500', lightColor: 'bg-fuchsia-100', textColor: 'text-fuchsia-700', itemType: 'Episode', isDefault: true },
  { id: 'essay', name: 'Essay (Mains Module)', lessonCount: 6, color: 'bg-lime-500', lightColor: 'bg-lime-100', textColor: 'text-lime-700', itemType: 'Episode', isDefault: true }
]

const PSIR_SEASONS = [
  { id: 'season1', name: 'Season 1: Western Political Thinkers (Paper 1)', lessonCount: 33, color: 'bg-indigo-500', lightColor: 'bg-indigo-100', textColor: 'text-indigo-700', itemType: 'Episode', isDefault: true },
  { id: 'season2', name: 'Season 2: Indian Political Thinkers (Paper 1)', lessonCount: 13, color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', itemType: 'Episode', isDefault: true },
  { id: 'watch_before_s3', name: 'Watch Before Season 3: PSIR Mains 2024 (Magic at MisFits)', lessonCount: 1, color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700', itemType: 'Episode', isDefault: true },
  { id: 'season3', name: 'Season 3: Political Ideologies (Paper 1)', lessonCount: 12, color: 'bg-pink-500', lightColor: 'bg-pink-100', textColor: 'text-pink-700', itemType: 'Episode', isDefault: true },
  { id: 'season4', name: 'Season 4: Miscellaneous Mind (Political Theory, Justice, etc)', lessonCount: 12, color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', itemType: 'Episode', isDefault: true },
  { id: 'season5', name: 'Season 5: International Relations & the World', lessonCount: 22, color: 'bg-yellow-500', lightColor: 'bg-yellow-100', textColor: 'text-yellow-700', itemType: 'Episode', isDefault: true },
  { id: 'season6', name: 'Season 6: India and the World', lessonCount: 13, color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', itemType: 'Episode', isDefault: true },
  { id: 'season7', name: 'Season 7 (Finale): Politics, Politics, and Politics', lessonCount: 19, color: 'bg-teal-500', lightColor: 'bg-teal-100', textColor: 'text-teal-700', itemType: 'Episode', isDefault: true }
]

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

const DEFAULTS = {
  gs: GS_SUBJECTS,
  psir: PSIR_SEASONS,
  pyq: pyqPapersData.map((year, index) => ({
    id: year.year,
    name: `PYQ ${year.year}`,
    paperCount: year.paperCount,
    itemType: 'Paper',
    color: COLORS[index % COLORS.length].bg,
    lightColor: COLORS[index % COLORS.length].light,
    textColor: COLORS[index % COLORS.length].text,
    isDefault: true,
    papers: year.papers
  })),
  mock: []
}

const CATEGORY_STORAGE = {
  gs: ['getCustomMisfitsSubjects', 'saveCustomMisfitsSubjects'],
  psir: ['getCustomPSIRSeasons', 'saveCustomPSIRSeasons'],
  pyq: ['getCustomPYQYears', 'saveCustomPYQYears'],
  mock: ['getCustomMockTests', 'saveCustomMockTests']
}

const STATUS_STORAGE = {
  gs: ['getMisfitsEpisodes', 'saveMisfitsEpisodes'],
  psir: ['getPSIREpisodes', 'savePSIREpisodes'],
  pyq: ['getPYQEpisodes', 'savePYQEpisodes'],
  mock: ['getMockEpisodes', 'saveMockEpisodes']
}

const TAB_DETAILS = {
  gs: { title: 'Misfits GS', addLabel: 'Add New Subject', itemType: 'Episode' },
  psir: { title: 'PSIR', addLabel: 'Add New Season', itemType: 'Episode' },
  pyq: { title: "PYQ's", addLabel: 'Add New Paper Set', itemType: 'Paper' },
  mock: { title: 'Mock Tests', addLabel: 'Add New Mock Test', itemType: 'Paper' }
}

const DEFAULT_SECTIONS = Object.entries(TAB_DETAILS).map(([id, details]) => ({
  id,
  title: details.title,
  itemType: details.itemType,
  isDefault: true
}))

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getItems = (category, tab) => {
  if (Array.isArray(category.items)) return category.items
  if (tab === 'pyq' && Array.isArray(category.papers)) {
    return category.papers.map(paper => ({ ...paper, name: paper.name || `Paper ${paper.id}` }))
  }
  const count = tab === 'gs' || tab === 'psir'
    ? category.lessonCount || 0
    : category.paperCount || 0
  const itemType = category.itemType || TAB_DETAILS[tab]?.itemType || 'Item'
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `${itemType} ${index + 1}`
  }))
}

const getItemKey = (tab, category, item) => {
  if (tab === 'pyq') return item.statusKey || String(item.id)
  return `${category.id}-${item.id}`
}

const mergeCategories = (defaults, saved = []) => {
  const savedById = new Map(saved.map(category => [category.id, category]))
  const merged = defaults
    .map(category => {
      const savedCategory = savedById.get(category.id)
      if (!savedCategory) return category
      savedById.delete(category.id)
      if (savedCategory.deleted) return null
      return { ...category, ...savedCategory, isDefault: true }
    })
    .filter(Boolean)

  savedById.forEach(category => {
    if (!category.deleted) merged.push({ ...category, isDefault: false })
  })
  return merged
}

const sameCategory = (category, defaultCategory) => {
  const current = { ...category }
  const original = { ...defaultCategory }
  delete current.isDefault
  delete original.isDefault
  return JSON.stringify(current) === JSON.stringify(original)
}

function EpisodesTrackerModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('gs')
  const [isEditMode, setIsEditMode] = useState(false)
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const [categories, setCategories] = useState(DEFAULTS)
  const [episodes, setEpisodes] = useState({ gs: {}, psir: {}, pyq: {}, mock: {} })
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionItemType, setNewSectionItemType] = useState('Episode')
  const [editingSection, setEditingSection] = useState(null)
  const [editSectionName, setEditSectionName] = useState('')
  const [editSectionItemType, setEditSectionItemType] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItemType, setNewItemType] = useState('Episode')
  const [initialItemCount, setInitialItemCount] = useState(0)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editItemType, setEditItemType] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [editItemName, setEditItemName] = useState('')
  const [newItemNames, setNewItemNames] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  useAppBackHandler(() => {
    if (deleteConfirm) setDeleteConfirm(null)
    else onClose()
    return true
  }, true, 10)

  useEffect(() => {
    loadData().catch(error => {
      console.error('Failed to load episode tracker data:', error)
      setErrorMessage('Could not load tracker data. Please close and reopen the tracker.')
    })
  }, [])

  const loadData = async () => {
    const categoryData = {}
    const statusData = {}
    const allData = await storage.getAll()
    const savedSections = Array.isArray(allData.episodeTrackerSections) ? allData.episodeTrackerSections : []
    await Promise.all(Object.keys(DEFAULTS).map(async tab => {
      const [categoryGetter, statusGetter] = [CATEGORY_STORAGE[tab][0], STATUS_STORAGE[tab][0]]
      categoryData[tab] = await storage[categoryGetter]?.() || []
      statusData[tab] = await storage[statusGetter]?.() || {}
    }))

    Object.entries(statusData.gs).forEach(([key, status]) => {
      if (status === 'completed') statusData.gs[key] = 'mastered'
      else if (status === 'wrong') statusData.gs[key] = 'revision'
      else if (status === 'none' || status === undefined) statusData.gs[key] = 'not-started'
    })

    const sectionById = new Map(savedSections.map(section => [section.id, section]))
    const activeDefaultSections = DEFAULT_SECTIONS.flatMap(section => {
      const saved = sectionById.get(section.id)
      if (saved?.deleted) return []
      sectionById.delete(section.id)
      return [{ ...section, ...(saved || {}) }]
    })
    const customSections = savedSections.filter(section => !section.isDefault && !section.deleted)
    const nextCategories = Object.fromEntries(
      Object.keys(DEFAULTS).map(tab => [tab, mergeCategories(DEFAULTS[tab], categoryData[tab])])
    )
    const nextEpisodes = { ...statusData }
    customSections.forEach(section => {
      nextCategories[section.id] = Array.isArray(section.categories) ? section.categories : []
      nextEpisodes[section.id] = section.episodes || {}
    })
    setSections([...activeDefaultSections, ...customSections])
    setCategories(nextCategories)
    setEpisodes(nextEpisodes)
    if (!activeDefaultSections.some(section => section.id === activeTab)) {
      setActiveTab(activeDefaultSections[0]?.id || customSections[0]?.id || 'gs')
    }
  }

  const saveSectionConfig = async (updatedSections) => {
    const allData = await storage.getAll()
    const configById = new Map(updatedSections.map(section => [section.id, section]))
    ;(allData.episodeTrackerSections || []).forEach(section => {
      if (section.deleted && !configById.has(section.id)) {
        configById.set(section.id, section)
      }
    })
    allData.episodeTrackerSections = [...configById.values()]
    await storage.saveAll(allData)
  }

  const saveCategories = async (tab, updated) => {
    if (CATEGORY_STORAGE[tab]) {
      const defaultById = new Map(DEFAULTS[tab].map(category => [category.id, category]))
      const updatedIds = new Set(updated.map(category => category.id))
      const saved = updated.filter(category => {
        if (!category.isDefault) return true
        return !sameCategory(category, defaultById.get(category.id))
      })

      DEFAULTS[tab].forEach(category => {
        if (!updatedIds.has(category.id)) saved.push({ id: category.id, deleted: true })
      })
      await storage[CATEGORY_STORAGE[tab][1]](saved)
    } else {
      const updatedSections = sections.map(section => section.id === tab
        ? { ...section, categories: updated }
        : section)
      await saveSectionConfig(updatedSections)
      setSections(updatedSections)
    }
    setCategories(previous => ({ ...previous, [tab]: updated }))
    emit(EVENTS.MISFITS_UPDATED, { [tab]: updated })
  }

  const saveEpisodes = async (tab, updated) => {
    if (STATUS_STORAGE[tab]) {
      await storage[STATUS_STORAGE[tab][1]](updated)
    } else {
      const updatedSections = sections.map(section => section.id === tab
        ? { ...section, episodes: updated }
        : section)
      await saveSectionConfig(updatedSections)
      setSections(updatedSections)
    }
    setEpisodes(previous => ({ ...previous, [tab]: updated }))
    emit(EVENTS.MISFITS_UPDATED, { [tab]: updated })
  }

  const addSection = async (event) => {
    event.preventDefault()
    if (!newSectionName.trim() || !newSectionItemType.trim()) return
    const section = {
      id: createId('section'),
      title: newSectionName.trim(),
      itemType: newSectionItemType.trim(),
      isDefault: false,
      categories: [],
      episodes: {}
    }
    const updatedSections = [...sections, section]
    try {
      await saveSectionConfig(updatedSections)
      setSections(updatedSections)
      setCategories(previous => ({ ...previous, [section.id]: [] }))
      setEpisodes(previous => ({ ...previous, [section.id]: {} }))
      setActiveTab(section.id)
      setShowSectionForm(false)
      setNewSectionName('')
      setNewSectionItemType('Episode')
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to add tracker section:', error)
      setErrorMessage('Could not add this section. Please try again.')
    }
  }

  const saveSectionEdit = async () => {
    if (!editSectionName.trim() || !editSectionItemType.trim()) return
    const updatedSections = sections.map(section => section.id === editingSection
      ? { ...section, title: editSectionName.trim(), itemType: editSectionItemType.trim() }
      : section)
    try {
      await saveSectionConfig(updatedSections)
      setSections(updatedSections)
      if (activeTab === editingSection) setNewItemType(editSectionItemType.trim())
      setEditingSection(null)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to edit tracker section:', error)
      setErrorMessage('Could not update this section. Please try again.')
    }
  }

  const getProgress = (tab, category) => {
    const items = getItems(category, tab)
    const counts = { mastered: 0, revision: 0, reading: 0, notStarted: 0 }
    items.forEach(item => {
      const status = episodes[tab][getItemKey(tab, category, item)] || 'not-started'
      if (status === 'mastered') counts.mastered += 1
      else if (status === 'revision') counts.revision += 1
      else if (status === 'reading') counts.reading += 1
      else counts.notStarted += 1
    })
    const score = counts.mastered + counts.revision * 0.75 + counts.reading * 0.25
    return {
      ...counts,
      total: items.length,
      percentage: items.length ? Math.round((score / items.length) * 100) : 0
    }
  }

  const toggleItemStatus = async (category, item) => {
    const statusKey = getItemKey(activeTab, category, item)
    const currentStatus = episodes[activeTab][statusKey] || 'not-started'
    const nextStatus = {
      'not-started': 'reading',
      reading: 'revision',
      revision: 'mastered',
      mastered: 'not-started'
    }[currentStatus]
    try {
      await saveEpisodes(activeTab, { ...episodes[activeTab], [statusKey]: nextStatus })
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to update episode status:', error)
      setErrorMessage('Could not save this status change. Please try again.')
    }
  }

  const addCategory = async (event) => {
    event.preventDefault()
    if (!newCategoryName.trim() || !newItemType.trim()) return
    const color = COLORS[categories[activeTab].length % COLORS.length]
    const id = createId('custom')
    const items = Array.from({ length: initialItemCount }, (_, index) => ({
      id: activeTab === 'pyq' ? createId('paper') : index + 1,
      name: `${newItemType.trim()} ${index + 1}`
    }))
    const category = {
      id,
      name: newCategoryName.trim(),
      itemType: newItemType.trim(),
      items,
      lessonCount: items.length,
      paperCount: items.length,
      color: color.bg,
      lightColor: color.light,
      textColor: color.text,
      isDefault: false
    }
    try {
      await saveCategories(activeTab, [...categories[activeTab], category])
      setEpisodes(previous => ({ ...previous, [activeTab]: previous[activeTab] || {} }))
      setNewCategoryName('')
      setNewItemType(activeSection?.itemType || TAB_DETAILS[activeTab]?.itemType || 'Item')
      setInitialItemCount(0)
      setShowAddForm(false)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to add tracker category:', error)
      setErrorMessage('Could not add this card. Please try again.')
    }
  }

  const saveCategoryEdit = async (category) => {
    if (!editCategoryName.trim() || !editItemType.trim()) return
    const previousItemType = category.itemType || TAB_DETAILS[activeTab]?.itemType || 'Item'
    const items = getItems(category, activeTab).map((item, index) => (
      item.name === `${previousItemType} ${index + 1}`
        ? { ...item, name: `${editItemType.trim()} ${index + 1}` }
        : item
    ))
    const updatedCategory = {
      ...category,
      name: editCategoryName.trim(),
      itemType: editItemType.trim(),
      items,
      lessonCount: items.length,
      paperCount: items.length
    }
    try {
      await saveCategories(activeTab, categories[activeTab].map(item =>
        item.id === category.id ? updatedCategory : item
      ))
      setEditingCategory(null)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to edit tracker category:', error)
      setErrorMessage('Could not update this card. Please try again.')
    }
  }

  const addItem = async (category) => {
    const name = (newItemNames[category.id] || '').trim()
    if (!name) return
    const items = getItems(category, activeTab)
    const nextId = activeTab === 'pyq'
      ? createId('paper')
      : Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1
    const updatedItems = [...items, { id: nextId, name }]
    const updatedCategory = {
      ...category,
      items: updatedItems,
      lessonCount: updatedItems.length,
      paperCount: updatedItems.length
    }
    try {
      await saveCategories(activeTab, categories[activeTab].map(item =>
        item.id === category.id ? updatedCategory : item
      ))
      setNewItemNames(previous => ({ ...previous, [category.id]: '' }))
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to add tracker item:', error)
      setErrorMessage('Could not add this item. Please try again.')
    }
  }

  const saveItemEdit = async (category) => {
    if (!editItemName.trim()) return
    const items = getItems(category, activeTab).map(item =>
      item.id === editingItem.itemId ? { ...item, name: editItemName.trim() } : item
    )
    try {
      await saveCategories(activeTab, categories[activeTab].map(current =>
        current.id === category.id ? { ...current, items } : current
      ))
      setEditingItem(null)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to edit tracker item:', error)
      setErrorMessage('Could not update this item. Please try again.')
    }
  }

  const deleteCategory = async () => {
    const category = categories[activeTab].find(item => item.id === deleteConfirm.categoryId)
    if (!category) return
    const updatedCategories = categories[activeTab].filter(item => item.id !== category.id)
    const updatedEpisodes = { ...episodes[activeTab] }
    getItems(category, activeTab).forEach(item => {
      delete updatedEpisodes[getItemKey(activeTab, category, item)]
    })
    Object.keys(updatedEpisodes).forEach(key => {
      if (activeTab !== 'pyq' && key.startsWith(`${category.id}-`)) delete updatedEpisodes[key]
    })
    try {
      await saveCategories(activeTab, updatedCategories)
      await saveEpisodes(activeTab, updatedEpisodes)
      setDeleteConfirm(null)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to delete tracker category:', error)
      setErrorMessage('Could not delete this card. Please try again.')
    }
  }

  const deleteSection = async () => {
    const section = sections.find(item => item.id === deleteConfirm.sectionId)
    if (!section) return
    const updatedSections = section.isDefault
      ? sections.map(item => item.id === section.id ? { ...item, deleted: true } : item)
      : sections.filter(item => item.id !== section.id)
    try {
      await saveSectionConfig(updatedSections)

      if (CATEGORY_STORAGE[section.id]) {
        await storage[CATEGORY_STORAGE[section.id][1]](
          DEFAULTS[section.id].map(category => ({ id: category.id, deleted: true }))
        )
        await storage[STATUS_STORAGE[section.id][1]]({})
      }

      setSections(updatedSections.filter(item => !item.deleted))
      setCategories(previous => ({ ...previous, [section.id]: [] }))
      setEpisodes(previous => ({ ...previous, [section.id]: {} }))
      if (activeTab === section.id) {
        const nextSection = sections.find(item => item.id !== section.id && !item.deleted)
        if (nextSection) setActiveTab(nextSection.id)
      }
      setDeleteConfirm(null)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to delete tracker section:', error)
      setErrorMessage('Could not delete this section. Please try again.')
    }
  }

  const deleteItem = async (category, item) => {
    const oldItems = getItems(category, activeTab)
    const remainingItems = oldItems.filter(current => current.id !== item.id)
    let updatedItems = remainingItems
    const updatedEpisodes = { ...episodes[activeTab] }

    if (activeTab === 'pyq') {
      delete updatedEpisodes[getItemKey(activeTab, category, item)]
    } else {
      const oldKeys = new Set(oldItems.map(current => getItemKey(activeTab, category, current)))
      const oldStatusById = new Map(oldItems.map(current => [
        String(current.id),
        updatedEpisodes[getItemKey(activeTab, category, current)]
      ]))
      oldKeys.forEach(key => delete updatedEpisodes[key])
      updatedItems = remainingItems.map((current, index) => {
        const updatedItem = { ...current, id: index + 1 }
        const status = oldStatusById.get(String(current.id))
        if (status) updatedEpisodes[getItemKey(activeTab, category, updatedItem)] = status
        return updatedItem
      })
    }

    const updatedCategory = {
      ...category,
      items: updatedItems,
      lessonCount: updatedItems.length,
      paperCount: updatedItems.length
    }
    try {
      await saveCategories(activeTab, categories[activeTab].map(current =>
        current.id === category.id ? updatedCategory : current
      ))
      await saveEpisodes(activeTab, updatedEpisodes)
      setErrorMessage('')
    } catch (error) {
      console.error('Failed to delete tracker item:', error)
      setErrorMessage('Could not delete this item. Please try again.')
    }
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose()
  }

  const toggleEditMode = () => {
    if (isEditMode) {
      setEditingSection(null)
      setShowSectionForm(false)
      setShowAddForm(false)
      setEditingCategory(null)
      setEditingItem(null)
      setDeleteConfirm(null)
    }
    setIsEditMode(!isEditMode)
  }

  const activeSection = sections.find(section => section.id === activeTab)
  const tabDetails = {
    title: activeSection?.title || 'Tracker',
    addLabel: TAB_DETAILS[activeTab]?.addLabel || `Add New ${activeSection?.title || 'Card'}`,
    itemType: activeSection?.itemType || 'Item'
  }
  const allItems = categories[activeTab].flatMap(category =>
    getItems(category, activeTab).map(item => ({ category, item }))
  )
  const totalProgress = allItems.reduce((totals, { category, item }) => {
    const status = episodes[activeTab][getItemKey(activeTab, category, item)] || 'not-started'
    totals[status] = (totals[status] || 0) + 1
    return totals
  }, { 'not-started': 0, reading: 0, revision: 0, mastered: 0 })

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 animate-fade-in safe-area-top safe-area-bottom"
      onClick={handleBackdropClick}
    >
      <div className="min-h-dvh p-0 pb-safe sm:min-h-0 sm:p-4">
        <div className="mx-auto min-h-dvh max-w-7xl overflow-hidden rounded-none bg-white shadow-2xl sm:my-8 sm:min-h-0 sm:rounded-xl">
          <div className="rounded-t-xl bg-gradient-to-r from-indigo-500 to-blue-500 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-3 text-lg font-bold text-white sm:text-2xl">
                <span aria-hidden="true">☑</span>
                Episodes Tracker
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleEditMode}
                  aria-pressed={isEditMode}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    isEditMode ? 'bg-white text-indigo-700' : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {isEditMode ? 'Done' : 'Edit'}
                </button>
                <button onClick={onClose} aria-label="Close episodes tracker" className="p-1 text-3xl font-bold text-white/80 hover:text-white">×</button>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {sections.filter(section => !section.deleted).map(section => (
                <div key={section.id} className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 p-1">
                  <button
                    onClick={() => {
                      setActiveTab(section.id)
                      setShowAddForm(false)
                      setNewItemType(section.itemType || 'Item')
                      setEditingSection(null)
                    }}
                    className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-all sm:px-5 sm:text-base ${
                      activeTab === section.id ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/20'
                    }`}
                  >
                    {section.title}
                  </button>
                  {isEditMode && <button
                    onClick={() => {
                      setEditingSection(section.id)
                      setEditSectionName(section.title)
                      setEditSectionItemType(section.itemType || 'Item')
                    }}
                    aria-label={`Edit ${section.title} section`}
                    title="Edit section"
                    className="rounded px-1.5 py-1 text-xs text-white/80 hover:bg-white/20 hover:text-white"
                  >
                    ✎
                  </button>}
                  {isEditMode && <button
                    onClick={() => setDeleteConfirm({ sectionId: section.id })}
                    aria-label={`Delete ${section.title} section`}
                    title="Delete section"
                    className="rounded px-1.5 py-1 text-sm font-bold text-white/80 hover:bg-red-500/70 hover:text-white"
                  >
                    ×
                  </button>}
                </div>
              ))}
              {isEditMode && <button
                onClick={() => {
                  setShowSectionForm(value => !value)
                  setEditingSection(null)
                }}
                className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                + Add section
              </button>}
            </div>
          </div>

          <div className="space-y-5 p-3 sm:p-6">
            {errorMessage && (
              <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            {isEditMode && editingSection && (
              <div className="grid gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  Section name
                  <input value={editSectionName} onChange={event => setEditSectionName(event.target.value)} className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Items in this section are called
                  <input value={editSectionItemType} onChange={event => setEditSectionItemType(event.target.value)} className="mt-1 w-full rounded-lg border border-indigo-300 bg-white px-3 py-2" />
                </label>
                <div className="flex items-end gap-2">
                  <button onClick={saveSectionEdit} className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600">Save section</button>
                  <button onClick={() => setEditingSection(null)} className="rounded-lg bg-slate-400 px-3 py-2 font-semibold text-white hover:bg-slate-500">Cancel</button>
                </div>
              </div>
            )}

            {isEditMode && showSectionForm && (
              <form onSubmit={addSection} className="grid gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-3">
                <label className="text-sm font-medium text-slate-700">
                  New section name
                  <input autoFocus value={newSectionName} onChange={event => setNewSectionName(event.target.value)} placeholder="e.g. Optional Subject" className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Items are called
                  <input value={newSectionItemType} onChange={event => setNewSectionItemType(event.target.value)} placeholder="e.g. Episode, Paper, Test" className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2" required />
                </label>
                <div className="flex items-end gap-2">
                  <button type="submit" className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600">Create section</button>
                  <button type="button" onClick={() => setShowSectionForm(false)} className="rounded-lg bg-slate-400 px-3 py-2 font-semibold text-white hover:bg-slate-500">Cancel</button>
                </div>
              </form>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium sm:text-sm">
                <span className="text-slate-600">{allItems.length} {allItems.length === 1 ? 'item' : 'items'}</span>
                <span className="text-blue-700">{totalProgress.reading || 0} reading</span>
                <span className="text-amber-700">{totalProgress.revision || 0} revision</span>
                <span className="text-emerald-700">{totalProgress.mastered || 0} mastered</span>
                <span className="text-slate-500">{totalProgress['not-started'] || 0} not started</span>
              </div>
              {isEditMode && <button
                onClick={() => {
                  setShowAddForm(value => !value)
                  setNewItemType(tabDetails.itemType)
                }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                + {tabDetails.addLabel}
              </button>}
            </div>

            {isEditMode && showAddForm && (
              <form onSubmit={addCategory} className="grid gap-3 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-medium text-slate-700">
                  Card name
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={event => setNewCategoryName(event.target.value)}
                    placeholder="e.g. Modern History"
                    className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Items inside this card are called
                  <input
                    value={newItemType}
                    onChange={event => setNewItemType(event.target.value)}
                    placeholder="e.g. Episode, Paper, Season"
                    className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2"
                    required
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Create initial items
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={initialItemCount}
                    onChange={event => setInitialItemCount(Math.max(0, Math.min(500, Number(event.target.value) || 0)))}
                    className="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button type="submit" className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 font-semibold text-white hover:bg-emerald-600">Create card</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="rounded-lg bg-slate-400 px-3 py-2 font-semibold text-white hover:bg-slate-500">Cancel</button>
                </div>
              </form>
            )}

            {categories[activeTab].length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-10 text-center text-slate-500">
                {isEditMode ? 'No cards yet. Add one to start tracking.' : 'No cards yet. Select Edit to add one.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categories[activeTab].map(category => {
                  const items = getItems(category, activeTab)
                  const progress = getProgress(activeTab, category)
                  const isEditing = isEditMode && editingCategory === category.id
                  return (
                    <section key={category.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <div className={`${category.color || 'bg-indigo-500'} p-3 text-white`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="break-words font-semibold">{category.name}</h3>
                            <p className="mt-1 text-xs opacity-90">
                              {progress.percentage}% · {progress.total} {category.itemType || tabDetails.itemType}{progress.total === 1 ? '' : 's'}
                            </p>
                          </div>
                          {isEditMode && <button
                            onClick={() => setDeleteConfirm({ categoryId: category.id })}
                            aria-label={`Delete ${category.name}`}
                            title="Delete card"
                            className="rounded px-2 text-lg font-bold text-white/80 hover:bg-black/15 hover:text-white"
                          >
                            ×
                          </button>}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                        <p className="mt-1 text-xs opacity-90">
                          {progress.mastered} mastered · {progress.revision} revision · {progress.reading} reading · {progress.notStarted} not started
                        </p>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3 bg-yellow-50 p-3">
                          <label className="block text-xs font-semibold text-slate-700">
                            Card name
                            <input value={editCategoryName} onChange={event => setEditCategoryName(event.target.value)} className="mt-1 w-full rounded border border-yellow-300 px-2 py-2" />
                          </label>
                          <label className="block text-xs font-semibold text-slate-700">
                            Item type
                            <input value={editItemType} onChange={event => setEditItemType(event.target.value)} className="mt-1 w-full rounded border border-yellow-300 px-2 py-2" />
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => saveCategoryEdit(category)} className="flex-1 rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Save</button>
                            <button onClick={() => setEditingCategory(null)} className="flex-1 rounded bg-slate-400 px-3 py-2 text-sm font-semibold text-white">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-1 flex-col bg-slate-50 p-3">
                          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                            {items.map(item => {
                              const status = episodes[activeTab][getItemKey(activeTab, category, item)] || 'not-started'
                              const statusClass = status === 'mastered'
                                ? 'border-emerald-400 bg-emerald-500 text-white'
                                : status === 'revision'
                                  ? 'border-amber-400 bg-amber-500 text-white'
                                  : status === 'reading'
                                    ? 'border-blue-400 bg-blue-500 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                              const isEditingThisItem = isEditMode && editingItem?.categoryId === category.id && editingItem.itemId === item.id
                              return (
                                <div key={item.id} className="flex items-center gap-1">
                                  {isEditingThisItem ? (
                                    <>
                                      <input
                                        autoFocus
                                        value={editItemName}
                                        onChange={event => setEditItemName(event.target.value)}
                                        onKeyDown={event => {
                                          if (event.key === 'Enter') saveItemEdit(category)
                                          if (event.key === 'Escape') setEditingItem(null)
                                        }}
                                        className="min-w-0 flex-1 rounded border border-blue-300 px-2 py-2 text-sm"
                                      />
                                      <button onClick={() => saveItemEdit(category)} aria-label="Save item name" className="rounded bg-emerald-500 px-2 py-2 text-xs font-bold text-white">Save</button>
                                      <button onClick={() => setEditingItem(null)} aria-label="Cancel item edit" className="rounded bg-slate-400 px-2 py-2 text-xs font-bold text-white">×</button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        disabled={!isEditMode}
                                        onClick={() => toggleItemStatus(category, item)}
                                        title={`${item.name}: ${status.replace('-', ' ')}`}
                                        className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${statusClass} ${!isEditMode ? 'cursor-default' : ''}`}
                                      >
                                        <span className="block break-words">{item.name}</span>
                                        <span className="mt-0.5 block text-[10px] uppercase opacity-80">{status.replace('-', ' ')}</span>
                                      </button>
                                      {isEditMode && <button
                                        onClick={() => {
                                          setEditingItem({ categoryId: category.id, itemId: item.id })
                                          setEditItemName(item.name)
                                        }}
                                        aria-label={`Edit ${item.name}`}
                                        title="Edit item"
                                        className="rounded p-2 text-slate-500 hover:bg-blue-100 hover:text-blue-700"
                                      >
                                        ✎
                                      </button>}
                                      {isEditMode && <button
                                        onClick={() => setDeleteConfirm({ categoryId: category.id, item })}
                                        aria-label={`Delete ${item.name}`}
                                        title="Delete item"
                                        className="rounded p-2 text-slate-500 hover:bg-red-100 hover:text-red-700"
                                      >
                                        ×
                                      </button>}
                                    </>
                                  )}
                                </div>
                              )
                            })}
                            {items.length === 0 && <p className="py-4 text-center text-sm text-slate-500">No items yet.</p>}
                          </div>

                          {isEditMode && <form
                            className="mt-3 flex gap-2"
                            onSubmit={event => {
                              event.preventDefault()
                              addItem(category)
                            }}
                          >
                            <input
                              value={newItemNames[category.id] || ''}
                              onChange={event => setNewItemNames(previous => ({ ...previous, [category.id]: event.target.value }))}
                              placeholder={`New ${category.itemType || tabDetails.itemType} name`}
                              aria-label={`New item for ${category.name}`}
                              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm"
                            />
                            <button type="submit" className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600">Add</button>
                          </form>}

                          {isEditMode && <button
                            onClick={() => {
                              setEditingCategory(category.id)
                              setEditCategoryName(category.name)
                              setEditItemType(category.itemType || tabDetails.itemType)
                            }}
                            className="mt-2 w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                          >
                            Edit card
                          </button>}
                        </div>
                      )}
                    </section>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 border-t bg-slate-50 px-4 py-4 text-xs sm:text-sm">
            <span className="text-slate-500">{isEditMode ? 'Click an item to cycle its status:' : 'Viewing only · select Edit to change items or progress.'}</span>
            <span className="font-medium text-blue-700">Reading</span>
            <span className="font-medium text-amber-700">Revision</span>
            <span className="font-medium text-emerald-700">Mastered</span>
            <span className="font-medium text-slate-600">Not Started</span>
          </div>
          <div className="flex justify-center border-t p-4">
            <button onClick={onClose} className="rounded-lg bg-blue-500 px-8 py-2 font-semibold text-white hover:bg-blue-600">Close</button>
          </div>
        </div>
      </div>

      {isEditMode && deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-tracker-title" className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 id="delete-tracker-title" className="text-lg font-bold text-red-600">
              Delete {deleteConfirm.sectionId ? 'section' : deleteConfirm.item ? 'item' : 'card'}?
            </h3>
            <p className="my-3 text-sm text-slate-600">
              {deleteConfirm.sectionId
                ? `Delete "${sections.find(section => section.id === deleteConfirm.sectionId)?.title || 'this section'}" and all of its cards, items, and progress?`
                : deleteConfirm.item
                ? `Delete "${deleteConfirm.item.name}" and its progress?`
                : 'Delete this card and all of its items and progress?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (deleteConfirm.sectionId) {
                    deleteSection()
                  } else if (deleteConfirm.item) {
                    const category = categories[activeTab].find(item => item.id === deleteConfirm.categoryId)
                    if (category) deleteItem(category, deleteConfirm.item)
                    setDeleteConfirm(null)
                  } else {
                    deleteCategory()
                  }
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg bg-slate-400 px-4 py-2 font-semibold text-white hover:bg-slate-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EpisodesTrackerModal
