import { Send, X, RotateCcw, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, isLoading, error, onRetry, onClearError, disabled }) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)
  const [rows, setRows] = useState(1)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newRows = Math.min(Math.max(1, Math.floor(textareaRef.current.scrollHeight / 24)), 5)
      setRows(newRows)
      textareaRef.current.style.height = `${newRows * 24}px`
    }
  }, [message])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return
    onSend(message.trim())
    setMessage('')
    setRows(1)
    if (textareaRef.current) textareaRef.current.style.height = '24px'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="mb-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center justify-between gap-2">
            <span className="flex-1">{error.message}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {error.retryAfter && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Retry in {error.retryAfter}s
                </span>
              )}
              <button
                type="button"
                onClick={onRetry}
                disabled={isLoading}
                className="px-2 py-1 rounded-lg text-xs font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 disabled:opacity-50"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={onClearError}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Dismiss error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about membership, events, fees..."
          disabled={isLoading || disabled}
          rows={rows}
          maxLength={2000}
          className="flex-1 min-h-[44px] max-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          aria-label="Chat message"
          aria-disabled={isLoading || disabled}
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading || disabled}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition shadow-sm ${
            message.trim() && !isLoading && !disabled
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
          }`}
          aria-label={isLoading ? 'Sending...' : 'Send message'}
        >
          {isLoading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4.5 w-4.5" aria-hidden="true" />
          )}
        </button>

        {message.trim() && !isLoading && (
          <button
            type="button"
            onClick={() => setMessage('')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition dark:bg-slate-800 dark:hover:bg-slate-700"
            aria-label="Clear input"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      <p className="mt-1.5 text-right text-[11px] text-slate-400">
        {message.length}/2000
      </p>
    </form>
  )
}