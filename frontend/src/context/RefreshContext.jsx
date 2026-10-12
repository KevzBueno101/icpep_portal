import { createContext, useContext, useState, useCallback } from 'react'

const RefreshContext = createContext(null)

export const RefreshProvider = ({ children }) => {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [needContentRefresh, setNeedContentRefresh] = useState(false)
  const [changeLabel, setChangeLabel] = useState(null)
  const [changeCount, setChangeCount] = useState(0)

  const triggerRefresh = useCallback((label) => {
    setNeedRefresh(true)
    if (label) {
      setChangeLabel(label)
      setChangeCount((count) => count + 1)
    }
  }, [])
  const clearRefresh = useCallback(() => {
    setNeedRefresh(false)
    setChangeLabel(null)
  }, [])
  const triggerContentRefresh = useCallback((label) => {
    setNeedContentRefresh(true)
    if (label) {
      setChangeLabel(label)
      setChangeCount((count) => count + 1)
    }
  }, [])
  const clearContentRefresh = useCallback(() => {
    setNeedContentRefresh(false)
    setChangeLabel(null)
  }, [])

  return (
    <RefreshContext.Provider value={{ needRefresh, triggerRefresh, clearRefresh, needContentRefresh, triggerContentRefresh, clearContentRefresh, changeLabel, changeCount }}>
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
