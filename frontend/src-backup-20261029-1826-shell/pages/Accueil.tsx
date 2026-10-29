import { useNavigate } from 'react-router-dom'
import { PROFILES } from '../types/profile'
import Header from '../components/Header'

export default function Accueil() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Le bon talent, la bonne opportunité,{' '}
          <span className="text-blue-700">au bon moment</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Talent d'Afrique connecte étudiants, entreprises, écoles et freelances
          grâce à un moteur de matching intelligent — fini le tri à l'aveugle.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          Je suis…
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => navigate(`/inscription?profil=${profile.id}`)}
              className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:shadow-sm"
            >
              <h3 className="font-semibold text-blue-700">{profile.label}</h3>
              <p className="mt-2 text-sm text-slate-600">{profile.description}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}