import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import React from 'react'
import { publicApi } from '../api/axios'
import { RESOURCES } from '../utils/realtime'
import { useRealtimeContent } from './RealtimeContext'


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

  // Real-time updates via the shared realtime provider (single WebSocket).
  useRealtimeContent([RESOURCES.OFFICERS, RESOURCES.ADMINS], () => {
    fetchOfficers({ t: Date.now() })
  })


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

