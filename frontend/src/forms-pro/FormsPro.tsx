// @ts-nocheck
import { useEffect, useMemo, useState } from 'react'
import {
  Briefcase, MapPin, CalendarDays, Clock, Video, Building2, Phone, Check, ChevronLeft,
  ChevronRight, Send, X, Globe, Save, Eye, Sparkles, PartyPopper,
} from 'lucide-react'
import './forms-pro.css'

/* ================= KIT DE CHAMPS REUTILISABLE ================= */
export function Field({ label, hint, error, required, right, children }) {
  return (
    <div className={`fp-field ${error ? 'err' : ''}`}>
      <div className="fp-lab"><span>{label}{required && <i>*</i>}</span>{right && <em>{right}</em>}</div>
      {children}
      {error ? <small className="fp-error">{error}</small> : hint ? <small className="fp-hint">{hint}</small> : null}
    </div>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="fp-seg" role="radiogroup">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <button key={v} type="button" role="radio" aria-checked={v === value}
            className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>
        )
      })}
    </div>
  )
}

export function Tags({ value, onChange, suggestions = [], placeholder }) {
  const [t, setT] = useState('')
  const add = (s) => { s = s.trim(); if (s && !value.includes(s)) onChange([...value, s]); setT('') }
  return (
    <div>
      <div className="fp-tags">
        {value.map((v) => (
          <span key={v} className="fp-tag">{v}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label="Retirer"><X size={12} /></button>
          </span>
        ))}
        <input value={t} placeholder={value.length ? '' : placeholder} onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(t) }
            else if (e.key === 'Backspace' && !t && value.length) onChange(value.slice(0, -1))
          }} />
      </div>
      <div className="fp-sugg">
        {suggestions.filter((s) => !value.includes(s)).slice(0, 8).map((s) => (
          <button type="button" key={s} onClick={() => add(s)}>+ {s}</button>
        ))}
      </div>
    </div>
  )
}

function Steps({ steps, current }) {
  return (
    <ol className="fp-steps">
      {steps.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'cur' : ''}>
          <span>{i < current ? <Check size={14} /> : i + 1}</span><b>{s}</b>
        </li>
      ))}
    </ol>
  )
}

const today = () => new Date().toISOString().slice(0, 10)

/* ================= 1. ASSISTANT « PUBLIER UNE OFFRE » ================= */
const EMPTY = { title: '', type: 'CDI', city: '', remote: false, desc: '', skills: [], exp: '2-5', min: '', max: '', cur: 'XOF', deadline: '' }
const OFFER_STEPS = ['Poste', 'Détails', 'Conditions', 'Récap']
const SKILLS = ['React', 'TypeScript', 'Python', 'FastAPI', 'SQL', 'Node.js', 'Figma', 'Docker', 'AWS', 'Flutter']

function validateOffer(step, f) {
  const e = {}
  if (step === 0) {
    if (f.title.trim().length < 5) e.title = 'Donnez un intitulé d’au moins 5 caractères.'
    if (!f.city.trim() && !f.remote) e.city = 'Indiquez une ville ou activez le télétravail.'
  }
  if (step === 1) {
    if (f.desc.trim().length < 60) e.desc = `Encore ${60 - f.desc.trim().length} caractères minimum pour une description utile.`
    if (f.skills.length < 1) e.skills = 'Ajoutez au moins une compétence.'
  }
  if (step === 2) {
    if (f.min && f.max && Number(f.min) > Number(f.max)) e.max = 'Le maximum doit dépasser le minimum.'
    if (!f.deadline) e.deadline = 'Choisissez une date limite.'
    else if (f.deadline < today()) e.deadline = 'La date doit être dans le futur.'
  }
  return e
}

export function OfferWizard({ onDone = () => {} }) {
  const [step, setStep] = useState(0)
  const [f, setF] = useState(() => {
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem('fp-offer-draft') || '{}') } } catch { return EMPTY }
  })
  const [tried, setTried] = useState(false)
  const [saved, setSaved] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const inp = (k) => ({ value: f[k], onChange: (e) => set(k)(e.target.value) })

  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem('fp-offer-draft', JSON.stringify(f)); setSaved(true) } catch {}
    }, 500)
    setSaved(false)
    return () => clearTimeout(t)
  }, [f])

  const errors = validateOffer(step, f)
  const next = () => {
    setTried(true)
    if (Object.keys(errors).length) return
    setTried(false); setStep((s) => s + 1)
  }
  const publish = () => {
    try { localStorage.removeItem('fp-offer-draft') } catch {}
    setDone(true); onDone('Offre publiée avec succès')
  }
  const reset = () => { setF(EMPTY); setStep(0); setDone(false); setTried(false) }
  const E = tried ? errors : {}
  const salary = f.min || f.max ? `${f.min || '…'} – ${f.max || '…'} ${f.cur}` : 'À négocier'

  if (done) {
    return (
      <div className="fp-card fp-success">
        <span><PartyPopper size={34} /></span>
        <h2>Votre offre est en ligne</h2>
        <p>« {f.title} » est visible par les talents. Vous serez notifié à chaque nouvelle candidature.</p>
        <button className="fp-btn solid" onClick={reset}>Créer une autre offre</button>
      </div>
    )
  }

  return (
    <div className="fp-split">
      <div className="fp-card">
        <header className="fp-card-head">
          <div><h2>Publier une offre</h2><p>Étape {step + 1} sur 4</p></div>
          <span className={`fp-save ${saved ? 'ok' : ''}`}><Save size={13} />{saved ? 'Brouillon enregistré' : 'Enregistrement…'}</span>
        </header>
        <Steps steps={OFFER_STEPS} current={step} />

        <div className="fp-body">
          {step === 0 && (<>
            <Field label="Intitulé du poste" required error={E.title} hint="Soyez précis : « Développeur React Senior » attire mieux que « Développeur ».">
              <input className="fp-input" placeholder="Ex : Développeur React Senior" {...inp('title')} />
            </Field>
            <Field label="Type de contrat">
              <Segmented options={['CDI', 'CDD', 'Freelance', 'Stage']} value={f.type} onChange={set('type')} />
            </Field>
            <Field label="Ville" required error={E.city}>
              <input className="fp-input" placeholder="Ex : Dakar" disabled={f.remote && !f.city} {...inp('city')} />
            </Field>
            <label className="fp-switch">
              <input type="checkbox" checked={f.remote} onChange={(e) => set('remote')(e.target.checked)} />
              <i /><span>Télétravail possible</span>
            </label>
          </>)}

          {step === 1 && (<>
            <Field label="Description" required error={E.desc} right={`${f.desc.length} / 1200`}>
              <textarea className="fp-input" rows={6} maxLength={1200} placeholder="Missions, contexte, profil recherché…" {...inp('desc')} />
            </Field>
            <Field label="Compétences requises" required error={E.skills} hint="Tapez puis Entrée, ou cliquez une suggestion.">
              <Tags value={f.skills} onChange={set('skills')} suggestions={SKILLS} placeholder="Ex : React" />
            </Field>
            <Field label="Expérience">
              <Segmented options={[{ value: '0-2', label: '0–2 ans' }, { value: '2-5', label: '2–5 ans' }, { value: '5+', label: '5 ans +' }]} value={f.exp} onChange={set('exp')} />
            </Field>
          </>)}

          {step === 2 && (<>
            <div className="fp-grid2">
              <Field label="Salaire / TJM min"><input className="fp-input" type="number" min="0" placeholder="0" {...inp('min')} /></Field>
              <Field label="Salaire / TJM max" error={E.max}><input className="fp-input" type="number" min="0" placeholder="0" {...inp('max')} /></Field>
            </div>
            <Field label="Devise">
              <Segmented options={['XOF', 'EUR', 'USD', 'MAD']} value={f.cur} onChange={set('cur')} />
            </Field>
            <Field label="Date limite de candidature" required error={E.deadline}>
              <input className="fp-input" type="date" min={today()} {...inp('deadline')} />
            </Field>
          </>)}

          {step === 3 && (
            <div className="fp-recap">
              <p className="fp-hint">Vérifiez les informations avant de publier.</p>
              {[['Poste', f.title], ['Contrat', f.type], ['Lieu', f.remote ? `${f.city || 'Remote'} · télétravail` : f.city],
                ['Compétences', f.skills.join(', ')], ['Expérience', f.exp + ' ans'], ['Rémunération', salary], ['Date limite', f.deadline]]
                .map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
            </div>
          )}
        </div>

        <footer className="fp-actions">
          <button className="fp-btn" disabled={step === 0} onClick={() => { setTried(false); setStep((s) => s - 1) }}><ChevronLeft size={16} />Retour</button>
          {step < 3
            ? <button className="fp-btn solid" onClick={next}>Continuer<ChevronRight size={16} /></button>
            : <button className="fp-btn gold" onClick={publish}><Send size={16} />Publier l’offre</button>}
        </footer>
      </div>

      <aside className="fp-preview">
        <span className="fp-prev-lab"><Eye size={14} />Aperçu en direct</span>
        <div className="fp-card fp-offer">
          <div className="fp-offer-top">
            <span className="fp-logo"><Building2 size={20} /></span>
            <div><b>{f.title || 'Intitulé du poste'}</b><small>Entreprise Test</small></div>
          </div>
          <div className="fp-chips">
            <span><Briefcase size={12} />{f.type}</span>
            <span><MapPin size={12} />{f.city || (f.remote ? 'Remote' : 'Ville')}</span>
            {f.remote && <span><Globe size={12} />Télétravail</span>}
          </div>
          <p>{f.desc ? f.desc.slice(0, 140) + (f.desc.length > 140 ? '…' : '') : 'La description de votre offre apparaîtra ici.'}</p>
          <div className="fp-minitags">{f.skills.slice(0, 4).map((s) => <span key={s}>{s}</span>)}</div>
          <div className="fp-offer-foot"><b>{salary}</b><small>{f.deadline ? `Jusqu’au ${f.deadline}` : ''}</small></div>
        </div>
      </aside>
    </div>
  )
}

/* ================= 2. PROFIL ENTREPRISE ================= */
const COMPANY0 = {
  name: 'Entreprise Test', sector: 'Technologie', size: '11-50', website: 'https://exemple.com',
  city: 'Dakar', about: 'Nous construisons des produits numériques pour l’Afrique.', perks: ['Télétravail', 'Mutuelle'],
}

export function CompanyProfileForm({ onDone = () => {} }) {
  const [base, setBase] = useState(COMPANY0)
  const [f, setF] = useState(COMPANY0)
  const [tried, setTried] = useState(false)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const inp = (k) => ({ value: f[k], onChange: (e) => set(k)(e.target.value) })
  const dirty = JSON.stringify(f) !== JSON.stringify(base)

  const e = {}
  if (f.name.trim().length < 2) e.name = 'Le nom est obligatoire.'
  if (f.website && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(f.website)) e.website = 'Format attendu : https://monsite.com'
  const E = tried ? e : {}
  const ini = f.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?'

  const save = () => {
    setTried(true)
    if (Object.keys(e).length) return
    setBase(f); setTried(false); onDone('Profil entreprise enregistré')
  }

  return (
    <div className="fp-card">
      <header className="fp-card-head">
        <div><h2>Profil entreprise</h2><p>Ces informations sont visibles par les talents.</p></div>
        {dirty && <span className="fp-save">Modifications non enregistrées</span>}
      </header>
      <div className="fp-company-id"><span className="fp-logo lg">{ini}</span>
        <div><b>{f.name || 'Nom de l’entreprise'}</b><small>{f.sector} · {f.city}</small></div></div>
      <div className="fp-body">
        <div className="fp-grid2">
          <Field label="Nom" required error={E.name}><input className="fp-input" {...inp('name')} /></Field>
          <Field label="Secteur">
            <select className="fp-input" {...inp('sector')}>
              {['Technologie', 'Finance', 'Santé', 'Éducation', 'Logistique', 'Commerce', 'Autre'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Ville"><input className="fp-input" {...inp('city')} /></Field>
          <Field label="Site web" error={E.website}><input className="fp-input" placeholder="https://…" {...inp('website')} /></Field>
        </div>
        <Field label="Taille de l’équipe">
          <Segmented options={['1-10', '11-50', '51-200', '200+']} value={f.size} onChange={set('size')} />
        </Field>
        <Field label="À propos" right={`${f.about.length} / 400`}>
          <textarea className="fp-input" rows={4} maxLength={400} {...inp('about')} />
        </Field>
        <Field label="Avantages proposés">
          <Tags value={f.perks} onChange={set('perks')} suggestions={['Télétravail', 'Mutuelle', 'Formation', 'Transport', 'Primes']} placeholder="Ajouter un avantage" />
        </Field>
      </div>
      <footer className="fp-actions">
        <button className="fp-btn" disabled={!dirty} onClick={() => { setF(base); setTried(false) }}>Annuler</button>
        <button className="fp-btn solid" disabled={!dirty} onClick={save}><Save size={16} />Enregistrer</button>
      </footer>
    </div>
  )
}

/* ================= 3. PLANIFIER UN ENTRETIEN ================= */
const CANDS = ['Amina Yusuf', 'Aminata Diallo', 'Cheikh Fall', 'Moussa Ndiaye']
const OFFERS = ['Développeur React Senior', 'Backend Python / FastAPI', 'Stagiaire Data Analyst']
const SLOTS = ['09:00', '09:30', '10:00', '11:00', '14:00', '14:30', '15:30', '16:00', '17:00']
const BUSY = ['09:30', '14:30']
const MODES = [{ value: 'visio', label: 'Visio', icon: Video }, { value: 'site', label: 'Sur site', icon: MapPin }, { value: 'tel', label: 'Téléphone', icon: Phone }]

export function InterviewForm({ onDone = () => {} }) {
  const [f, setF] = useState({ cand: '', offer: '', date: '', slot: '', mode: 'visio', note: '' })
  const [tried, setTried] = useState(false)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))

  const e = {}
  if (!f.cand) e.cand = 'Choisissez un talent.'
  if (!f.offer) e.offer = 'Choisissez l’offre concernée.'
  if (!f.date) e.date = 'Choisissez une date.'
  else if (f.date < today()) e.date = 'La date doit être dans le futur.'
  if (!f.slot) e.slot = 'Sélectionnez un créneau.'
  const E = tried ? e : {}

  const submit = () => {
    setTried(true)
    if (Object.keys(e).length) return
    onDone(`Invitation envoyée à ${f.cand}`)
    setF({ cand: '', offer: '', date: '', slot: '', mode: 'visio', note: '' }); setTried(false)
  }

  return (
    <div className="fp-card">
      <header className="fp-card-head"><div><h2>Planifier un entretien</h2><p>Le talent reçoit l’invitation immédiatement.</p></div></header>
      <div className="fp-body">
        <div className="fp-grid2">
          <Field label="Talent" required error={E.cand}>
            <select className="fp-input" value={f.cand} onChange={(x) => set('cand')(x.target.value)}>
              <option value="">Sélectionner…</option>{CANDS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Offre" required error={E.offer}>
            <select className="fp-input" value={f.offer} onChange={(x) => set('offer')(x.target.value)}>
              <option value="">Sélectionner…</option>{OFFERS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Date" required error={E.date}>
          <input className="fp-input" type="date" min={today()} value={f.date} onChange={(x) => set('date')(x.target.value)} />
        </Field>
        <Field label="Créneau" required error={E.slot}>
          <div className="fp-slots">
            {SLOTS.map((s) => (
              <button key={s} type="button" disabled={BUSY.includes(s)} className={f.slot === s ? 'on' : ''} onClick={() => set('slot')(s)}>
                <Clock size={12} />{s}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Mode">
          <div className="fp-modes">
            {MODES.map((m) => { const I = m.icon; return (
              <button key={m.value} type="button" className={f.mode === m.value ? 'on' : ''} onClick={() => set('mode')(m.value)}><I size={16} />{m.label}</button>
            ) })}
          </div>
        </Field>
        <Field label="Message (facultatif)" right={`${f.note.length} / 300`}>
          <textarea className="fp-input" rows={3} maxLength={300} placeholder="Précisez le déroulé, les documents à préparer…" value={f.note} onChange={(x) => set('note')(x.target.value)} />
        </Field>
      </div>
      <footer className="fp-actions">
        <button className="fp-btn solid" onClick={submit}><CalendarDays size={16} />Envoyer l’invitation</button>
      </footer>
    </div>
  )
}

/* ================= PAGE DE DÉMO ================= */
export default function FormsPro() {
  const [tab, setTab] = useState('offer')
  const [toast, setToast] = useState('')
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) }, [toast])
  const tabs = [['offer', 'Publier une offre'], ['company', 'Profil entreprise'], ['interview', 'Entretien']]
  return (
    <div className="fp">
      <section className="fp-hero">
        <span className="fp-hero-chip"><Sparkles size={14} />Formulaires</span>
        <h1>Gérez votre recrutement</h1>
        <p>Publiez, configurez et planifiez en quelques clics.</p>
      </section>
      <div className="fp-tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'offer' && <OfferWizard onDone={setToast} />}
      {tab === 'company' && <CompanyProfileForm onDone={setToast} />}
      {tab === 'interview' && <InterviewForm onDone={setToast} />}
      {toast && <div className="fp-toast"><Check size={16} />{toast}</div>}
    </div>
  )
}