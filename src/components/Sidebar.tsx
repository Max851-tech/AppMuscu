import type { ReactNode } from 'react'

import type { ApiUser } from '../services/api'

import type { ThemePreference } from '../utils/storage'

const navItems: Array<{
  id: 'workouts' | 'stats' | 'profile'
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    id: 'workouts',
    label: 'Séances',
    description: 'Planifier & suivre',
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m5 3 2 18" />
        <path d="m17 3 2 18" />
        <path d="M11 12h2" />
        <path d="M3 7h18" />
        <path d="M3 15h18" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Stats',
    description: 'Progression & volume',
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M7 15.5 12.5 10l3 3 5.5-5.5" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profil',
    description: 'Réglages & objectifs',
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 21v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

type SidebarProps = {
  activeTab: 'workouts' | 'stats' | 'profile'
  onChangeTab: (id: 'workouts' | 'stats' | 'profile') => void
  theme: ThemePreference
  onToggleTheme: () => void
  user: ApiUser | null
  onLogout: () => void
}

export default function Sidebar({ activeTab, onChangeTab, theme, onToggleTheme, user, onLogout }: SidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-8 border-r border-slate-200/80 bg-white/70 px-6 py-8 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/70 lg:w-72">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-semibold text-white shadow-lg shadow-emerald-500/40">
            AM
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">App Muscu</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Routine intelligente & simple</p>
          </div>
        </div>
        {user && (
          <div className="flex items-center justify-between rounded-2xl bg-slate-100/50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">{user.name ?? 'Mon compte'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
            </div>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name ?? user.email}
                className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-800"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {(user.email ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChangeTab(item.id)}
              className={`group flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                isActive
                  ? 'border-emerald-400/50 bg-emerald-50/80 text-emerald-600 shadow-md shadow-emerald-200/60 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-transparent bg-slate-100/40 text-slate-600 hover:-translate-y-[1px] hover:border-slate-200 hover:bg-white hover:text-slate-900 dark:bg-slate-900/40 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900/80 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition-colors ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                      : 'bg-white/60 dark:bg-slate-900/40'
                  }`}
                >
                  {item.icon}
                </span>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                </div>
              </div>
              <span
                className={`h-2 w-2 rounded-full transition ${
                  isActive ? 'bg-emerald-500 shadow shadow-emerald-500/40' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100/60 via-white/80 to-white/90 p-4 dark:border-slate-800 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-950">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Astuce du jour</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ajoute une note à chaque séance pour te souvenir de tes sensations et affiner ta progression.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-[1px] hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200"
        >
          <span>Mode {theme === 'dark' ? 'clair' : 'sombre'}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {theme === 'dark' ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path
                  d="M21 12.79A9 9 0 0 1 11.21 3a7 7 0 1 0 9.79 9.79Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m3.64-6.36-1.42-1.42m14.14 14.14 1.42 1.42m0-14.14-1.42 1.42M6.64 17.36l-1.42 1.42" />
              </svg>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-500 transition hover:border-rose-300 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:border-rose-500/60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="m15 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 4V2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

