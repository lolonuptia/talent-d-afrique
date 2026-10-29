import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  const [menuOuvert, setMenuOuvert] = useState(false)

  return (
    <header className="border-b border-slate-100">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-blue-700">
          Talent<span className="text-orange-500">Afrique</span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#" className="hover:text-blue-700">Offres</a>
          <a href="#" className="hover:text-blue-700">Entreprises</a>
          <a href="#" className="hover:text-blue-700">À propos</a>
        </nav>

        {/* Boutons desktop */}
        <div className="hidden gap-3 sm:flex">
          <Link
            to="/connexion"
            className="rounded-lg px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            Connexion
          </Link>
          <Link
            to="/inscription"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Créer un compte
          </Link>
        </div>

        {/* Bouton hamburger (mobile uniquement) */}
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 sm:hidden"
          aria-label="Ouvrir le menu"
        >
          {menuOuvert ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu déroulant mobile */}
      {menuOuvert && (
        <div className="border-t border-slate-100 px-6 py-4 sm:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium text-slate-600">
            <a href="#" onClick={() => setMenuOuvert(false)} className="hover:text-blue-700">
              Offres
            </a>
            <a href="#" onClick={() => setMenuOuvert(false)} className="hover:text-blue-700">
              Entreprises
            </a>
            <a href="#" onClick={() => setMenuOuvert(false)} className="hover:text-blue-700">
              À propos
            </a>
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              to="/connexion"
              onClick={() => setMenuOuvert(false)}
              className="rounded-lg px-4 py-2 text-center text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              Connexion
            </Link>
            <Link
              to="/inscription"
              onClick={() => setMenuOuvert(false)}
              className="rounded-lg bg-orange-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-orange-600"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}