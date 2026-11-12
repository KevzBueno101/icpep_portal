import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react'
import { getMemberUpdatesWsUrl } from '../utils/ws'
import { useRefresh } from './RefreshContext'
import { ALL_RESOURCES, CONTENT_UPDATED_EVENT, labelForResources } from '../utils/realtime'

const RealtimeContext = createContext(null)

const RECONNECT_BASE_MS = 3000
const RECONNECT_MAX_MS = 30000

export const RealtimeProvider = ({ children }) => {
  const { triggerContentRefresh } = useRefresh()
  const guardCountRef = useRef(0)
  const pendingRef = useRef(new Set())
  const [connected, setConnected] = useState(false)

  const dispatch = useCallback((resources) => {
    if (!resources || resources.length === 0) return
    window.dispatchEvent(
      new CustomEvent(CONTENT_UPDATED_EVENT, { detail: { resources } })
    )
  }, [])

  const flushPending = useCallback(() => {
    const pending = Array.from(pendingRef.current)
    pendingRef.current.clear()
    if (pending.length) dispatch(pending)
  }, [dispatch])

  useEffect(() => {
    const wsUrl = getMemberUpdatesWsUrl()
    let ws
    let cancelled = false
    let reconnectTimer
    let attempts = 0
    let hasConnected = false

    const handleResources = (resources) => {
      if (!resources || resources.length === 0) return
      if (guardCountRef.current > 0) {
        resources.forEach((r) => pendingRef.current.add(r))
        triggerContentRefresh(labelForResources(resources))
      } else {
        dispatch(resources)
      }
    }

    const scheduleReconnect = () => {
      // Exponential backoff (3s → 30s) so a persistently unreachable socket
      // doesn't hammer the API or flash loading states every few seconds.
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** attempts,
        RECONNECT_MAX_MS
      )
      attempts += 1
      reconnectTimer = setTimeout(() => {
        if (!cancelled) connect()
      }, delay)
    }

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl)
      } catch {
        scheduleReconnect()
        return
      }

      ws.onopen = () => {
        if (cancelled) return
        setConnected(true)
        attempts = 0
        // Resync once, only after a *successful* reconnect — not on every
        // failed attempt (that was causing a full refetch every 3 seconds).
        if (hasConnected) handleResources(ALL_RESOURCES)
        hasConnected = true
      }

      ws.onmessage = (event) => {
        if (cancelled) return
        try {
          const data = JSON.parse(event.data)
          if (data?.type !== 'content.updated') return
          const resources = data?.payload?.resources
          handleResources(Array.isArray(resources) ? resources : [])
        } catch {
          // ignore malformed frames
        }
      }

      ws.onerror = () => {}

      ws.onclose = () => {
        if (cancelled) return
        setConnected(false)
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      cancelled = true
      clearTimeout(reconnectTimer)
      try {
        ws?.close()
      } catch {
        // ignore
      }
    }
  }, [dispatch, triggerContentRefresh])

  const registerGuard = useCallback(() => {
    guardCountRef.current += 1
    return () => {
      guardCountRef.current = Math.max(0, guardCountRef.current - 1)
      if (guardCountRef.current === 0) flushPending()
    }
  }, [flushPending])

  return (
    <RealtimeContext.Provider value={{ connected, registerGuard }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}

export const useRealtimeContent = (resources, callback) => {
  const ctx = useContext(RealtimeContext)
  const cbRef = useRef(callback)

  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  const key = Array.isArray(resources) ? resources.join('|') : String(resources)

  useEffect(() => {
    if (!ctx) return undefined
    const wanted = key.split('|').filter(Boolean)
    const handler = (event) => {
      const changed = event?.detail?.resources || []
      if (changed.some((r) => wanted.includes(r))) {
        cbRef.current?.()
      }
    }
    window.addEventListener(CONTENT_UPDATED_EVENT, handler)
    return () => window.removeEventListener(CONTENT_UPDATED_EVENT, handler)
  }, [ctx, key])
}

export const useRealtimeGuard = (active = true) => {
  const ctx = useContext(RealtimeContext)

  useEffect(() => {
    if (!ctx || !active) return
    const unregister = ctx.registerGuard()
    return () => unregister()
  }, [ctx, active])
}

export default RealtimeContext
