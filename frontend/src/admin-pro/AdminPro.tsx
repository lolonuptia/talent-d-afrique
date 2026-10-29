// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, Ban, Briefcase, Building2, ChevronLeft, ChevronRight, Download, Eye, FileText, GraduationCap,
  KeyRound, Laptop, Loader2, LogOut, Megaphone, MailCheck, Percent, RotateCcw, School, ScrollText, Search, Send,
  ShieldAlert, ShieldCheck, ShieldOff, Sparkles, Trash2, Users, X, CheckCircle2, Bell,
} from "lucide-react";
import { C, api, list, qs, saveFile } from "../api";
import { useAuth } from "../auth";
import { Err, fdate } from "../ui";
import { useLoad } from "../ui";
import { Field } from "../forms-pro/FormsPro";
import "../forms-pro/forms-pro.css";
import "./admin-pro.css";

const PAGE = 50;
const PROFIL = { etudiant: "Étudiant", freelance: "Freelance", entreprise: "Entreprise", ecole: "École" };
const PCOLOR = { etudiant: "#3b82f6", freelance: "#a855f7", entreprise: "#f59e0b", ecole: "#14a07a" };
const STATUT = { actif: "Actif", suspendu: "Suspendu", supprime: "Supprimé" };
const SCOLOR = { actif: "#0f9d73", suspendu: "#ef4444", supprime: "#94a3b8" };
const OCOLOR = { active: "#0f9d73", expiree: "#f59e0b", archivee: "#94a3b8" };
const OLAB = { active: "Active", expiree: "Expirée", archivee: "Archivée" };
const ini = (s) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const lab = (s) => String(s || "").replace(/_/g, " ");

export const ACTIONS = {
  suspension_compte: "Compte suspendu", reactivation_compte: "Compte réactivé", suppression_offre: "Offre supprimée",
  archivage_offre_moderation: "Offre archivée (modération)", verification_email_manuelle: "Email confirmé manuellement",
  promotion_admin: "Rôle admin accordé", retrait_admin: "Rôle admin retiré", deconnexion_forcee: "Sessions fermées",
  lien_reinitialisation_envoye: "Lien de réinitialisation envoyé", purge_compte: "Compte effacé définitivement",
  annonce: "Annonce envoyée", export_donnees: "Export de données",
};
const AMETA = {
  suspension_compte: [Ban, "#ef4444"], reactivation_compte: [RotateCcw, "#0f9d73"], suppression_offre: [Trash2, "#ef4444"],
  archivage_offre_moderation: [Briefcase, "#f59e0b"], verification_email_manuelle: [MailCheck, "#3b82f6"],
  promotion_admin: [ShieldCheck, "#a855f7"], retrait_admin: [ShieldOff, "#f59e0b"], deconnexion_forcee: [LogOut, "#f59e0b"],
  lien_reinitialisation_envoye: [KeyRound, "#3b82f6"], purge_compte: [Trash2, "#dc2626"], annonce: [Megaphone, "#0f9d73"],
  export_donnees: [Download, "#6366f1"],
};

/* ---------- utilitaires ---------- */
function useDebounced(v, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}
function useCountUp(target, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function Pager({ page, setPage, n }) {
  return (
    <div className="ad-pager">
      <button className="fp-btn ad-sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={15} />Précédent</button>
      <span>Page {page + 1}</span>
      <button className="fp-btn ad-sm" disabled={n < PAGE} onClick={() => setPage(page + 1)}>Suivant<ChevronRight size={15} /></button>
    </div>
  );
}
const Search_ = ({ value, onChange, placeholder }) => (
  <label className="ad-search"><Search size={16} /><input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />{value && <button type="button" onClick={() => onChange("")} aria-label="Effacer"><X size={14} /></button>}</label>
);
const Pills = ({ options, value, onChange }) => (
  <div className="ad-pills">{options.map(([v, l]) => <button key={v || "all"} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>
);
const Skel = ({ n = 4, h = 70 }) => <div className="ad-skels">{Array.from({ length: n }).map((_, i) => <div key={i} className="ad-skel" style={{ height: h }} />)}</div>;
const Empty = ({ icon: I = Search, title, text }) => (
  <div className="fp-card ad-empty"><I size={32} /><b>{title}</b><p>{text}</p></div>
);
const Hero = ({ chip, title, text, right, children }) => (
  <section className="fp-hero">
    <div className="ad-top">
      <div><span className="fp-hero-chip"><Sparkles size={14} />{chip}</span><h1>{title}</h1><p>{text}</p></div>
      {right}
    </div>
    {children}
  </section>
);

/* ---------- fenêtre de confirmation ---------- */
function Dialog({ cfg, onClose }) {
  const [v, setV] = useState(() => Object.fromEntries((cfg.fields || []).map((f) => [f.k, f.value || ""])));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [busy]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await cfg.run(v); onClose(); } catch (x) { toast.error(x.message); setBusy(false); }
  };
  return (
    <div className="ad-overlay" onClick={() => !busy && onClose()}>
      <form className="ad-modal fp-card" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true">
        <span className={"ad-modal-ico" + (cfg.danger ? " danger" : "")}>{cfg.danger ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}</span>
        <h2>{cfg.title}</h2>
        {cfg.text && <p>{cfg.text}</p>}
        {(cfg.fields || []).map((f, i) => (
          <Field key={f.k} label={f.label} hint={f.hint} required={f.required}>
            <input className="fp-input" type={f.type || "text"} required={f.required} autoFocus={i === 0} placeholder={f.placeholder} value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} />
          </Field>
        ))}
        <div className="ad-modal-f">
          <button type="button" className="fp-btn" style={{ margin: 0 }} disabled={busy} onClick={onClose}>Annuler</button>
          <button className={"fp-btn " + (cfg.danger ? "danger" : "solid")} style={{ margin: 0 }} disabled={busy}>{busy && <Loader2 size={16} className="ad-spin" />}{cfg.confirm || "Confirmer"}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- journal : une ligne ---------- */
function LogItem({ x, compact }) {
  const [I, c] = AMETA[x.action] || [ScrollText, "#64748b"];
  return (
    <li className="ad-log" style={{ "--c": c }}>
      <span className="ad-log-ico"><I size={16} /></span>
      <div>
        <b>{ACTIONS[x.action] || lab(x.action)}</b>
        {x.details && <p>{x.details}</p>}
        <small>
          {fdate(x.created_at)} · {x.admin_nom || "—"}
          {!compact && <> · {x.cible_type === "user" ? <Link to={"/admin/utilisateurs/" + x.cible_id}>{String(x.cible_id).slice(0, 8)}</Link> : <>{x.cible_type} {String(x.cible_id).slice(0, 8)}</>}</>}
        </small>
      </div>
    </li>
  );
}

/* ================= TABLEAU DE BORD ================= */
function Kpi({ k, i }) {
  const v = useCountUp(Number(k.value) || 0);
  const Icon = k.icon;
  return (
    <article className="fp-card ad-kpi" style={{ "--c": k.color, animationDelay: i * 45 + "ms" }}>
      <span className="ad-ico"><Icon size={18} /></span>
      <b>{v.toLocaleString("fr-FR")}{k.suffix || ""}</b>
      <small>{k.label}</small>
    </article>
  );
}
function Donut({ parts, total }) {
  const R = 54, CIRC = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 140 140" className="ad-donut" role="img" aria-label="Répartition des comptes">
      <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" opacity=".1" strokeWidth="16" />
      {parts.map((p) => {
        const len = total ? (p.v / total) * CIRC : 0;
        const el = <circle key={p.l} cx="70" cy="70" r={R} fill="none" stroke={p.c} strokeWidth="16" strokeDasharray={len + " " + (CIRC - len)} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />;
        acc += len; return el;
      })}
      <text x="70" y="68" textAnchor="middle" fontSize="26" fontWeight="800" fill="currentColor">{total}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="10" fill="currentColor" opacity=".6">comptes</text>
    </svg>
  );
}
function HBars({ rows, label }) {
  if (!rows.length) return <p className="ad-none">Aucune donnée.</p>;
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <ul className="ad-hb">
      {rows.map((r, i) => (
        <li key={i}><span title={label(r)}>{label(r) || "—"}</span><div><i style={{ width: (100 * r.total) / max + "%" }} /></div><b>{r.total}</b></li>
      ))}
    </ul>
  );
}
function Cols({ rows }) {
  if (!rows.length) return <p className="ad-none">Aucune donnée.</p>;
  const r12 = rows.slice(-12);
  const max = Math.max(1, ...r12.map((r) => r.total));
  return (
    <div className="ad-cols">
      {r12.map((r, i) => (
        <div key={i} title={r.mois + " : " + r.total}>
          <b>{r.total}</b>
          <span className="ad-col-t"><i style={{ height: Math.max(4, (100 * r.total) / max) + "%" }} /></span>
          <small>{String(r.mois).slice(5)}/{String(r.mois).slice(2, 4)}</small>
        </div>
      ))}
    </div>
  );
}

export function AdminHome() {
  const { user } = useAuth();
  const s = useLoad(async () => {
    const [g, d, logs] = await Promise.all([api("/admin/statistiques"), api("/admin/statistiques/detail"), list("/admin/logs" + qs({ limit: 6 })).catch(() => [])]);
    return { g, d, logs };
  }, [], 60000);
  if (s.error) return <div className="fp"><Err e={s.error} /></div>;
  if (!s.data) return <div className="fp"><Skel n={3} h={110} /></div>;
  const { g, d, logs } = s.data;
  const h = new Date().getHours();
  const hello = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
  const kpis = [
    { label: "Comptes", value: g.total_utilisateurs, icon: Users, color: "#0f5d46" },
    { label: "Étudiants", value: g.total_etudiants, icon: GraduationCap, color: "#3b82f6" },
    { label: "Freelances", value: g.total_freelances, icon: Laptop, color: "#a855f7" },
    { label: "Entreprises", value: g.total_entreprises, icon: Building2, color: "#f59e0b" },
    { label: "Écoles", value: g.total_ecoles, icon: School, color: "#14a07a" },
    { label: "Offres actives", value: g.total_offres_actives, icon: Briefcase, color: "#0ea5e9" },
    { label: "Candidatures", value: g.total_candidatures, icon: FileText, color: "#6366f1" },
    { label: "Taux d'acceptation", value: Math.round(g.taux_matching_moyen), suffix: " %", icon: Percent, color: "#10b981" },
    { label: "Comptes suspendus", value: g.comptes_suspendus, icon: ShieldAlert, color: g.comptes_suspendus ? "#dc2626" : "#94a3b8" },
    { label: "Entreprises à vérifier", value: g.entreprises_non_verifiees, icon: ShieldCheck, color: g.entreprises_non_verifiees ? "#f59e0b" : "#94a3b8" },
  ];
  const alerts = [];
  if (g.comptes_suspendus > 0) alerts.push(["warn", ShieldAlert, g.comptes_suspendus + " compte" + (g.comptes_suspendus > 1 ? "s suspendus" : " suspendu"), "/admin/utilisateurs?statut=suspendus"]);
  if (g.entreprises_non_verifiees > 0) alerts.push(["warn", ShieldCheck, g.entreprises_non_verifiees + " entreprise" + (g.entreprises_non_verifiees > 1 ? "s" : "") + " à vérifier", "/admin/utilisateurs?type=entreprise"]);
  const top = [...d.candidatures_par_offre].sort((a, b) => b.total - a.total).slice(0, 8);
  const parts = [
    { l: "Étudiants", v: g.total_etudiants, c: PCOLOR.etudiant }, { l: "Freelances", v: g.total_freelances, c: PCOLOR.freelance },
    { l: "Entreprises", v: g.total_entreprises, c: PCOLOR.entreprise }, { l: "Écoles", v: g.total_ecoles, c: PCOLOR.ecole },
  ];
  return (
    <div className="fp">
      <Hero chip="Espace administration" title={hello + ", " + (user?.nom || "admin") + " 👋"} text="Vue d'ensemble de la plateforme TIBA.">
        <div className="ad-stats">
          <div><b>{g.total_utilisateurs}</b> comptes</div>
          <div><b>{g.total_offres_actives}</b> offres actives</div>
          <div><b>{g.total_candidatures}</b> candidatures</div>
          <div><b>{d.taux_recrutement} %</b> de recrutement</div>
        </div>
      </Hero>

      <div className="ad-alerts">
        {alerts.length ? alerts.map(([t, I, txt, to]) => (
          <Link key={txt} to={to} className="ad-alert warn"><I size={18} /><span>{txt}</span><em>Voir →</em></Link>
        )) : <div className="ad-alert ok"><CheckCircle2 size={18} /><span>Tout est en ordre : aucun compte suspendu ni entreprise à vérifier.</span></div>}
      </div>

      <section className="ad-kpis">{kpis.map((k, i) => <Kpi key={k.label} k={k} i={i} />)}</section>

      <div className="ad-grid2">
        <article className="fp-card"><header className="ad-h"><div><h2>Inscriptions par mois</h2><p>12 derniers mois</p></div></header><Cols rows={d.inscriptions_par_mois} /></article>
        <article className="fp-card">
          <header className="ad-h"><div><h2>Types de comptes</h2><p>Comptes non supprimés</p></div></header>
          <div className="ad-donut-row">
            <Donut parts={parts} total={parts.reduce((a, p) => a + p.v, 0)} />
            <ul className="ad-legend">{parts.map((p) => <li key={p.l}><i style={{ background: p.c }} />{p.l}<b>{p.v}</b></li>)}</ul>
          </div>
        </article>
      </div>

      <div className="ad-grid3">
        <article className="fp-card"><header className="ad-h"><div><h2>Entreprises par secteur</h2></div></header><HBars rows={d.entreprises_par_secteur} label={(r) => r.secteur} /></article>
        <article className="fp-card"><header className="ad-h"><div><h2>Offres par lieu</h2></div></header><HBars rows={d.offres_par_localisation} label={(r) => r.localisation} /></article>
        <article className="fp-card"><header className="ad-h"><div><h2>Offres les plus demandées</h2></div></header><HBars rows={top} label={(r) => r.titre} /></article>
      </div>

      <article className="fp-card">
        <header className="ad-h"><div><h2>Dernières actions</h2><p>Journal d'administration</p></div><Link className="ad-link" to="/admin/journal">Tout voir →</Link></header>
        {logs.length ? <ul className="ad-logs">{logs.map((x) => <LogItem key={x.id} x={x} compact />)}</ul> : <p className="ad-none">Aucune action enregistrée.</p>}
      </article>
    </div>
  );
}

/* ================= UTILISATEURS ================= */
export function AdminUsers() {
  const [sp] = useSearchParams();
  const [q, setQ] = useState("");
  const [type, setType] = useState(sp.get("type") || "");
  const [statut, setStatut] = useState(sp.get("statut") || "");
  const [page, setPage] = useState(0);
  const [dlg, setDlg] = useState(null);
  const dq = useDebounced(q);
  const s = useLoad(() => list("/admin/utilisateurs" + qs({ q: dq, type_profil: type, statut, limit: PAGE, offset: page * PAGE })), [dq, type, statut, page]);
  const rows = s.data || [];
  const act = (path, msg) => async () => { await api(path, "PATCH"); toast.success(msg); s.reload(); };
  const suspendre = (u) => setDlg({
    title: "Suspendre " + u.nom + " ?", danger: true, confirm: "Suspendre",
    text: "Le compte est désactivé sans être supprimé." + (u.type_profil === "entreprise" ? " Ses offres actives seront archivées." : ""),
    fields: [{ k: "motif", label: "Motif (facultatif)", placeholder: "Ex : contenu inapproprié" }],
    run: async (v) => { await api("/admin/utilisateurs/" + u.id + "/suspendre" + qs({ motif: v.motif.trim() }), "PATCH"); toast.success(u.nom + " est suspendu."); s.reload(); },
  });
  return (
    <div className="fp">
      <Hero chip="Comptes" title="Utilisateurs" text="Recherchez, vérifiez et modérez les comptes de la plateforme." />
      <section className="fp-card ad-tools">
        <Search_ value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Rechercher par nom ou email…" />
        <Pills value={type} onChange={(v) => { setType(v); setPage(0); }} options={[["", "Tous les profils"], ...Object.entries(PROFIL)]} />
        <Pills value={statut} onChange={(v) => { setStatut(v); setPage(0); }} options={[["", "Tous statuts"], ["actifs", "Actifs"], ["suspendus", "Suspendus"], ["supprimes", "Supprimés"]]} />
      </section>
      <Err e={s.error} />
      {s.data === undefined && !s.error && <Skel />}
      {s.data !== undefined && (rows.length ? (
        <div className="ad-list">
          {rows.map((u) => (
            <article className="fp-card ad-row" key={u.id} style={{ "--c": SCOLOR[u.statut] || "#94a3b8" }}>
              <div className="ad-who">
                <span className="ad-ava" style={{ background: PCOLOR[u.type_profil] || "#64748b" }}>{ini(u.nom)}</span>
                <div>
                  <b>{u.nom}{u.is_admin && <span className="ad-tag admin">admin</span>}</b>
                  <small>{u.email}{!u.email_verifie && <em> · email non confirmé</em>}</small>
                </div>
              </div>
              <div className="ad-meta">
                <span className="ad-tag" style={{ "--c": PCOLOR[u.type_profil] || "#64748b" }}>{PROFIL[u.type_profil] || u.type_profil}</span>
                <span className="ad-tag" style={{ "--c": SCOLOR[u.statut] || "#94a3b8" }}>{STATUT[u.statut] || u.statut}</span>
                <small>{fdate(u.created_at)}</small>
              </div>
              <div className="ad-acts">
                <Link className="ad-a" to={"/admin/utilisateurs/" + u.id}><Eye size={14} />Fiche</Link>
                {u.statut === "actif" && !u.is_admin && <button className="ad-a del" onClick={() => suspendre(u)}><Ban size={14} />Suspendre</button>}
                {u.statut === "suspendu" && <button className="ad-a" onClick={() => setDlg({ title: "Réactiver " + u.nom + " ?", confirm: "Réactiver", text: "Le compte pourra de nouveau se connecter.", run: act("/admin/utilisateurs/" + u.id + "/reactiver", u.nom + " est réactivé.") })}><RotateCcw size={14} />Réactiver</button>}
                {!u.email_verifie && u.statut !== "supprime" && <button className="ad-a" onClick={() => setDlg({ title: "Confirmer l'email de " + u.nom + " ?", confirm: "Confirmer l'email", text: "Vous confirmez l'adresse à la place de l'utilisateur.", run: act("/admin/utilisateurs/" + u.id + "/verifier-email", "Email de " + u.nom + " confirmé.") })}><MailCheck size={14} />Confirmer l'email</button>}
              </div>
            </article>
          ))}
        </div>
      ) : <Empty title="Aucun compte" text="Aucun compte ne correspond à ces filtres." />)}
      {s.data !== undefined && <Pager page={page} setPage={setPage} n={rows.length} />}
      {dlg && <Dialog cfg={dlg} onClose={() => setDlg(null)} />}
    </div>
  );
}

/* ================= OFFRES ================= */
export function AdminOffres() {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [page, setPage] = useState(0);
  const [dlg, setDlg] = useState(null);
  const dq = useDebounced(q);
  const s = useLoad(() => list("/admin/offres" + qs({ q: dq, statut, limit: PAGE, offset: page * PAGE })), [dq, statut, page]);
  const rows = s.data || [];
  const retirer = (o) => setDlg({
    title: "Retirer « " + o.titre + " » ?", danger: true, confirm: "Retirer l'offre",
    text: o.candidatures > 0 ? "Elle a des candidatures : elle sera archivée, pas supprimée." : "Elle sera supprimée définitivement.",
    fields: [{ k: "motif", label: "Motif (facultatif)", hint: "Transmis à l'entreprise par notification.", placeholder: "Ex : annonce non conforme" }],
    run: async (v) => { const r = await api("/admin/offres/" + o.id + qs({ motif: v.motif.trim() }), "DELETE"); toast.success(r?.message ?? "Offre retirée."); s.reload(); },
  });
  return (
    <div className="fp">
      <Hero chip="Modération" title="Offres" text="Contrôlez les annonces publiées par les entreprises." />
      <section className="fp-card ad-tools">
        <Search_ value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Rechercher par titre ou entreprise…" />
        <Pills value={statut} onChange={(v) => { setStatut(v); setPage(0); }} options={[["", "Toutes"], ...C.statutsOffre.map((v) => [v, OLAB[v] || lab(v)])]} />
      </section>
      <Err e={s.error} />
      {s.data === undefined && !s.error && <Skel n={3} h={150} />}
      {s.data !== undefined && (rows.length ? (
        <div className="ad-cards">
          {rows.map((o) => (
            <article className="fp-card ad-offer" key={o.id} style={{ "--c": OCOLOR[o.statut] || "#94a3b8" }}>
              <header><h3>{o.titre}</h3><span className="ad-tag" style={{ "--c": OCOLOR[o.statut] || "#94a3b8" }}>{OLAB[o.statut] || lab(o.statut)}</span></header>
              <p className="ad-sub"><Building2 size={13} />{o.entreprise}</p>
              <div className="ad-chips">
                {o.type_contrat && <span>{String(o.type_contrat).toUpperCase()}</span>}
                {o.localisation && <span>{o.localisation}</span>}
                <span>{o.candidatures} candidat{o.candidatures > 1 ? "s" : ""}</span>
                <span>{fdate(o.created_at)}</span>
              </div>
              <button className="ad-a del" onClick={() => retirer(o)}><Trash2 size={14} />Retirer</button>
            </article>
          ))}
        </div>
      ) : <Empty icon={Briefcase} title="Aucune offre" text="Aucune offre ne correspond à ces filtres." />)}
      {s.data !== undefined && <Pager page={page} setPage={setPage} n={rows.length} />}
      {dlg && <Dialog cfg={dlg} onClose={() => setDlg(null)} />}
    </div>
  );
}

/* ================= FICHE UTILISATEUR ================= */
export function AdminUserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const s = useLoad(() => api("/admin/utilisateurs/" + id + "/fiche"), [id]);
  const [dlg, setDlg] = useState(null);
  if (s.error) return <div className="fp"><Link className="ad-link" to="/admin/utilisateurs"><ArrowLeft size={14} /> Retour à la liste</Link><Err e={s.error} /></div>;
  if (!s.data) return <div className="fp"><Skel n={3} h={120} /></div>;
  const f = s.data, c = f.compte;
  const moi = c.id === user.id, supprime = f.statut === "supprime";
  const profil = Object.entries(f.profil ?? {}).filter(([k, v]) => v !== null && v !== "" && !["id", "user_id"].includes(k));
  const ok = (r) => { toast.success(r?.message ?? "Fait."); s.reload(); };
  const col = PCOLOR[c.type_profil] || "#64748b";
  return (
    <div className="fp">
      <Link className="ad-link" to="/admin/utilisateurs"><ArrowLeft size={14} /> Retour à la liste</Link>
      <section className="fp-card ad-head" style={{ "--c": col }}>
        <span className="ad-ava lg" style={{ background: col }}>{ini(c.nom)}</span>
        <div className="ad-head-t">
          <h1>{c.nom}{c.is_admin && <span className="ad-tag admin">admin</span>}</h1>
          <p>{c.email}{!c.email_verifie_at && <em> · email non confirmé</em>}</p>
          <div className="ad-chips">
            <span style={{ "--c": col }} className="ad-tag">{PROFIL[c.type_profil] || c.type_profil}</span>
            <span style={{ "--c": SCOLOR[f.statut] || "#94a3b8" }} className="ad-tag">{STATUT[f.statut] || f.statut}</span>
            <span>Inscrit le {fdate(c.created_at)}</span>
          </div>
        </div>
      </section>
      <section className="ad-kpis small">
        {[["Offres", f.compteurs.offres, "#0f5d46", Briefcase], ["Candidatures reçues", f.compteurs.candidatures_recues, "#3b82f6", FileText], ["Candidatures envoyées", f.compteurs.candidatures_envoyees, "#a855f7", Send]].map(([l, v, cl, I], i) => <Kpi key={l} i={i} k={{ label: l, value: v, color: cl, icon: I }} />)}
      </section>

      {!supprime && !moi && (
        <section className="fp-card">
          <header className="ad-h"><div><h2>Actions</h2><p>Chaque action est enregistrée dans le journal.</p></div></header>
          <div className="ad-acts big">
            <button className="ad-a" onClick={() => setDlg({ title: "Déconnecter partout ?", confirm: "Fermer les sessions", text: "Toutes les sessions ouvertes de ce compte seront fermées.", run: async () => ok(await api("/admin/utilisateurs/" + id + "/deconnecter", "POST")) })}><LogOut size={14} />Déconnecter partout</button>
            <button className="ad-a" onClick={() => setDlg({ title: "Envoyer un lien de réinitialisation ?", confirm: "Envoyer le lien", text: "L'utilisateur recevra un email pour choisir un nouveau mot de passe.", run: async () => ok(await api("/admin/utilisateurs/" + id + "/lien-reinitialisation", "POST")) })}><KeyRound size={14} />Lien de réinitialisation</button>
            <button className="ad-a" onClick={() => setDlg({ title: c.is_admin ? "Retirer le rôle admin ?" : "Donner le rôle admin ?", confirm: "Confirmer", text: "Confirmez avec votre mot de passe.", fields: [{ k: "mdp", label: "Votre mot de passe", type: "password", required: true }], run: async (v) => ok(await api("/admin/utilisateurs/" + id + "/role", "PATCH", { is_admin: !c.is_admin, mot_de_passe: v.mdp })) })}>{c.is_admin ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}{c.is_admin ? "Retirer le rôle admin" : "Donner le rôle admin"}</button>
            {!c.is_admin && <button className="ad-a del" onClick={() => setDlg({ title: "Effacer définitivement ?", danger: true, confirm: "Effacer définitivement", text: "Le compte et toutes ses données seront détruits, sans retour possible. À utiliser pour une demande de suppression RGPD.", fields: [{ k: "email", label: "Tapez l'email du compte : " + c.email, required: true }, { k: "mdp", label: "Votre mot de passe", type: "password", required: true }], run: async (v) => { const r = await api("/admin/utilisateurs/" + id + "/purger", "POST", { email_confirmation: v.email, mot_de_passe: v.mdp }); toast.success(r?.message ?? "Compte effacé."); nav("/admin/utilisateurs"); } })}><Trash2 size={14} />Effacer définitivement</button>}
          </div>
        </section>
      )}

      <div className="ad-grid2">
        {profil.length > 0 && (
          <article className="fp-card">
            <header className="ad-h"><div><h2>Profil</h2></div></header>
            <dl className="ad-dl">{profil.map(([k, v]) => <div key={k}><dt>{lab(k)}</dt><dd>{String(v)}</dd></div>)}</dl>
            {f.a_un_cv && <p className="ad-sub"><FileText size={14} />Un CV est déposé.</p>}
          </article>
        )}
        {f.offres.length > 0 && (
          <article className="fp-card">
            <header className="ad-h"><div><h2>Offres</h2></div></header>
            <ul className="ad-mini">{f.offres.map((o) => <li key={o.id}><span>{o.titre}</span><em className="ad-tag" style={{ "--c": OCOLOR[o.statut] || "#94a3b8" }}>{OLAB[o.statut] || lab(o.statut)}</em><b>{o.candidatures}</b></li>)}</ul>
          </article>
        )}
      </div>

      <article className="fp-card">
        <header className="ad-h"><div><h2>Historique des actions admin</h2></div></header>
        {f.historique.length ? <ul className="ad-logs">{f.historique.map((h, i) => <LogItem key={i} compact x={h} />)}</ul> : <p className="ad-none">Aucune action enregistrée sur ce compte.</p>}
      </article>
      {dlg && <Dialog cfg={dlg} onClose={() => setDlg(null)} />}
    </div>
  );
}

/* ================= OUTILS ================= */
const CIBLES = { tous: "Tous les comptes", etudiant: "Étudiants", freelance: "Freelances", entreprise: "Entreprises", ecole: "Écoles" };
const CIB_TXT = { tous: "tous les comptes", etudiant: "les étudiants", freelance: "les freelances", entreprise: "les entreprises", ecole: "les écoles" };

export function AdminOutils() {
  const [f, setF] = useState({ titre: "", message: "", cible: "tous" });
  const [dlg, setDlg] = useState(null);
  const [exp, setExp] = useState("");
  const valid = f.titre.trim().length >= 3 && f.message.trim().length >= 3;
  const envoyer = () => setDlg({
    title: "Envoyer l'annonce ?", confirm: "Envoyer", text: "Elle sera envoyée à " + CIB_TXT[f.cible] + ". Cette action ne peut pas être annulée.",
    run: async () => { const r = await api("/admin/annonces", "POST", f); toast.success(r?.message ?? "Annonce envoyée."); setF({ ...f, titre: "", message: "" }); },
  });
  const exporter = async (path, nom) => {
    setExp(nom);
    try { await saveFile(path, nom); toast.success("Export téléchargé"); } catch (x) { toast.error(x.message); }
    setExp("");
  };
  return (
    <div className="fp">
      <Hero chip="Administration" title="Outils" text="Communiquez avec les utilisateurs et exportez vos données." />
      <div className="ad-grid2">
        <section className="fp-card">
          <header className="ad-h"><div><h2><Megaphone size={17} /> Annonce aux utilisateurs</h2><p>Elle apparaît dans les notifications des comptes actifs du groupe choisi. Aucun email n'est envoyé.</p></div></header>
          <div className="ad-form">
            <Field label="Destinataires"><Pills value={f.cible} onChange={(v) => setF({ ...f, cible: v })} options={Object.entries(CIBLES)} /></Field>
            <Field label="Titre" required right={f.titre.length + " / 120"}><input className="fp-input" maxLength={120} value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex : Maintenance prévue ce soir" /></Field>
            <Field label="Message" required right={f.message.length + " / 1000"}><textarea className="fp-input" rows={5} maxLength={1000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="Votre message…" /></Field>
            <button className="fp-btn solid" style={{ margin: 0, alignSelf: "flex-start" }} disabled={!valid} onClick={envoyer}><Send size={16} />Envoyer l'annonce</button>
          </div>
        </section>
        <aside>
          <span className="ad-prev-lab"><Eye size={14} />Aperçu de la notification</span>
          <div className="fp-card ad-notif">
            <span className="ad-ico" style={{ "--c": "#0f9d73" }}><Bell size={18} /></span>
            <div><b>{f.titre || "Titre de l'annonce"}</b><p>{f.message || "Le message apparaîtra ici."}</p><small>À l'instant · {CIBLES[f.cible]}</small></div>
          </div>
        </aside>
      </div>
      <section className="fp-card">
        <header className="ad-h"><div><h2><Download size={17} /> Exports CSV</h2><p>Fichiers lisibles dans Excel. Chaque export est enregistré dans le journal.</p></div></header>
        <div className="ad-exports">
          {[["Utilisateurs", "Tous les comptes avec profil, statut et date d'inscription.", "/admin/export/utilisateurs.csv", "utilisateurs.csv", Users], ["Offres", "Toutes les offres avec entreprise, statut et candidatures.", "/admin/export/offres.csv", "offres.csv", Briefcase]].map(([t, d, p, n, I]) => (
            <div key={n} className="ad-export"><span className="ad-ico"><I size={18} /></span><div><b>{t}</b><p>{d}</p></div>
              <button className="fp-btn ad-sm" style={{ margin: 0 }} disabled={!!exp} onClick={() => exporter(p, n)}>{exp === n ? <Loader2 size={15} className="ad-spin" /> : <Download size={15} />}Exporter</button></div>
          ))}
        </div>
      </section>
      {dlg && <Dialog cfg={dlg} onClose={() => setDlg(null)} />}
    </div>
  );
}

/* ================= JOURNAL ================= */
export function AdminJournalPlus() {
  const [action, setAction] = useState("");
  const [cible, setCible] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const dc = useDebounced(cible, 450);
  const s = useLoad(() => list("/admin/journal" + qs({ action, cible_id: dc, limit: PAGE, offset: page * PAGE })), [action, dc, page]);
  const rows = s.data || [];
  const k = q.trim().toLowerCase();
  const shown = k ? rows.filter((x) => ((x.details || "") + " " + (x.admin_nom || "") + " " + (ACTIONS[x.action] || x.action)).toLowerCase().includes(k)) : rows;
  const exportCsv = () => {
    const esc = (v) => { const t = String(v ?? ""); return '"' + (/^[=+\-@]/.test(t) ? "'" + t : t).replace(/"/g, '""') + '"'; };
    const lines = [["date", "administrateur", "action", "cible_type", "cible_id", "details"].join(";"), ...shown.map((x) => [x.created_at, x.admin_nom, ACTIONS[x.action] || x.action, x.cible_type, x.cible_id, x.details].map(esc).join(";"))];
    const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "journal-page-" + (page + 1) + ".csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("Page exportée");
  };
  return (
    <div className="fp">
      <Hero chip="Traçabilité" title="Journal des actions" text="Toutes les opérations d'administration, de la plus récente à la plus ancienne."
        right={<button className="fp-btn gold" style={{ margin: 0 }} disabled={!shown.length} onClick={exportCsv}><Download size={16} />Exporter la page</button>} />
      <section className="fp-card ad-tools">
        <Search_ value={q} onChange={setQ} placeholder="Chercher dans cette page (détails, admin, action)…" />
        <div className="ad-grid-f">
          <Field label="Action"><select className="fp-input" value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }}><option value="">Toutes</option>{Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Identifiant de la cible" hint="Copié depuis une fiche utilisateur."><input className="fp-input" value={cible} onChange={(e) => { setCible(e.target.value); setPage(0); }} placeholder="Ex : 3f2a…" /></Field>
        </div>
      </section>
      <Err e={s.error} />
      {s.data === undefined && !s.error && <Skel />}
      {s.data !== undefined && (shown.length ? <section className="fp-card"><ul className="ad-logs">{shown.map((x) => <LogItem key={x.id} x={x} />)}</ul></section> : <Empty icon={ScrollText} title="Aucune action" text="Aucune action ne correspond à ces filtres." />)}
      {s.data !== undefined && <Pager page={page} setPage={setPage} n={rows.length} />}
    </div>
  );
}