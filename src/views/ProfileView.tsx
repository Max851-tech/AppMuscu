export default function ProfileView() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Profil</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Personnalise ton expérience</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure tes objectifs, ton matériel disponible et reçois des recommandations d’entraînement sur-mesure.
        </p>
      </header>

      <section className="glass-card border p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Informations personnelles</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Ces données restent stockées en local sur ton appareil. Elles servent uniquement à personnaliser ton dashboard.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Nom / pseudo</span>
            <input
              disabled
              placeholder="À venir"
              className="w-full cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-100/60 px-4 py-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Objectif principal</span>
            <input
              disabled
              placeholder="Prise de masse, force, endurance..."
              className="w-full cursor-not-allowed rounded-xl border border-dashed border-slate-300 bg-slate-100/60 px-4 py-3 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500"
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 p-5 text-sm text-slate-500 dark:border-slate-800/60 dark:bg-slate-900/70 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-200">⚙️ À venir très vite</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Synchronisation avec une base de données cloud ou SQLite</li>
            <li>Gestion multi-profils et partage de programmes</li>
            <li>Suivi des mensurations et indicateurs bien-être</li>
            <li>Planification intelligente basée sur ta récupération</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

