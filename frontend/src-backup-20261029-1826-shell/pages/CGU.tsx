import Header from '../components/Header'

const VERSION_CGU = '2026-09-04'

export default function CGU() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">
          Conditions générales d'utilisation
        </h1>
        <p className="mt-2 text-sm text-slate-500">Version du {VERSION_CGU}</p>

        <div className="mt-8 space-y-6 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-blue-700">1. Objet</h2>
            <p className="mt-2">
              Talent d'Afrique est une plateforme mettant en relation étudiants,
              entreprises, écoles et freelances autour d'un moteur de matching.
              [Contenu à finaliser avant mise en production.]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-700">2. Données personnelles</h2>
            <p className="mt-2">
              Voir notre{' '}
              <a href="/confidentialite" className="text-blue-700 underline">
                politique de confidentialité
              </a>{' '}
              pour le détail du traitement de vos données.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}