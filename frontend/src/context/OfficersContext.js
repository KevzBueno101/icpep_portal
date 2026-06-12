import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import React from 'react'
import { publicApi } from '../api/axios'


const OfficersContext = createContext(null)


export const OfficersProvider = ({ children }) => {
  const [officers, setOfficers] = useState([])
  const [officersLoading, setOfficersLoading] = useState(false)

  const fetchOfficers = useCallback(async () => {
    setOfficersLoading(true)
    try {
      const res = await publicApi.get('/users/officers/roster/')
      const results = res.data?.results
      setOfficers(Array.isArray(results) ? results : [])
    } catch (err) {
      console.error(err)
      setOfficers([])
    } finally {
      setOfficersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOfficers()
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

