// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import {
  Search, Heart, MapPin, Wallet, Briefcase, Clock, X, MessageSquare,
  CalendarDays, Users, Zap, Star, Languages, Check,
} from 'lucide-react'
import './talents-pro.css'

/* ---------- données de démonstration (à remplacer par ton API) ---------- */
const TALENTS = [
  { id: 1, name: 'Amina Yusuf', tag: 'Freelance', title: 'Développeuse Front-end', city: 'Lagos', skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind', 'Next.js'], avail: 'Sous 1 mois', rank: 2, tjm: 260, years: 6, match: 96, langs: ['Anglais', 'Français'], bio: "Développeuse front-end passionnée par les interfaces rapides et accessibles. A livré plus de 20 produits pour des startups fintech en Afrique de l'Ouest." },
  { id: 2, name: 'Aminata Diallo', tag: 'Étudiant', title: 'Étudiante en Data & IA', city: 'Dakar', skills: ['Python', 'SQL', 'FastAPI', 'Anglais', 'Pandas'], avail: 'Immédiate', rank: 1, tjm: null, years: 1, match: 91, langs: ['Français', 'Anglais', 'Wolof'], bio: "Étudiante en master data, à la recherche d'un stage de 6 mois. Projets en analyse de données et API REST." },
  { id: 3, name: 'Cheikh Fall', tag: 'Freelance', title: 'Ingénieur Backend', city: 'Dakar', skills: ['Python', 'FastAPI', 'SQL', 'Docker', 'AWS'], avail: 'Immédiate', rank: 1, tjm: 220, years: 7, match: 88, langs: ['Français', 'Anglais'], bio: "Ingénieur backend spécialisé en API performantes et architectures cloud. Expérience en paiement mobile et logistique." },
  { id: 4, name: 'Fatou Sow', tag: 'Salarié', title: 'Product Designer', city: 'Abidjan', skills: ['Figma', 'UX Research', 'Design System', 'Prototypage'], avail: 'Sous 2 mois', rank: 3, tjm: 240, years: 5, match: 84, langs: ['Français', 'Anglais'], bio: "Designer produit avec une forte culture de la recherche utilisateur. A structuré deux design systems complets." },
  { id: 5, name: 'Moussa Ndiaye', tag: 'Freelance', title: 'Développeur Mobile', city: 'Thiès', skills: ['React Native', 'Flutter', 'Firebase', 'TypeScript'], avail: 'Immédiate', rank: 1, tjm: 200, years: 4, match: 82, langs: ['Français', 'Wolof'], bio: "Développe des applications mobiles hors-ligne pour les marchés à connectivité limitée." },
  { id: 6, name: 'Awa Traoré', tag: 'Étudiant', title: 'Étudiante en Informatique', city: 'Bamako', skills: ['JavaScript', 'Node.js', 'MongoDB', 'Git'], avail: 'Sous 1 mois', rank: 2, tjm: null, years: 1, match: 77, langs: ['Français', 'Bambara'], bio: "Étudiante motivée, déjà active en open source. Cherche une première expérience en équipe produit." },
  { id: 7, name: 'Kwame Mensah', tag: 'Salarié', title: 'DevOps Engineer', city: 'Accra', skills: ['Kubernetes', 'Terraform', 'AWS', 'CI/CD', 'Linux'], avail: 'Sous 2 mois', rank: 3, tjm: 300, years: 9, match: 74, langs: ['Anglais'], bio: "Automatise le déploiement et la fiabilité de plateformes à forte charge. Certifié AWS Solutions Architect." },
  { id: 8, name: 'Nadia Benali', tag: 'Freelance', title: 'Data Analyst', city: 'Casablanca', skills: ['Power BI', 'SQL', 'Python', 'Excel'], avail: 'Sous 1 mois', rank: 2, tjm: 190, years: 3, match: 71, langs: ['Français', 'Arabe', 'Anglais'], bio: "Transforme des données brutes en tableaux de bord clairs pour les équipes dirigeantes." },
]

const TYPES = ['Tous', 'Freelance', 'Étudiant', 'Salarié']
const AVAILS = [['all', 'Toutes disponibilités'], ['1', 'Immédiate'], ['2', 'Sous 1 mois'], ['3', 'Sous 2 mois']]
const SORTS = [['match', 'Meilleur match'], ['tjm', 'TJM croissant'], ['years', 'Expérience']]

/* ---------- petits composants ---------- */
function Ring({ v }) {
  return <div className="tp-ring" style={{ '--v': v }}><span>{v}%</span></div>
}

function TalentCard({ t, i, fav, onFav, onOpen }) {
  return (
    <article className="tp-card tp-in" style={{ '--i': i }}>
      <header className="tp-card-top">
        <span className="tp-avatar">{t.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
        <div className="tp-id">
          <h3>{t.name}</h3>
          <p>{t.title}</p>
        </div>
        <button className={`tp-heart ${fav ? 'on' : ''}`} onClick={() => onFav(t.id)} aria-label="Favori">
          <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
        </button>
      </header>

      <div className="tp-row">
        <span className={`tp-tag tp-tag-${t.tag}`}>{t.tag}</span>
        <span className="tp-loc"><MapPin size={13} />{t.city}</span>
        <Ring v={t.match} />
      </div>

      <ul className="tp-skills">
        {t.skills.slice(0, 3).map((s) => <li key={s}>{s}</li>)}
        {t.skills.length > 3 && <li className="more">+{t.skills.length - 3}</li>}
      </ul>

      <div className="tp-meta">
        <span className={`tp-avail r${t.rank}`}><i />{t.avail}</span>
        {t.tjm && <span><Wallet size={14} />TJM {t.tjm}</span>}
        <span><Briefcase size={14} />{t.years} an{t.years > 1 ? 's' : ''}</span>
      </div>

      <button className="tp-btn" onClick={() => onOpen(t)}>Voir le profil</button>
    </article>
  )
}

function Drawer({ t, fav, onFav, onClose, onToast }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev }
  }, [onClose])

  return (
    <div className="tp-overlay" onClick={onClose}>
      <aside className="tp-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="tp-grab" />
        <button className="tp-x" onClick={onClose} aria-label="Fermer"><X size={18} /></button>

        <div className="tp-d-hero">
          <span className="tp-avatar lg">{t.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
          <h2>{t.name}</h2>
          <p>{t.title}</p>
          <div className="tp-row center">
            <span className={`tp-tag tp-tag-${t.tag}`}>{t.tag}</span>
            <span className="tp-loc"><MapPin size={13} />{t.city}</span>
          </div>
        </div>

        <div className="tp-d-stats">
          <div><b>{t.match}%</b><span>Match</span></div>
          <div><b>{t.tjm ? t.tjm : '—'}</b><span>TJM</span></div>
          <div><b>{t.years}</b><span>Ans d'exp.</span></div>
        </div>

        <section>
          <h4>À propos</h4>
          <p className="tp-bio">{t.bio}</p>
        </section>

        <section>
          <h4>Compétences</h4>
          <ul className="tp-skills">{t.skills.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>

        <section>
          <h4>Langues & disponibilité</h4>
          <div className="tp-meta col">
            <span><Languages size={14} />{t.langs.join(', ')}</span>
            <span className={`tp-avail r${t.rank}`}><i /><Clock size={14} />{t.avail}</span>
          </div>
        </section>

        <div className="tp-d-cta">
          <button className="tp-btn solid" onClick={() => { onToast(`Message envoyé à ${t.name}`); onClose() }}>
            <MessageSquare size={16} />Contacter
          </button>
          <button className="tp-btn gold" onClick={() => { onToast(`Entretien proposé à ${t.name}`); onClose() }}>
            <CalendarDays size={16} />Proposer un entretien
          </button>
          <button className={`tp-btn ${fav ? 'on' : ''}`} onClick={() => onFav(t.id)}>
            <Heart size={16} fill={fav ? 'currentColor' : 'none'} />{fav ? 'Retiré' : 'Favori'}
          </button>
        </div>
      </aside>
    </div>
  )
}

/* ---------- page ---------- */
export default function TalentsPro() {
  const [q, setQ] = useState('')
  const [type, setType] = useState('Tous')
  const [avail, setAvail] = useState('all')
  const [sort, setSort] = useState('match')
  const [onlyFav, setOnlyFav] = useState(false)
  const [favs, setFavs] = useState([])
  const [open, setOpen] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t) }, [])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2400); return () => clearTimeout(t) }, [toast])

  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    let r = TALENTS.filter((t) =>
      (type === 'Tous' || t.tag === type) &&
      (avail === 'all' || String(t.rank) === avail) &&
      (!onlyFav || favs.includes(t.id)) &&
      (!s || [t.name, t.title, t.city, ...t.skills].join(' ').toLowerCase().includes(s)))
    r = [...r].sort((a, b) =>
      sort === 'tjm' ? (a.tjm ?? 9999) - (b.tjm ?? 9999)
      : sort === 'years' ? b.years - a.years
      : b.match - a.match)
    return r
  }, [q, type, avail, sort, onlyFav, favs])

  const reset = () => { setQ(''); setType('Tous'); setAvail('all'); setOnlyFav(false) }
  const immediate = TALENTS.filter((t) => t.rank === 1).length

  return (
    <div className="tp">
      <section className="tp-hero tp-in" style={{ '--i': 0 }}>
        <div className="tp-hero-glow" aria-hidden />
        <h1>Trouvez le bon talent</h1>
        <p>Des profils vérifiés, prêts à rejoindre vos équipes partout en Afrique.</p>
        <div className="tp-stats">
          <div><Users size={16} /><b>{TALENTS.length}</b><span>profils</span></div>
          <div><Zap size={16} /><b>{immediate}</b><span>disponibles</span></div>
          <div><Star size={16} /><b>{favs.length}</b><span>favoris</span></div>
        </div>
      </section>

      <section className="tp-filters tp-in" style={{ '--i': 1 }}>
        <label className="tp-search">
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, une compétence, une ville…" />
          {q && <button onClick={() => setQ('')} aria-label="Effacer"><X size={16} /></button>}
        </label>

        <div className="tp-chips">
          {TYPES.map((t) => (
            <button key={t} className={t === type ? 'on' : ''} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>

        <div className="tp-selects">
          <select value={avail} onChange={(e) => setAvail(e.target.value)}>
            {AVAILS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className={`tp-favbtn ${onlyFav ? 'on' : ''}`} onClick={() => setOnlyFav((v) => !v)}>
            <Heart size={15} fill={onlyFav ? 'currentColor' : 'none'} />Favoris
          </button>
        </div>
      </section>

      <p className="tp-count">{loading ? 'Chargement…' : `${list.length} talent${list.length > 1 ? 's' : ''} trouvé${list.length > 1 ? 's' : ''}`}</p>

      {loading ? (
        <div className="tp-grid">{[0, 1, 2, 3, 4, 5].map((n) => <div key={n} className="tp-skel" />)}</div>
      ) : list.length === 0 ? (
        <div className="tp-empty tp-in">
          <Search size={34} />
          <h3>Aucun talent ne correspond</h3>
          <p>Essayez d'élargir vos critères ou de modifier votre recherche.</p>
          <button className="tp-btn solid" onClick={reset}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <div className="tp-grid">
          {list.map((t, i) => (
            <TalentCard key={t.id} t={t} i={i + 2} fav={favs.includes(t.id)} onFav={toggleFav} onOpen={setOpen} />
          ))}
        </div>
      )}

      {open && (
        <Drawer t={open} fav={favs.includes(open.id)} onFav={toggleFav} onClose={() => setOpen(null)} onToast={setToast} />
      )}
      {toast && <div className="tp-toast"><Check size={16} />{toast}</div>}
    </div>
  )
}