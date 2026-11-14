import { useEffect } from 'react'

const handlers = new Map()
let nextHandlerId = 0

export const registerBackHandler = (handler, priority = 0) => {
  const id = nextHandlerId++
  handlers.set(id, { handler, priority, order: id })
  return () => handlers.delete(id)
}

export const handleAppBack = () => {
  const orderedHandlers = [...handlers.values()].sort((first, second) =>
    second.priority - first.priority || second.order - first.order
  )

  for (const { handler } of orderedHandlers) {
    if (handler()) return true
  }
  return false
}

export const useAppBackHandler = (handler, active = true, priority = 0) => {
  useEffect(() => {
    if (!active) return undefined
    return registerBackHandler(handler, priority)
  }, [handler, active, priority])
}
