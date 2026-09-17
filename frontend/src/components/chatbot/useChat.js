import { useReducer, useCallback, useRef, useEffect } from 'react'
import { chatbotAPI } from '../../api/chatbot'

const initialState = {
  messages: [],
  isLoading: false,
  error: null,
  sessionId: null,
  retryCount: 0,
}

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, { role: 'user', content: action.payload, timestamp: Date.now() }],
        error: null,
      }
    case 'ADD_BOT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, { role: 'assistant', content: action.payload, timestamp: Date.now() }],
        isLoading: false,
        error: null,
        retryCount: 0,
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }
    case 'INCREMENT_RETRY':
      return { ...state, retryCount: state.retryCount + 1 }
    case 'RESET_RETRY':
      return { ...state, retryCount: 0 }
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }
    case 'RESET_CHAT':
      return { ...initialState }
    default:
      return state
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const abortControllerRef = useRef(null)
  const retryTimeoutRef = useRef(null)

  // Initialize or restore session ID from localStorage
  useEffect(() => {
    let sessionId = localStorage.getItem('chatbot_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem('chatbot_session_id', sessionId)
    }
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId })
  }, [])

  const sendMessage = useCallback(async (message) => {
    if (!message.trim() || state.isLoading) return

    // Add user message immediately
    dispatch({ type: 'ADD_USER_MESSAGE', payload: message.trim() })
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'RESET_RETRY' })

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const response = await chatbotAPI.sendMessage(message.trim(), state.sessionId)

      if (response.data.response) {
        dispatch({ type: 'ADD_BOT_MESSAGE', payload: response.data.response })
        if (response.data.session_id) {
          dispatch({ type: 'SET_SESSION_ID', payload: response.data.session_id })
          localStorage.setItem('chatbot_session_id', response.data.session_id)
        }
      } else if (response.data.error) {
        const retryAfter = response.data.retry_after
        dispatch({
          type: 'SET_ERROR',
          payload: {
            message: response.data.error,
            detail: response.data.detail,
            retryAfter,
          },
        })
      }
    } catch (err) {
      if (err.name === 'AbortError') return

      const status = err.response?.status
      const data = err.response?.data

      let errorMessage = 'Failed to send message. Please try again.'
      let detail = ''
      let retryAfter = null

      if (status === 401) {
        errorMessage = 'Session expired. Please log in again.'
        detail = 'Authentication required'
      } else if (status === 403) {
        errorMessage = 'You do not have permission to use the chatbot.'
        detail = 'Access restricted'
      } else if (status === 429) {
        errorMessage = 'Too many requests. Please wait a moment.'
        detail = data?.detail || 'Rate limit exceeded'
        retryAfter = data?.retry_after || 60
      } else if (status >= 500) {
        errorMessage = 'Chatbot service is temporarily unavailable.'
        detail = 'Server error'
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection.'
        detail = 'Network timeout'
      }

      dispatch({
        type: 'SET_ERROR',
        payload: { message: errorMessage, detail, retryAfter },
      })
    }
  }, [state.sessionId, state.isLoading])

  const retry = useCallback(() => {
    if (state.messages.length === 0) return
    const lastUserMsg = [...state.messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content)
    }
  }, [state.messages, sendMessage])

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  const clearChat = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' })
    localStorage.removeItem('chatbot_session_id')
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId })
    localStorage.setItem('chatbot_session_id', newSessionId)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort()
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sessionId: state.sessionId,
    retryCount: state.retryCount,
    sendMessage,
    retry,
    clearError,
    clearChat,
  }
}