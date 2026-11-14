import { useCallback, useEffect, useMemo, useState } from 'react'
import { App } from '@capacitor/app'
import { registerPlugin } from '@capacitor/core'
import { useAppBackHandler } from '../utils/backNavigation.js'

const AppLimits = registerPlugin('AppLimits')

const formatUsage = (milliseconds) => {
  const minutes = Math.floor((milliseconds || 0) / 60000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}

function AppLimitsModal({ onClose }) {
  const [installedApps, setInstalledApps] = useState([])
  const [config, setConfig] = useState({ enabled: true, apps: [] })
  const [status, setStatus] = useState({ usageAccess: false, accessibilityEnabled: false })
  const [usageMillis, setUsageMillis] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(true)

  useAppBackHandler(() => {
    onClose()
    return true
  }, true, 10)

  const refresh = useCallback(async (loadSavedConfig = false) => {
    try {
      const [currentStatus, usageResult] = await Promise.all([
        AppLimits.getStatus(),
        AppLimits.getUsage()
      ])
      if (loadSavedConfig) {
        const [appsResult, savedConfig] = await Promise.all([
          AppLimits.getInstalledApps(),
          AppLimits.getConfig()
        ])
        setInstalledApps(appsResult.apps || [])
        setConfig({
          enabled: savedConfig.enabled !== false,
          apps: Array.isArray(savedConfig.apps) ? savedConfig.apps : []
        })
        setSaved(true)
      }
      setStatus(currentStatus)
      setUsageMillis(usageResult.usageMillis || {})
      setError('')
    } catch (loadError) {
      console.error('Unable to load Android app limits:', loadError)
      setError('App limits could not be loaded. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh(true)
    const intervalId = window.setInterval(() => refresh(), 5000)
    let appStateListener
    let mounted = true

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) refresh()
    }).then(listener => {
      if (mounted) appStateListener = listener
      else listener.remove()
    }).catch(listenerError => {
      console.error('Unable to monitor app-limit settings changes:', listenerError)
    })

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      appStateListener?.remove()
    }
  }, [refresh])

  const selectedApps = useMemo(() => {
    const byPackage = new Map(installedApps.map(app => [app.packageName, app]))
    return config.apps
      .map(rule => ({ ...byPackage.get(rule.packageName), ...rule }))
      .filter(app => app.name)
  }, [config.apps, installedApps])

  const filteredApps = useMemo(() => {
    const term = search.trim().toLowerCase()
    return installedApps.filter(app => !term || app.name.toLowerCase().includes(term))
  }, [installedApps, search])

  const updateConfig = (update) => {
    setConfig(current => update(current))
    setSaved(false)
  }

  const toggleApp = (app) => {
    updateConfig(current => {
      const selected = current.apps.some(item => item.packageName === app.packageName)
      return {
        ...current,
        apps: selected
          ? current.apps.filter(item => item.packageName !== app.packageName)
          : [...current.apps, {
              packageName: app.packageName,
              name: app.name,
              dailyLimitMinutes: 60,
              windowStart: '',
              windowEnd: ''
            }]
      }
    })
  }

  const updateRule = (packageName, field, value) => {
    updateConfig(current => ({
      ...current,
      apps: current.apps.map(rule => rule.packageName === packageName
        ? { ...rule, [field]: value }
        : rule)
    }))
  }

  const saveConfig = async () => {
    const invalidRule = config.apps.find(rule => {
      const hasStart = Boolean(rule.windowStart)
      const hasEnd = Boolean(rule.windowEnd)
      return hasStart !== hasEnd || (rule.dailyLimitMinutes <= 0 && !hasStart)
    })
    if (invalidRule) {
      setError('Each selected app needs a daily time limit, an allowed time window, or both. Enter both window times.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await AppLimits.setConfig(config)
      setSaved(true)
    } catch (saveError) {
      console.error('Unable to save Android app limits:', saveError)
      setError('Your app limits could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const openSettings = async (method) => {
    setError('')
    try {
      await AppLimits[method]()
    } catch (settingsError) {
      console.error('Unable to open Android app-limit settings:', settingsError)
      setError('Android settings could not be opened. Please open Settings manually.')
    }
  }

  const protectionActive = config.enabled && config.apps.length > 0
    && status.usageAccess && status.accessibilityEnabled

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 safe-area-top safe-area-bottom">
      <section className="mx-auto min-h-full w-full max-w-3xl bg-slate-50 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-indigo-700 to-blue-600 px-4 py-4 text-white shadow-lg sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Focus tools</p>
            <h1 className="text-xl font-bold sm:text-2xl">App limits</h1>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">
            Done
          </button>
        </header>

        <main className="space-y-5 px-4 py-5 sm:px-6">
          <section className={`rounded-2xl border p-4 ${protectionActive ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  {protectionActive ? 'Protection is active' : config.enabled ? 'Finish setup to enforce limits' : 'Protection is paused'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {protectionActive
                    ? `${config.apps.length} selected ${config.apps.length === 1 ? 'app' : 'apps'} are being monitored.`
                    : 'Android requires both permissions below to monitor and enforce app limits.'}
                </p>
              </div>
              <button
                onClick={() => updateConfig(current => ({ ...current, enabled: !current.enabled }))}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold ${config.enabled ? 'bg-white text-amber-800 ring-1 ring-amber-300' : 'bg-emerald-600 text-white'}`}
              >
                {config.enabled ? 'Pause all' : 'Resume'}
              </button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button onClick={() => openSettings('openUsageAccessSettings')} className="rounded-xl bg-white px-3 py-3 text-left text-sm shadow-sm ring-1 ring-slate-200">
                <span className="font-semibold text-slate-800">{status.usageAccess ? '✓ Usage Access enabled' : 'Enable Usage Access'}</span>
                <span className="mt-1 block text-xs text-slate-500">Reads daily foreground app time</span>
              </button>
              <button onClick={() => openSettings('openAccessibilitySettings')} className="rounded-xl bg-white px-3 py-3 text-left text-sm shadow-sm ring-1 ring-slate-200">
                <span className="font-semibold text-slate-800">{status.accessibilityEnabled ? '✓ Accessibility enabled' : 'Enable Accessibility'}</span>
                <span className="mt-1 block text-xs text-slate-500">Detects selected apps and sends blocked apps to Home</span>
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Selected apps</h2>
                <p className="text-sm text-slate-500">Set a daily foreground-time limit, allowed hours, or both.</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{config.apps.length} selected</span>
            </div>

            {selectedApps.length > 0 && (
              <div className="mt-4 space-y-3">
                {selectedApps.map(app => {
                  const used = usageMillis[app.packageName] || 0
                  const limit = Number(app.dailyLimitMinutes) || 0
                  const progress = limit ? Math.min(100, (used / (limit * 60000)) * 100) : 0
                  return (
                    <article key={app.packageName} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{app.name}</h3>
                          <p className="text-xs text-slate-500">Used today: {formatUsage(used)}{limit ? ` / ${limit}m` : ''}</p>
                        </div>
                        <button onClick={() => toggleApp(app)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Remove</button>
                      </div>
                      {limit > 0 && (
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <label className="text-xs font-semibold text-slate-600">
                          Daily limit (minutes; blank = none)
                          <input
                            type="number"
                            min="0"
                            max="1440"
                            value={limit || ''}
                            onChange={event => updateRule(app.packageName, 'dailyLimitMinutes', Math.min(1440, Math.max(0, Number(event.target.value) || 0)))}
                            placeholder="No limit"
                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Allowed from (optional)
                          <input
                            type="time"
                            value={app.windowStart || ''}
                            onChange={event => updateRule(app.packageName, 'windowStart', event.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-600">
                          Allowed until (optional)
                          <input
                            type="time"
                            value={app.windowEnd || ''}
                            onChange={event => updateRule(app.packageName, 'windowEnd', event.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                          />
                        </label>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Overnight ranges work (for example 10:00 PM–6:00 AM). Matching start/end means all day.</p>
                    </article>
                  )
                })}
              </div>
            )}

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Find an installed app
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search apps"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 font-normal text-slate-900"
              />
            </label>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200">
              {loading ? (
                <p className="p-4 text-sm text-slate-500">Loading installed apps…</p>
              ) : filteredApps.length ? filteredApps.map(app => {
                const selected = config.apps.some(rule => rule.packageName === app.packageName)
                return (
                  <label key={app.packageName} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
                    <input type="checkbox" checked={selected} onChange={() => toggleApp(app)} className="h-4 w-4 accent-indigo-600" />
                    <span className="text-sm font-medium text-slate-800">{app.name}</span>
                    {selected && <span className="ml-auto text-xs font-semibold text-indigo-600">Selected</span>}
                  </label>
                )
              }) : <p className="p-4 text-sm text-slate-500">No matching launchable apps were found.</p>}
            </div>
            <p className="mt-2 text-xs text-slate-500">Daily totals reset at local midnight. Phone, emergency, Settings, Home, and Daily Tracker apps are protected.</p>
          </section>

          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <section className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs leading-relaxed text-slate-600">
            App limits need Android Usage Access and Accessibility permission. When a rule blocks an app, Daily Tracker sends the phone to Home; it does not disable or uninstall that app. Android may allow limits to be bypassed if these permissions are turned off, and some manufacturers restrict background services.
          </section>

          <div className="sticky bottom-0 flex gap-3 bg-slate-50 py-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700">Close</button>
            <button onClick={saveConfig} disabled={saving || saved} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save app limits'}
            </button>
          </div>
        </main>
      </section>
    </div>
  )
}

export default AppLimitsModal
