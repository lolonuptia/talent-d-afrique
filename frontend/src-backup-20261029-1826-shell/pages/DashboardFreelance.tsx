import Header from '../components/Header'

export default function DashboardFreelance() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Espace Freelance</h1>
        <p className="mt-2 text-slate-600">
          Vos missions apparaîtront ici une fois le backend connecté.
        </p>
      </div>
    </div>
  )
}