import { useState } from 'react'

function PatternLock({ value, onChange, disabled = false, label = 'Draw a recovery pattern' }) {
  const [isDrawing, setIsDrawing] = useState(false)

  const addDot = (index) => {
    if (disabled || value.includes(index)) return
    onChange([...value, index])
  }

  const handlePointerMove = (event) => {
    if (!isDrawing || disabled) return
    const dot = event.target.closest('[data-pattern-dot]')
    if (dot) addDot(Number(dot.dataset.patternDot))
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="relative mx-auto grid aspect-square w-64 max-w-full grid-cols-3 grid-rows-3 touch-none rounded-2xl bg-slate-50 p-5"
      onPointerMove={handlePointerMove}
      onPointerUp={() => setIsDrawing(false)}
      onPointerCancel={() => setIsDrawing(false)}
      onPointerLeave={() => setIsDrawing(false)}
    >
      <svg className="pointer-events-none absolute inset-5 h-[calc(100%-2.5rem)] w-[calc(100%-2.5rem)]" viewBox="0 0 3 3" preserveAspectRatio="none">
        {value.slice(1).map((dot, index) => {
          const previous = value[index]
          return (
            <line
              key={`${previous}-${dot}-${index}`}
              x1={(previous % 3) + 0.5}
              y1={Math.floor(previous / 3) + 0.5}
              x2={(dot % 3) + 0.5}
              y2={Math.floor(dot / 3) + 0.5}
              stroke="#4f46e5"
              strokeWidth="0.08"
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      {Array.from({ length: 9 }, (_, index) => (
        <button
          key={index}
          type="button"
          data-pattern-dot={index}
          aria-label={`Pattern dot ${index + 1}`}
          disabled={disabled}
          onPointerDown={(event) => {
            event.preventDefault()
            setIsDrawing(true)
            addDot(index)
          }}
          onPointerEnter={() => {
            if (isDrawing) addDot(index)
          }}
          className="relative z-10 m-auto flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <span className={`h-5 w-5 rounded-full border-2 transition-colors ${
            value.includes(index) ? 'border-indigo-600 bg-indigo-600 shadow-[0_0_0_6px_rgba(79,70,229,0.18)]' : 'border-slate-400 bg-white'
          }`} />
        </button>
      ))}
    </div>
  )
}

export default PatternLock
