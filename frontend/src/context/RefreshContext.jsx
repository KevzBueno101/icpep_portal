import { createContext, useContext, useState, useCallback } from 'react'

const RefreshContext = createContext(null)

export const RefreshProvider = ({ children }) => {
  const [needRefresh, setNeedRefresh] = useState(false)

  const triggerRefresh = useCallback(() => setNeedRefresh(true), [])
  const clearRefresh = useCallback(() => setNeedRefresh(false), [])

  return (
    <RefreshContext.Provider value={{ needRefresh, triggerRefresh, clearRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export const useRefresh = () => {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useRefresh must be used within RefreshProvider')
  return ctx
}

export default RefreshContext
