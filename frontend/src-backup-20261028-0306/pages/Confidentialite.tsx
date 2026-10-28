import Header from '../components/Header'

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">
          Politique de confidentialité
        </h1>

        <div className="mt-8 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-blue-700">Données collectées</h2>
            <p className="mt-2">
              Nom, email, CV, compétences, historique de candidatures selon votre profil.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-700">Vos droits</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Droit d'accès et d'export de vos données</li>
              <li>Droit à la suppression de votre compte et de vos données</li>
              <li>Droit de rectification à tout moment depuis votre profil</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}