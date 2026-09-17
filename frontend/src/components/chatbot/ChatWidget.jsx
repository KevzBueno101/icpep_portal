import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageSquare, X, Minimize2, Maximize2, RefreshCw, Trash2, Info, Send, Loader2, Bot } from 'lucide-react'
import { useChat } from './useChat'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

const WELCOME_MESSAGES = [
  "Hi! I'm the ICPEP Portal Assistant. How can I help you today?",
  "Welcome! Ask me about membership, events, fees, or anything ICPEP-related.",
  "Hello! Need info on membership status, upcoming events, or organization FAQs? I'm here to help.",
]

function getRandomWelcome() {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef(null)
  const widgetRef = useRef(null)

  const {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    retry,
    clearError,
    clearChat,
  } = useChat()

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Track unread messages when widget is closed/minimized
  useEffect(() => {
    if (!isOpen || isMinimized) {
      setUnreadCount((prev) => prev + 1)
    } else {
      setUnreadCount(0)
    }
  }, [messages, isOpen, isMinimized])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setIsMinimized(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Click outside to close (only when not minimized)
  useEffect(() => {
    if (!isOpen || isMinimized) return

    const handleClickOutside = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsMinimized(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isMinimized])

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev)
    setIsMinimized(false)
    setUnreadCount(0)
  }, [])

  const handleMinimize = useCallback(() => {
    setIsMinimized(true)
    setIsOpen(false)
  }, [])

  const handleMaximize = useCallback(() => {
    setIsMinimized(false)
    setIsOpen(true)
  }, [])

  const handleSendQuickQuestion = useCallback((question) => {
    setShowWelcome(false)
    sendMessage(question)
  }, [sendMessage])

  const quickQuestions = [
    { label: 'Membership fees', question: 'How much is the membership fee and how do I pay?' },
    { label: 'Upcoming events', question: 'What are the upcoming ICPEP events?' },
    { label: 'Event certificates', question: 'How do I get certificates for events I attended?' },
    { label: 'Member benefits', question: 'What benefits do I get as a member?' },
  ]

  if (isMinimized) {
    return (
      <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleMaximize}
          className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-xl hover:bg-sky-700 transition-all duration-300 animate-bounce-subtle"
          aria-label="Open chatbot"
        >
          <Bot className="h-7 w-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          ref={widgetRef}
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-xl hover:bg-sky-700 transition-all duration-300 animate-in slide-in-from-bottom-4"
          aria-label="Open chatbot"
        >
          <MessageSquare className="h-7 w-7" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          ref={widgetRef}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm md:max-w-md lg:max-w-lg animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex flex-col h-[500px] md:h-[550px] lg:h-[600px] max-h-[85vh] rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-700 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 shrink-0 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm dark:text-white">ICPEP Assistant</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Online • Typically replies in seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800"
                  aria-label="Clear chat"
                  title="New conversation"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleMinimize}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800"
                  aria-label="Minimize"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsMinimized(true); }}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {showWelcome && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 mb-4 dark:bg-sky-900/30">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2 dark:text-white">How can I help?</h4>
                  <p className="text-slate-500 text-sm mb-6 max-w-xs dark:text-slate-400">
                    {getRandomWelcome()}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendQuickQuestion(q.question)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-900/30 dark:hover:border-sky-800"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <ChatMessage key={`${msg.timestamp}-${idx}`} message={msg} isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'assistant'} />
              ))}

              {isLoading && messages.length > 0 && (
                <ChatMessage
                  message={{ role: 'assistant', content: '', timestamp: Date.now() }}
                  isStreaming={true}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error Banner (persistent at bottom of messages) */}
            {error && (
              <div className="border-t border-slate-100 px-4 py-3 bg-red-50/50 dark:border-slate-800 dark:bg-red-900/10">
                <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{error.message}</p>
                    {error.detail && <p className="opacity-80">{error.detail}</p>}
                  </div>
                  <button
                    onClick={retry}
                    disabled={isLoading}
                    className="shrink-0 px-2 py-1 rounded-lg text-xs font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-50"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-slate-100 p-4 shrink-0 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading}
                error={error}
                onRetry={retry}
                onClearError={clearError}
                disabled={messages.length === 0 && showWelcome}
              />
              <p className="mt-2 text-center text-[10px] text-slate-400">
                Powered by Google Gemini • Session: {sessionId}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}