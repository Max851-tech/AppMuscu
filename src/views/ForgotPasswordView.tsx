import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'

export function ForgotPasswordView() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setIsSubmitting(true)
        setMessage(null)

        try {
            const data = await forgotPassword(email)
            setMessage({ type: 'success', text: data.message })
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Une erreur est survenue.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
            <div className="w-full max-w-md space-y-8 text-center">
                <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-400 shadow-lg shadow-emerald-500/20">
                        <span className="text-xl font-bold text-white">AM</span>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Mot de passe oublié ?
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Entre ton email pour recevoir un lien de réinitialisation.
                    </p>
                </div>

                <div className="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2 text-left">
                            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Adresse email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400/10"
                            />
                        </div>

                        {message && (
                            <div
                                className={`rounded-xl p-3 text-sm ${message.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-[1px] hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? 'Envoi...' : 'Envoyer le lien'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Tu t'en souviens ?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-400"
                        >
                            Retour à la connexion
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
