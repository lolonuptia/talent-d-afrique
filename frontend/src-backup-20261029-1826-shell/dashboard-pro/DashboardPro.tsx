// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import {
  Briefcase, Users, CalendarDays, Eye, TrendingUp, Plus, ArrowUpRight,
  Sparkles, MapPin, Video, MessageSquare, UserPlus, ChevronRight, Clock, Star,
} from 'lucide-react'
import './dashboard-pro.css'

const COMPANY = 'Entreprise Test'

/* ---------- données de démonstration (à remplacer par ton API) ---------- */
const gen = (n, base, amp, seed) =>
  Array.from({ length: n }, (_, i) =>
    Math.max(2, Math.round(base + Math.sin(i * 0.9 + seed) * amp + Math.cos(i * 0.35 + seed) * amp * 0.6 + i * (base / n) * 0.4)))

const SERIES = {
  '7j': { data: gen(7, 18, 6, 1), labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] },
  '30j': { data: gen(30, 14, 6, 2), labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`) },
  '90j': { data: gen(12, 60, 18, 3), labels: Array.from({ length: 12 }, (_, i) => `S${i + 1}`) },
}

const KPIS = [
  { label: 'Offres actives', value: 8, delta: '+2', icon: Briefcase, color: '#0f9d73', data: [3, 4, 4, 5, 6, 6, 7, 8] },
  { label: 'Candidatures', value: 142, delta: '+18%', icon: Users, color: '#d4a017', data: [20, 34, 30, 52, 61, 88, 110, 142] },
  { label: 'Entretiens', value: 12, delta: '+4', icon: CalendarDays, color: '#3b82f6', data: [2, 3, 3, 5, 6, 8, 9, 12] },
  { label: 'Vues des offres', value: 2480, delta: '+26%', icon: Eye, color: '#8b5cf6', data: [900, 1100, 1050, 1500, 1700, 2000, 2200, 2480] },
]

const FUNNEL = [
  ['Candidatures', 142], ['Présélectionnés', 64], ['Entretiens', 28], ['Offres envoyées', 9], ['Embauchés', 5],
]

const OFFERS = [
  { title: 'Développeur React Senior', place: 'Dakar', type: 'CDI', n: 48, p: 78, status: 'Active', tone: 'ok' },
  { title: 'Backend Python / FastAPI', place: 'Remote', type: 'Freelance', n: 37, p: 55, status: 'Active', tone: 'ok' },
  { title: 'Stagiaire Data Analyst', place: 'Abidjan', type: 'Stage', n: 29, p: 40, status: 'Urgent', tone: 'warn' },
  { title: 'UI/UX Designer', place: 'Dakar', type: 'CDD', n: 18, p: 22, status: 'Brouillon', tone: 'mute' },
]

const TALENTS = [
  { name: 'Amina Yusuf', ini: 'AY', tag: 'Freelance', skills: 'React · TypeScript', match: 96 },
  { name: 'Aminata Diallo', ini: 'AD', tag: 'Étudiant', skills: 'Python · SQL', match: 91 },
  { name: 'Cheikh Fall', ini: 'CF', tag: 'Freelance', skills: 'Python · FastAPI', match: 88 },
]

const INTERVIEWS = [
  { when: "Aujourd'hui", hour: '14:30', who: 'Amina Yusuf', role: 'Développeur React Senior', mode: 'Visio', icon: Video },
  { when: 'Demain', hour: '10:00', who: 'Cheikh Fall', role: 'Backend Python / FastAPI', mode: 'Dakar', icon: MapPin },
  { when: 'Vendredi', hour: '16:00', who: 'Aminata Diallo', role: 'Stagiaire Data Analyst', mode: 'Visio', icon: Video },
]

const ACTIVITY = [
  { icon: UserPlus, text: 'Nouvelle candidature de Moussa Ndiaye', time: 'il y a 12 min', c: '#0f9d73' },
  { icon: MessageSquare, text: 'Amina Yusuf a répondu à votre message', time: 'il y a 1 h', c: '#3b82f6' },
  { icon: Star, text: 'Cheikh Fall ajouté à vos favoris', time: 'il y a 3 h', c: '#d4a017' },
  { icon: Eye, text: 'Votre offre React a dépassé 500 vues', time: 'hier', c: '#8b5cf6' },
]

/* ---------- utilitaires ---------- */
function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf, start
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

function Spark({ data, color }) {
  const w = 100, h = 32
  const max = Math.max(...data), min = Math.min(...data)
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - ((d - min) / (max - min || 1)) * (h - 6) - 3])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const id = 'sg' + color.replace('#', '')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="dp-spark" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AreaChart({ data, labels }) {
  const W = 600, H = 230, P = { t: 16, r: 12, b: 26, l: 32 }
  const max = Math.max(...data) * 1.15
  const x = (i) => P.l + (i / (data.length - 1)) * (W - P.l - P.r)
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b)
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)} ${H - P.b} L${x(0)} ${H - P.b} Z`
  const [hover, setHover] = useState(null)
  const ref = useRef(null)
  const step = Math.ceil(data.length / 6)

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const rel = ((cx - r.left) / r.width) * W
    const i = Math.round(((rel - P.l) / (W - P.l - P.r)) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  return (
    <div className="dp-chart">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onTouchMove={onMove}
        onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="dpArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f9d73" stopOpacity=".38" />
            <stop offset="1" stopColor="#0f9d73" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((t) => {
          const val = Math.round(max * t)
          return (
            <g key={t}>
              <line x1={P.l} x2={W - P.r} y1={y(val)} y2={y(val)} className="dp-grid-line" />
              <text x={P.l - 6} y={y(val) + 4} textAnchor="end" className="dp-axis">{val}</text>
            </g>
          )
        })}
        {labels.map((l, i) => i % step === 0 && (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="dp-axis">{l}</text>
        ))}
        <path d={area} fill="url(#dpArea)" />
        <path d={line} fill="none" stroke="#0f9d73" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} className="dp-cursor" />
            <circle cx={x(hover)} cy={y(data[hover])} r="6" fill="#fff" stroke="#0f9d73" strokeWidth="3" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="dp-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(data[hover]) / H) * 100}%` }}>
          <b>{data[hover]}</b> candidatures<small>{labels[hover]}</small>
        </div>
      )}
    </div>
  )
}

function Head({ title, sub, right }) {
  return (
    <div className="dp-head">
      <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
      {right}
    </div>
  )
}

function Kpi({ k, i }) {
  const v = useCountUp(k.value)
  const Icon = k.icon
  return (
    <article className="dp-card dp-kpi dp-in" style={{ '--i': i }}>
      <div className="dp-kpi-top">
        <span className="dp-ico" style={{ '--c': k.color }}><Icon size={18} /></span>
        <span className="dp-delta"><TrendingUp size={12} />{k.delta}</span>
      </div>
      <div className="dp-kpi-val">{v.toLocaleString('fr-FR')}</div>
      <div className="dp-kpi-lab">{k.label}</div>
      <Spark data={k.data} color={k.color} />
    </article>
  )
}

/* ---------- page ---------- */
export default function DashboardPro() {
  const [range, setRange] = useState('30j')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t) }, [])

  const h = new Date().getHours()
  const hello = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
  const s = SERIES[range]
  const total = s.data.reduce((a, b) => a + b, 0)

  return (
    <div className="dp">
      <section className="dp-hero dp-in" style={{ '--i': 0 }}>
        <div className="dp-hero-glow" aria-hidden />
        <span className="dp-chip"><Sparkles size={14} /> Espace recruteur</span>
        <h1>{hello}, {COMPANY} 👋</h1>
        <p>Vous avez <b>14 nouvelles candidatures</b> à examiner et <b>3 entretiens</b> cette semaine.</p>
        <div className="dp-hero-cta">
          <button className="dp-btn dp-btn-gold"><Plus size={16} /> Publier une offre</button>
          <button className="dp-btn dp-btn-ghost">Voir les candidats <ArrowUpRight size={16} /></button>
        </div>
      </section>

      <section className="dp-kpis">
        {KPIS.map((k, i) => <Kpi key={k.label} k={k} i={i + 1} />)}
      </section>

      <div className="dp-cols">
        <div className="dp-col">
          <article className="dp-card dp-in" style={{ '--i': 5 }}>
            <Head title="Candidatures reçues" sub={`${total} sur la période · +12 % vs précédente`}
              right={
                <div className="dp-seg">
                  {Object.keys(SERIES).map((r) => (
                    <button key={r} className={r === range ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>
                  ))}
                </div>
              } />
            <AreaChart key={range} data={s.data} labels={s.labels} />
          </article>

          <article className="dp-card dp-in" style={{ '--i': 6 }}>
            <Head title="Entonnoir de recrutement" sub="De la candidature à l'embauche" />
            <ul className="dp-funnel">
              {FUNNEL.map(([name, n], i) => (
                <li key={name}>
                  <div className="dp-funnel-row"><span>{name}</span><b>{n}</b></div>
                  <div className="dp-bar"><i style={{ width: mounted ? `${(n / FUNNEL[0][1]) * 100}%` : '0%', transitionDelay: `${i * 90}ms` }} /></div>
                </li>
              ))}
            </ul>
          </article>

          <article className="dp-card dp-in" style={{ '--i': 7 }}>
            <Head title="Offres en cours" sub="Avancement du recrutement"
              right={<button className="dp-link">Tout voir <ChevronRight size={14} /></button>} />
            <ul className="dp-offers">
              {OFFERS.map((o) => (
                <li key={o.title} className="dp-offer">
                  <div className="dp-offer-top">
                    <div className="dp-offer-main"><strong>{o.title}</strong><span>{o.place} · {o.type}</span></div>
                    <div className="dp-offer-side">
                      <span className={`dp-badge ${o.tone}`}>{o.status}</span>
                      <span className="dp-offer-n"><Users size={13} />{o.n}</span>
                    </div>
                  </div>
                  <div className="dp-bar"><i style={{ width: mounted ? `${o.p}%` : '0%' }} /></div>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="dp-col">
          <article className="dp-card dp-in" style={{ '--i': 5 }}>
            <Head title="Talents recommandés" sub="Les meilleurs profils pour vos offres" />
            <ul className="dp-talents">
              {TALENTS.map((t) => (
                <li key={t.name}>
                  <span className="dp-avatar">{t.ini}</span>
                  <div className="dp-talent-txt"><strong>{t.name}</strong><span>{t.tag} · {t.skills}</span></div>
                  <div className="dp-ring" style={{ '--v': t.match }}><span>{t.match}%</span></div>
                </li>
              ))}
            </ul>
          </article>

          <article className="dp-card dp-in" style={{ '--i': 6 }}>
            <Head title="Entretiens à venir" sub="Cette semaine" />
            <ul className="dp-timeline">
              {INTERVIEWS.map((it) => {
                const Icon = it.icon
                return (
                  <li key={it.who}>
                    <div className="dp-time"><b>{it.hour}</b><span>{it.when}</span></div>
                    <div className="dp-int">
                      <strong>{it.who}</strong>
                      <span>{it.role}</span>
                      <em><Icon size={12} /> {it.mode}</em>
                    </div>
                  </li>
                )
              })}
            </ul>
          </article>

          <article className="dp-card dp-in" style={{ '--i': 7 }}>
            <Head title="Activité récente" />
            <ul className="dp-feed">
              {ACTIVITY.map((a) => {
                const Icon = a.icon
                return (
                  <li key={a.text}>
                    <span className="dp-ico sm" style={{ '--c': a.c }}><Icon size={14} /></span>
                    <div><p>{a.text}</p><small><Clock size={11} /> {a.time}</small></div>
                  </li>
                )
              })}
            </ul>
          </article>
        </div>
      </div>
    </div>
  )
}