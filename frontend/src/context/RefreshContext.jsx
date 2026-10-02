import { createContext, useContext, useState, useCallback } from 'react'

const RefreshContext = createContext(null)

export const RefreshProvider = ({ children }) => {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [needContentRefresh, setNeedContentRefresh] = useState(false)

  const triggerRefresh = useCallback(() => setNeedRefresh(true), [])
  const clearRefresh = useCallback(() => setNeedRefresh(false), [])
  const triggerContentRefresh = useCallback(() => setNeedContentRefresh(true), [])
  const clearContentRefresh = useCallback(() => setNeedContentRefresh(false), [])

  return (
    <RefreshContext.Provider value={{ needRefresh, triggerRefresh, clearRefresh, needContentRefresh, triggerContentRefresh, clearContentRefresh }}>
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
