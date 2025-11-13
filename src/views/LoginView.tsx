import { useState } from 'react'

import type { LoginPayload, RegisterPayload } from '../services/api'
import type { ThemePreference } from '../utils/storage'

type LoginViewProps = {
  theme: ThemePreference
  onToggleTheme: () => void
  onLogin: (payload: LoginPayload) => Promise<void>
  onRegister: (payload: RegisterPayload) => Promise<void>
  isSubmitting: boolean
  errorMessage?: string | null
}

export default function LoginView({
  theme,
  onToggleTheme,
  onLogin,
  onRegister,
  isSubmitting,
  errorMessage,
}: LoginViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
  })
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError(null)

    const email = form.email.trim().toLowerCase()
    const password = form.password.trim()

    if (!email || !password) {
      setLocalError('Renseigne un email et un mot de passe.')
      return
    }

    try {
      if (mode === 'login') {
        await onLogin({ email, password })
      } else {
        await onRegister({
          email,
          password,
          name: form.name.trim() || undefined,
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        setLocalError(error.message)
      } else {
        setLocalError("Impossible d'effectuer l'action pour le moment.")
      }
    }
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setLocalError(null)
  }

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

      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-semibold text-white shadow-lg shadow-emerald-500/40">
            AM
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">App Muscu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Connecte-toi pour retrouver tes séances et ton suivi.'
              : 'Crée ton espace en quelques secondes et commence à tracer tes entraînements.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-6 text-left shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-black/30"
        >
          <div className="grid gap-4">
            {mode === 'register' && (
              <label className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                Prénom ou pseudo (optionnel)
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Max"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
                />
              </label>
            )}

            <label className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Adresse email
              <input
                type="email"
                value={form.email}
                required
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="toi@exemple.com"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              Mot de passe
              <input
                type="password"
                value={form.password}
                required
                minLength={8}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Au moins 8 caractères"
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-200/40 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/20"
              />
            </label>
          </div>

          {(localError || errorMessage) && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {localError || errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Traitement...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          {mode === 'login' ? "Pas encore de compte ? Inscription rapide." : 'Déjà membre ? Retour à la connexion.'}
        </button>
      </div>
    </div>
  )
}

