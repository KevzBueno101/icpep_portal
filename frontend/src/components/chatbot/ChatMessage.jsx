import { format } from 'date-fns'
import { Bot, User, Copy, Check } from 'lucide-react'
import { useState, useEffect } from 'react'

function formatTime(timestamp) {
  try {
    return format(new Date(timestamp), 'h:mm a')
  } catch {
    return ''
  }
}

export default function ChatMessage({ message, isStreaming = false }) {
  const [copied, setCopied] = useState(false)
  const [showCopy, setShowCopy] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const isUser = message.role === 'user'
  const avatarIcon = isUser ? User : Bot
  const avatarBg = isUser ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
  const bubbleBg = isUser ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
  const alignClass = isUser ? 'justify-end' : 'justify-start'
  const textAlign = isUser ? 'text-right' : 'text-left'

  return (
    <div
      className={`flex gap-2.5 max-w-[85%] ${alignClass} animate-in slide-in-from-bottom-2 duration-300`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {!isUser && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarBg}`}>
          <avatarIcon className="h-4 w-4" aria-hidden="true" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${bubbleBg} ${textAlign} ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}
          style={{ maxWidth: '100%' }}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
            {message.content}
          </div>

          {showCopy && !isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-1 right-1 rounded-md p-1 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition opacity-0 group-hover:opacity-100"
              aria-label={copied ? 'Copied!' : 'Copy message'}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}

          {isStreaming && (
            <span className="inline-block animate-pulse text-slate-400" aria-hidden="true">▌</span>
          )}
        </div>

        <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${textAlign} px-1`}>
          <span>{formatTime(message.timestamp)}</span>
        </div>
      </div>

      {isUser && (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${avatarBg}`}>
          <User className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}