// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Archive, Briefcase, Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock, LayoutGrid, List as ListIcon, Loader2, MapPin, Search, ShieldCheck, Sparkles, Trash2, Users, X } from "lucide-react";
import { api, list, qs } from "../api";
import { Err, fdate, useLoad } from "../ui";
import { Field } from "../forms-pro/FormsPro";
import "../forms-pro/forms-pro.css";
import "./admin-pro.css";
import "./admin-users-pro.css";
import "./admin-offres-pro.css";

const PAGE = 50;
const OCOLOR = { active: "#0f9d73", expiree: "#f59e0b", archivee: "#94a3b8" };
const OLAB = { active: "Active", expiree: "Expirée", archivee: "Archivée" };
const SORTS = [["recent", "Plus récentes"], ["ancien", "Plus anciennes"], ["az", "Titre A → Z"], ["cand", "Plus de candidats"]];

const tms = (d) => (d ? new Date(/(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z").getTime() : 0);
const rel = (d) => {
  if (!d) return "";
  const m = Math.floor((Date.now() - tms(d)) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return "il y a " + m + " min";
  const h = Math.floor(m / 60);
  if (h < 24) return "il y a " + h + " h";
  const j = Math.floor(h / 24);
  if (j < 30) return "il y a " + j + " j";
  const mo = Math.floor(j / 30);
  if (mo < 12) return "il y a " + mo + " mois";
  const a = Math.floor(j / 365);
  return "il y a " + a + " an" + (a > 1 ? "s" : "");
};
function useDebounced(v, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

function Confirm({ cfg, onClose }) {
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

const Statut = ({ s }) => <span className="ad-tag" style={{ "--c": OCOLOR[s] || "#94a3b8" }}>{OLAB[s] || s}</span>;
const Cand = ({ n }) => <span className={"ao-n" + (n ? "" : " zero")}><Users size={14} />{n} candidat{n > 1 ? "s" : ""}</span>;

export function AdminOffres() {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const [view, setView] = useState(() => { try { return localStorage.getItem("aoView") || "list"; } catch { return "list"; } });
  const [dlg, setDlg] = useState(null);
  const inp = useRef(null);
  const dq = useDebounced(q);

  const cs = useLoad(() => api("/admin/offres/compteurs").catch(() => null), [], 60000);
  const s = useLoad(() => list("/admin/offres" + qs({ q: dq, statut, limit: PAGE, offset: page * PAGE })), [dq, statut, page]);
  const c = cs.data;

  useEffect(() => {
    const key = (e) => {
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { e.preventDefault(); inp.current?.focus(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const setViewP = (v) => { setView(v); try { localStorage.setItem("aoView", v); } catch {} };
  const raw = s.data || [];
  const rows = useMemo(() => {
    const a = [...raw];
    if (sort === "recent") a.sort((x, y) => tms(y.created_at) - tms(x.created_at));
    else if (sort === "ancien") a.sort((x, y) => tms(x.created_at) - tms(y.created_at));
    else if (sort === "az") a.sort((x, y) => (x.titre || "").localeCompare(y.titre || "", "fr"));
    else a.sort((x, y) => (y.candidatures || 0) - (x.candidatures || 0));
    return a;
  }, [raw, sort]);

  const filtered = !!(q || statut);
  const reset = () => { setQ(""); setStatut(""); setPage(0); };
  const pick = (v) => { setStatut(v); setPage(0); };

  const retirer = (o) => setDlg({
    title: "Retirer « " + o.titre + " » ?", danger: true, confirm: "Retirer l'offre",
    text: o.candidatures > 0 ? "Elle a des candidatures : elle sera archivée, pas supprimée." : "Elle sera supprimée définitivement.",
    fields: [{ k: "motif", label: "Motif (facultatif)", hint: "Transmis à l'entreprise par notification.", placeholder: "Ex : annonce non conforme" }],
    run: async (v) => { const r = await api("/admin/offres/" + o.id + qs({ motif: v.motif.trim() }), "DELETE"); toast.success(r?.message ?? "Offre retirée."); s.reload(); cs.reload(); },
  });

  const tiles = [
    ["", "Toutes les offres", Briefcase, "#0f5d46", c?.total],
    ["active", "Actives", CheckCircle2, OCOLOR.active, c?.active],
    ["expiree", "Expirées", Clock, OCOLOR.expiree, c?.expiree],
    ["archivee", "Archivées", Archive, OCOLOR.archivee, c?.archivee],
  ];
  const Del = ({ o }) => <button className="ao-del" onClick={() => retirer(o)} title="Retirer l'offre" aria-label={"Retirer " + o.titre}><Trash2 size={16} /></button>;

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="ad-top">
          <div>
            <span className="fp-hero-chip"><Sparkles size={14} />Modération</span>
            <h1>Offres</h1>
            <p>Contrôlez les annonces publiées par les entreprises.</p>
          </div>
          <div className="au-hero-side"><b>{c ? c.total : "–"}</b><small>offres au total</small></div>
        </div>
      </section>

      <section className="au-tiles ao-tiles">
        {tiles.map(([v, l, I, cl, n]) => (
          <button key={l} className={"au-tile" + (statut === v ? " on" : "")} style={{ "--c": cl }} onClick={() => pick(statut === v ? "" : v)}>
            <span><I size={19} /></span>
            <div><b>{n ?? "–"}</b><small>{l}</small></div>
          </button>
        ))}
      </section>

      <section className="fp-card ad-tools">
        <div className="au-bar">
          <label className="ad-search"><Search size={16} />
            <input ref={inp} placeholder="Rechercher par titre ou entreprise…  ( / )" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Effacer"><X size={14} /></button>}
          </label>
          <select className="au-sel" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="au-seg" role="group" aria-label="Affichage">
            <button className={view === "list" ? "on" : ""} onClick={() => setViewP("list")} title="Liste" aria-label="Liste"><ListIcon size={17} /></button>
            <button className={view === "cards" ? "on" : ""} onClick={() => setViewP("cards")} title="Cartes" aria-label="Cartes"><LayoutGrid size={17} /></button>
          </div>
        </div>
        {filtered && <div className="ad-pills au-pills"><button className="au-reset" onClick={reset}><X size={13} />Réinitialiser les filtres</button></div>}
      </section>

      <Err e={s.error} />
      {s.data === undefined && !s.error && <div className="ad-skels">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="ad-skel" style={{ height: 68 }} />)}</div>}

      {s.data !== undefined && !rows.length && (
        <div className="fp-card ad-empty"><Briefcase size={34} /><b>Aucune offre</b><p>Aucune offre ne correspond à ces filtres.</p>
          {filtered && <button className="fp-btn solid ad-sm" style={{ margin: "8px 0 0" }} onClick={reset}>Réinitialiser les filtres</button>}
        </div>
      )}

      {s.data !== undefined && rows.length > 0 && view === "list" && (
        <section className="fp-card au-table">
          <div className="ao-head"><span>Offre</span><span>Contrat · Lieu</span><span>Statut</span><span>Candidats</span><span>Création</span><span /></div>
          {rows.map((o, i) => (
            <div className="ao-row" key={o.id} style={{ animationDelay: Math.min(i, 12) * 25 + "ms" }}>
              <div className="ao-t"><b title={o.titre}>{o.titre}</b><small><Building2 size={12} />{o.entreprise}</small></div>
              <div className="ao-meta">
                {o.type_contrat && <span className="ad-tag">{String(o.type_contrat).toUpperCase()}</span>}
                {o.localisation && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{o.localisation}</span>}
              </div>
              <div className="ao-c-st"><Statut s={o.statut} /></div>
              <Cand n={o.candidatures} />
              <div className="ao-date" title={fdate(o.created_at)}>{rel(o.created_at)}</div>
              <Del o={o} />
            </div>
          ))}
        </section>
      )}

      {s.data !== undefined && rows.length > 0 && view === "cards" && (
        <div className="au-cards">
          {rows.map((o, i) => (
            <article className="fp-card au-card" key={o.id} style={{ "--c": OCOLOR[o.statut] || "#94a3b8", animationDelay: Math.min(i, 12) * 25 + "ms" }}>
              <div className="ao-card-top"><h3>{o.titre}</h3><Statut s={o.statut} /></div>
              <div className="ao-card-co"><Building2 size={13} />{o.entreprise}</div>
              <div className="ao-meta">
                {o.type_contrat && <span className="ad-tag">{String(o.type_contrat).toUpperCase()}</span>}
                {o.localisation && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><MapPin size={12} />{o.localisation}</span>}
              </div>
              <div className="au-card-foot">
                <span title={fdate(o.created_at)}><Cand n={o.candidatures} /> · {rel(o.created_at)}</span>
                <Del o={o} />
              </div>
            </article>
          ))}
        </div>
      )}

      {s.data !== undefined && (
        <div className="ad-pager">
          <button className="fp-btn ad-sm" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={15} />Précédent</button>
          <span className="au-count">{raw.length ? (page * PAGE + 1) + "–" + (page * PAGE + raw.length) : "0"} · page {page + 1}</span>
          <button className="fp-btn ad-sm" disabled={raw.length < PAGE} onClick={() => setPage(page + 1)}>Suivant<ChevronRight size={15} /></button>
        </div>
      )}
      {dlg && <Confirm cfg={dlg} onClose={() => setDlg(null)} />}
    </div>
  );
}