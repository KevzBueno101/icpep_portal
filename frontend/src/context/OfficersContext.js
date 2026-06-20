import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import React from 'react'
import { publicApi } from '../api/axios'


const OfficersContext = createContext(null)


export const OfficersProvider = ({ children }) => {
  const [officers, setOfficers] = useState([])
  const [officersLoading, setOfficersLoading] = useState(false)

  const fetchOfficers = useCallback(async (params = undefined) => {
    setOfficersLoading(true)
    try {
      const res = await publicApi.get('/users/officers/roster/', { params })
      const results = res.data?.results
      setOfficers(Array.isArray(results) ? results : [])
    } catch (err) {
      console.error('[OfficersContext] Error fetching officers:', err)
      setOfficers([])
    } finally {
      setOfficersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOfficers()
  }, [fetchOfficers])

  // Listen for custom event to refresh officers (backward compatibility)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[OfficersContext] Refreshing officers due to event')
      fetchOfficers()
    }

    window.addEventListener('officers-refresh', handleRefresh)
    return () => window.removeEventListener('officers-refresh', handleRefresh)
  }, [fetchOfficers])

  // Real-time updates via WebSocket (Channels)
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL
      ? `${import.meta.env.VITE_WS_URL}/ws/officers/`
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/officers/`


    let ws
    let isCancelled = false

    try {
      ws = new WebSocket(wsUrl)
    } catch (e) {
      console.warn('[OfficersContext] WebSocket init failed:', e)
      return
    }

    ws.onopen = () => {
      // console.log('[OfficersContext] WebSocket connected')
    }

    ws.onmessage = (event) => {
      if (isCancelled) return
      try {
        const data = JSON.parse(event.data)
        console.log('[OfficersContext] ws message', data)

        if (data?.type === 'officers.roster.updated') {
          // bust any potential caching by adding a unique param
          fetchOfficers({ t: Date.now() })
        }
      } catch (e) {
        console.warn('[OfficersContext] ws message parse error')
      }
    }

    ws.onerror = (err) => {
      // avoid spamming console
      console.warn('[OfficersContext] WebSocket error')
    }

    ws.onclose = () => {
      // Best-effort reconnect with backoff
      if (isCancelled) return
      setTimeout(() => {
        if (!isCancelled) fetchOfficers()
      }, 1500)
    }

    return () => {
      isCancelled = true
      try {
        ws?.close()
      } catch {
        // ignore
      }
    }
  }, [fetchOfficers])


  return React.createElement(
    OfficersContext.Provider,
    { value: { officers, officersLoading, refreshOfficers: fetchOfficers } },
    children
  )
}





export const useOfficers = () => {
  const ctx = useContext(OfficersContext)
  if (!ctx) throw new Error('useOfficers must be used within OfficersProvider')
  return ctx
}

