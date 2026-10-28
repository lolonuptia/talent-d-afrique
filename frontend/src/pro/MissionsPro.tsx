// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, ClipboardList, Flag, Loader2, MessageSquare, Plus, Search, Send, Sparkles, Trash2, TrendingUp, X } from "lucide-react";
import { api, list } from "../api";
import { Err, fdate, useLoad } from "../ui";
import { Field, Tags } from "../forms-pro/FormsPro";
import "../forms-pro/forms-pro.css";

const STAT = { en_cours: "En cours", en_pause: "En pause", terminee: "Terminée", annulee: "Annulée" };
const COLOR = { en_cours: "#0f9d73", en_pause: "#f59e0b", terminee: "#3b82f6", annulee: "#94a3b8" };
const ini = (s) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const fd = (d) => (d ? new Date(d + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");
const late = (m) => m.statut === "en_cours" && m.date_fin && new Date(m.date_fin + "T23:59:59") < new Date();
const left = (m) => Math.ceil((new Date(m.date_fin + "T23:59:59") - new Date()) / 864e5);

function Card({ m, open, toggle, act }) {
  const [val, setVal] = useState(m.avancement);
  const [note, setNote] = useState("");
  const [jal, setJal] = useState("");
  const [sure, setSure] = useState(false);
  useEffect(() => setVal(m.avancement), [m.avancement]);
  const isLate = late(m);
  const color = isLate ? "#ef4444" : COLOR[m.statut] || "#0f9d73";
  const done = m.jalons.filter((j) => j.fait).length;
  const closed = m.statut === "terminee" || m.statut === "annulee";
  const commit = () => { if (val !== m.avancement) act(() => api("/missions/" + m.id, "PATCH", { avancement: val }), "Avancement mis à jour"); };
  const addJalon = () => { if (!jal.trim()) return; const t = jal.trim(); setJal(""); act(() => api("/missions/" + m.id + "/jalons", "POST", { titre: t })); };
  const addNote = () => { if (!note.trim()) return; const t = note.trim(); setNote(""); act(() => api("/missions/" + m.id + "/notes", "POST", { contenu: t }), "Mise à jour ajoutée"); };

  return (
    <article className="mi-card fp-card" style={{ "--c": color }}>
      <header className="mi-top">
        <span className="mi-ava">{ini(m.candidat_nom)}</span>
        <div className="mi-id">
          <h3>{m.titre}</h3>
          <small>{m.candidat_nom} · {m.offre_titre}</small>
        </div>
        <span className="mi-badge" style={{ "--c": COLOR[m.statut] }}>{STAT[m.statut] || m.statut}</span>
      </header>

      <div className="mi-prog">
        <div className="mi-bar"><i style={{ width: val + "%" }} /></div>
        <b>{val}%</b>
      </div>
      <input className="cp-range" type="range" min="0" max="100" step="5" value={val} disabled={closed}
        onChange={(e) => setVal(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit}
        title={m.jalons.length ? "Avec des jalons, l'avancement suit les jalons cochés." : "Réglez l'avancement"} />

      <div className="mi-meta">
        {(m.date_debut || m.date_fin) && <span><CalendarDays size={13} />{fd(m.date_debut) || "…"} → {fd(m.date_fin) || "…"}</span>}
        {m.jalons.length > 0 && <span><Flag size={13} />{done}/{m.jalons.length} jalons</span>}
        {isLate && <span className="mi-late"><AlertTriangle size={13} />En retard de {Math.abs(left(m))} j</span>}
        {!isLate && m.statut === "en_cours" && m.date_fin && <span>{left(m) === 0 ? "Se termine aujourd'hui" : left(m) + " j restants"}</span>}
      </div>

      <button className="mi-toggle" onClick={toggle}>{open ? <><ChevronUp size={15} />Masquer</> : <><ChevronDown size={15} />Détails, jalons et mises à jour</>}</button>

      {open && (
        <div className="mi-detail">
          {m.description && <p className="mi-desc">{m.description}</p>}
          <div className="mi-cols">
            <section>
              <h4><Flag size={13} />Jalons</h4>
              <ul className="mi-jalons">
                {m.jalons.map((j) => (
                  <li key={j.id} className={j.fait ? "done" : ""}>
                    <button className="mi-check" onClick={() => act(() => api("/missions/jalons/" + j.id, "PATCH", { fait: !j.fait }))} aria-label="Cocher">{j.fait && <CheckCircle2 size={16} />}</button>
                    <span>{j.titre}</span>
                    <button className="mi-x" onClick={() => act(() => api("/missions/jalons/" + j.id, "DELETE"))} aria-label="Supprimer"><X size={14} /></button>
                  </li>
                ))}
                {!m.jalons.length && <li className="none">Aucun jalon.</li>}
              </ul>
              <div className="mi-add">
                <input className="fp-input" placeholder="Nouveau jalon…" value={jal} onChange={(e) => setJal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addJalon()} />
                <button className="fp-btn ep-small" onClick={addJalon}><Plus size={14} /></button>
              </div>
            </section>
            <section>
              <h4><MessageSquare size={13} />Mises à jour</h4>
              <div className="mi-add">
                <input className="fp-input" placeholder="Point d'avancement…" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <button className="fp-btn ep-small" onClick={addNote}><Send size={14} /></button>
              </div>
              <ul className="mi-notes">
                {m.notes.map((n) => (
                  <li key={n.id}><p>{n.contenu}</p><small>{fdate(n.created_at)}{n.avancement != null ? " · " + n.avancement + "%" : ""}</small></li>
                ))}
                {!m.notes.length && <li className="none">Aucune mise à jour.</li>}
              </ul>
            </section>
          </div>
          <div className="mi-foot">
            <select className="fp-input" style={{ width: "auto", padding: "8px 12px", fontSize: 13, fontWeight: 700 }} value={m.statut}
              onChange={(e) => act(() => api("/missions/" + m.id, "PATCH", { statut: e.target.value }), "Statut mis à jour")}>
              {Object.entries(STAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {sure
              ? <><button className="fp-btn danger ep-small" onClick={() => act(() => api("/missions/" + m.id, "DELETE"), "Mission supprimée")}><Trash2 size={14} />Confirmer</button><button className="fp-btn ep-small" onClick={() => setSure(false)}>Annuler</button></>
              : <button className="fp-btn ep-small" onClick={() => setSure(true)}><Trash2 size={14} />Supprimer</button>}
          </div>
        </div>
      )}
    </article>
  );
}

function NewMission({ cands, onClose, onDone }) {
  const [f, setF] = useState({ cid: "", titre: "", description: "", debut: "", fin: "" });
  const [jalons, setJalons] = useState([]);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const err = {};
  if (!f.cid) err.cid = "Choisissez un candidat.";
  if (f.titre.trim().length < 2) err.titre = "Donnez un titre à la mission.";
  if (f.debut && f.fin && f.fin < f.debut) err.fin = "La fin doit suivre le début.";
  const E = tried ? err : {};
  const pick = (id) => { const c = cands.find((x) => x.id === id); setF((s) => ({ ...s, cid: id, titre: s.titre || (c ? c.offre_titre : "") })); };
  const submit = async () => {
    setTried(true);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await api("/missions", "POST", { candidature_id: f.cid, titre: f.titre.trim(), description: f.description || null, date_debut: f.debut || null, date_fin: f.fin || null, jalons });
      toast.success("Mission créée"); onDone();
    } catch (x) { toast.error(x.message); setBusy(false); }
  };
  return (
    <div className="mi-overlay" onClick={() => !busy && onClose()}>
      <div className="mi-modal fp-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="fp-card-head"><div><h2>Nouvelle mission</h2><p>Suivez le travail d'un candidat retenu.</p></div><button className="mi-x" onClick={onClose} aria-label="Fermer"><X size={18} /></button></header>
        {!cands.length ? (
          <p style={{ color: "var(--fp-muted)", fontSize: 14 }}>Aucun candidat accepté pour l'instant. Passez un candidat au statut « acceptée » depuis <Link to="/candidats" style={{ color: "var(--fp-g2)" }}>Candidats</Link>.</p>
        ) : (
          <div className="fp-body" style={{ margin: "6px 0 14px" }}>
            <Field label="Candidat accepté" required error={E.cid}>
              <select className="fp-input" value={f.cid} onChange={(e) => pick(e.target.value)}>
                <option value="">Choisir…</option>
                {cands.map((c) => <option key={c.id} value={c.id}>{c.candidat_nom} — {c.offre_titre}</option>)}
              </select>
            </Field>
            <Field label="Titre de la mission" required error={E.titre}><input className="fp-input" maxLength={200} value={f.titre} onChange={(e) => set("titre")(e.target.value)} /></Field>
            <Field label="Description"><textarea className="fp-input" rows={3} value={f.description} onChange={(e) => set("description")(e.target.value)} /></Field>
            <div className="fp-grid2">
              <Field label="Début"><input className="fp-input" type="date" value={f.debut} onChange={(e) => set("debut")(e.target.value)} /></Field>
              <Field label="Fin prévue" error={E.fin}><input className="fp-input" type="date" value={f.fin} onChange={(e) => set("fin")(e.target.value)} /></Field>
            </div>
            <Field label="Jalons" hint="Optionnel. L'avancement suivra les jalons cochés.">
              <Tags value={jalons} onChange={setJalons} suggestions={["Cadrage", "Maquettes", "Développement", "Tests", "Livraison"]} placeholder="Ex : Maquettes" />
            </Field>
          </div>
        )}
        <footer className="fp-actions">
          <button className="fp-btn" disabled={busy} onClick={onClose}>Annuler</button>
          {cands.length > 0 && <button className="fp-btn solid" disabled={busy} onClick={submit}>{busy ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}Créer la mission</button>}
        </footer>
      </div>
    </div>
  );
}

export default function MissionsPro() {
  const [st, setSt] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const s = useLoad(async () => {
    const [missions, cands] = await Promise.all([list("/missions"), list("/candidatures/recues").catch(() => [])]);
    return { missions, cands };
  }, [], 60000);
  const missions = s.data?.missions || [];
  const acceptes = (s.data?.cands || []).filter((c) => c.statut === "acceptee");

  const act = async (fn, ok) => {
    try { await fn(); if (ok) toast.success(ok); s.reload(); } catch (x) { toast.error(x.message); }
  };

  const enCours = missions.filter((m) => m.statut === "en_cours");
  const avg = enCours.length ? Math.round(enCours.reduce((a, m) => a + m.avancement, 0) / enCours.length) : 0;
  const retard = missions.filter(late).length;
  const termin = missions.filter((m) => m.statut === "terminee").length;
  const count = (v) => missions.filter((m) => !v || m.statut === v).length;
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    return missions.filter((m) => (!st || m.statut === st) && (m.titre + " " + m.candidat_nom + " " + m.offre_titre).toLowerCase().includes(k));
  }, [missions, st, q]);

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="cp-hero-top">
          <div>
            <span className="fp-hero-chip"><Sparkles size={14} />Suivi des talents retenus</span>
            <h1>Missions</h1>
            <p>Suivez l'avancement des projets confiés à vos candidats acceptés.</p>
          </div>
          <button className="fp-btn gold" style={{ margin: 0 }} onClick={() => setCreating(true)}><Plus size={16} />Nouvelle mission</button>
        </div>
        <div className="ep-stats">
          <div><b>{enCours.length}</b> en cours</div>
          <div><b>{avg}%</b> avancement moyen</div>
          <div><b>{termin}</b> terminées</div>
          <div><b>{retard}</b> en retard</div>
        </div>
      </section>

      <section className="fp-card op-tools">
        <label className="mp-search" style={{ margin: 0 }}><Search size={16} /><input placeholder="Rechercher une mission, un candidat…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="cp-pills">
          {["", ...Object.keys(STAT)].map((v) => <button key={v || "all"} className={st === v ? "on" : ""} onClick={() => setSt(v)}>{v ? STAT[v] : "Toutes"} · {count(v)}</button>)}
        </div>
      </section>

      <Err e={s.error} />
      {s.data === undefined && !s.error && <p style={{ opacity: 0.6 }}>Chargement…</p>}
      {s.data !== undefined && (shown.length ? (
        <div className="mi-list">{shown.map((m) => <Card key={m.id} m={m} open={open === m.id} toggle={() => setOpen(open === m.id ? null : m.id)} act={act} />)}</div>
      ) : (
        <div className="fp-card ep-empty">
          <ClipboardList size={32} style={{ margin: "0 auto 8px", display: "block" }} />
          <b>{missions.length ? "Aucun résultat" : "Aucune mission"}</b>
          <p>{missions.length ? "Essayez un autre filtre." : "Créez une mission pour suivre le travail d'un candidat accepté."}</p>
        </div>
      ))}

      {creating && <NewMission cands={acceptes} onClose={() => setCreating(false)} onDone={() => { setCreating(false); s.reload(); }} />}
    </div>
  );
}