import type { ThemePreference } from '../utils/storage'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type LoginViewProps = {
  theme: ThemePreference
  onToggleTheme: () => void
}

export default function LoginView({ theme, onToggleTheme }: LoginViewProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 px-6 py-16 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="absolute right-6 top-6">
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700"
        >
          <span>Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>
          {theme === 'dark' ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 0 1 11.21 3a7 7 0 1 0 9.79 9.79Z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m3.64-6.36-1.42-1.42m14.14 14.14 1.42 1.42m0-14.14-1.42 1.42M6.64 17.36l-1.42 1.42" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-semibold text-white shadow-lg shadow-emerald-500/40">
            AM
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">App Muscu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Connecte-toi pour retrouver tes séances sauvegardées dans le cloud et suivre ta progression partout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const redirect = encodeURIComponent(window.location.origin)
            window.location.href = `${API_BASE_URL}/api/auth/google?redirect=${redirect}`
          }}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition hover:-translate-y-[1px] dark:bg-white dark:text-slate-900 dark:shadow-white/20"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M21.35 11.1h-9.18v2.77h5.28c-.23 1.34-.94 2.47-2.01 3.23v2.68h3.25c1.91-1.76 3.03-4.35 3.03-7.44 0-.68-.06-1.34-.19-1.97Z"
              fill="#4285F4"
            />
            <path
              d="M12.17 21c2.73 0 5.02-.9 6.7-2.43l-3.25-2.68c-.9.6-2.06.96-3.45.96-2.65 0-4.89-1.79-5.69-4.2H3.16v2.76C4.82 18.93 8.23 21 12.17 21Z"
              fill="#34A853"
            />
            <path
              d="M6.48 12.64c-.2-.6-.32-1.25-.32-1.91 0-.66.12-1.31.32-1.91V6.06H3.16C2.42 7.45 2 9.05 2 10.73c0 1.68.42 3.28 1.16 4.67l3.32-2.76Z"
              fill="#FBBC04"
            />
            <path
              d="M12.17 5.3c1.48 0 2.8.5 3.85 1.49l2.89-2.89C17.18 2.43 14.9 1.5 12.17 1.5 8.23 1.5 4.82 3.57 3.16 6.73l3.32 2.76c.8-2.42 3.04-4.2 5.69-4.2Z"
              fill="#EA4335"
            />
          </svg>
          Continuer avec Google
        </button>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Tu seras redirigé vers Google pour t’authentifier en toute sécurité. Aucune donnée n’est stockée sur ton
          appareil.
        </p>
      </div>
    </div>
  )
}

