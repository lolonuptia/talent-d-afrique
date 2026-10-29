import { Link } from 'react-router-dom'
import Header from '../components/Header'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-4xl font-bold text-blue-700">404</h1>
        <p className="mt-4 text-lg text-slate-600">
          Cette page n'existe pas ou plus.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium text-white hover:bg-orange-600"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}