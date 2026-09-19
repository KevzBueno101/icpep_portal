import { Component } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {})
    }
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
            <TriangleAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The portal hit an unexpected error. Reload to try again, or clear the cached app data.
          </p>

          {this.state.error && (
            <p className="mt-3 break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              {String(this.state.error?.message || this.state.error)}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload
            </button>
            <button
              type="button"
              onClick={this.handleClearCache}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Clear cached app data & reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}