// @ts-nocheck
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Archive, Briefcase, Clock, Copy, LayoutGrid, List, MapPin, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2, Users, Wallet } from "lucide-react";
import { api, C, list } from "../api";
import { Err, csv, useLoad } from "../ui";
import "../forms-pro/forms-pro.css";

const COL = { recue: "#3b82f6", en_cours: "#a855f7", entretien: "#f59e0b", acceptee: "#10b981", refusee: "#94a3b8" };
const STAT = { active: "Active", expiree: "Expirée", archivee: "Archivée" };
const TONE = { active: "ok", expiree: "warn", archivee: "mute" };
const lab = (s) => String(s).replace(/_/g, " ");
const contrat = (v) => (v === "cdi" || v === "cdd" ? v.toUpperCase() : v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
const toDate = (d) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");
const ago = (d) => {
  const days = Math.floor((Date.now() - +toDate(d)) / 864e5);
  return days <= 0 ? "Aujourd'hui" : days === 1 ? "Hier" : days < 30 ? "Il y a " + days + " j" : toDate(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};
const SORTS = [["recent", "Plus récentes"], ["cands", "Plus de candidats"], ["titre", "Titre A-Z"]];

export default function OffresPro() {
  const [st, setSt] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState(() => localStorage.getItem("oview") || "grid");
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const s = useLoad(async () => {
    const [offres, cands] = await Promise.all([list("/offres/mine"), list("/candidatures/recues").catch(() => [])]);
    return { offres, cands };
  });
  const offres = s.data?.offres || [];
  const cands = s.data?.cands || [];

  const byOffre = useMemo(() => {
    const m = new Map();
    cands.forEach((c) => {
      const e = m.get(c.offre_id) || { n: 0, st: {} };
      e.n++; e.st[c.statut] = (e.st[c.statut] || 0) + 1;
      m.set(c.offre_id, e);
    });
    return m;
  }, [cands]);
  const nb = (id) => byOffre.get(id)?.n || 0;
  const count = (v) => offres.filter((o) => !v || o.statut === v).length;

  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    const r = offres.filter((o) => (!st || o.statut === st) && ((o.titre || "") + " " + (o.localisation || "")).toLowerCase().includes(k));
    return [...r].sort((a, b) =>
      sort === "cands" ? nb(b.id) - nb(a.id) : sort === "titre" ? (a.titre || "").localeCompare(b.titre || "", "fr") : +toDate(b.created_at) - +toDate(a.created_at));
  }, [offres, st, q, sort, byOffre]);

  const act = async (fn, ok) => {
    try { await fn(); toast.success(ok); s.reload(); } catch (x) { toast.error(x.message); }
  };
  const dup = (o) => act(async () => {
    const f = await api("/offres/" + o.id);
    await api("/offres", "POST", {
      titre: (f.titre || "") + " (copie)", description: f.description, type_contrat: f.type_contrat,
      competences_obligatoires: f.competences_obligatoires ?? null, competences_souhaitees: f.competences_souhaitees ?? null,
      soft_skills: f.soft_skills ?? null, niveau_experience: f.niveau_experience ?? null, disponibilite: f.disponibilite ?? null,
      localisation: f.localisation ?? null, remuneration: f.remuneration ?? null,
      budget_tjm: f.type_contrat === "mission" ? (f.budget_tjm ?? null) : null,
    });
  }, "Offre dupliquée");
  const confirmDel = async () => {
    setBusy(true);
    await act(() => api("/offres/" + del.id, "DELETE"), "Offre supprimée");
    setBusy(false); setDel(null);
  };
  const switchView = (v) => { setView(v); localStorage.setItem("oview", v); };

  const totalC = cands.length;
  const aTraiter = cands.filter((c) => c.statut === "recue").length;

  const card = (o, i) => {
    const e = byOffre.get(o.id);
    const n = e?.n || 0;
    const skills = csv(o.competences_obligatoires || "").slice(0, 3);
    const money = o.type_contrat === "mission" && o.budget_tjm ? "TJM max " + o.budget_tjm : o.remuneration ? String(o.remuneration) : "";
    return (
      <article className={"op-card fp-card" + (o.statut !== "active" ? " off" : "")} key={o.id} style={{ animationDelay: Math.min(i, 10) * 35 + "ms" }}>
        <header className="op-top">
          <div className="op-title">
            <h3>{o.titre}</h3>
            <div className="op-meta">
              <span className="op-ct">{contrat(o.type_contrat)}</span>
              {o.localisation && <span><MapPin size={13} />{o.localisation}</span>}
              <span><Clock size={13} />{ago(o.created_at)}</span>
              {money && <span><Wallet size={13} />{money}</span>}
            </div>
          </div>
          <span className={"dp-badge " + (TONE[o.statut] || "mute")} style={{ display: "inline-block", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99 }}>{STAT[o.statut] || lab(o.statut)}</span>
        </header>

        {skills.length > 0 && <ul className="op-skills">{skills.map((t, k) => <li key={t + k}>{t}</li>)}</ul>}

        <Link to={"/candidats?offre=" + o.id} className="op-cands">
          <span><Users size={16} /><b>{n}</b> candidat{n > 1 ? "s" : ""}</span>
          <em>Voir le classement →</em>
        </Link>
        <div className="op-pipe" title="Répartition des candidatures par statut">
          {n > 0 ? C.statutsCand.map((k) => e.st[k] ? <i key={k} style={{ flex: e.st[k], background: COL[k] || "#64748b" }} title={lab(k) + " : " + e.st[k]} /> : null) : <i style={{ flex: 1, background: "var(--fp-track)" }} />}
        </div>

        <footer className="op-actions">
          <Link className="op-a" to={"/offres/" + o.id + "/modifier"}><Pencil size={14} />Modifier</Link>
          {o.statut === "active" ? (
            <>
              <button className="op-a" onClick={() => act(() => api("/offres/" + o.id, "PATCH", {}), "Offre prolongée")}><RefreshCw size={14} />Prolonger</button>
              <button className="op-a" onClick={() => act(() => api("/offres/" + o.id, "PATCH", { statut: "archivee" }), "Offre archivée")}><Archive size={14} />Archiver</button>
            </>
          ) : (
            <button className="op-a" onClick={() => act(() => api("/offres/" + o.id, "PATCH", { statut: "active" }), "Offre réactivée")}><RefreshCw size={14} />Réactiver</button>
          )}
          <button className="op-a" onClick={() => dup(o)}><Copy size={14} />Dupliquer</button>
          <button className="op-a del" disabled={n > 0} title={n > 0 ? "Archivez l'offre : elle a des candidatures" : "Supprimer"} onClick={() => setDel(o)}><Trash2 size={14} /></button>
        </footer>
      </article>
    );
  };

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="cp-hero-top">
          <div>
            <span className="fp-hero-chip"><Sparkles size={14} />Recrutement</span>
            <h1>Mes offres</h1>
            <p>Suivez vos annonces et leurs candidatures en un coup d'œil.</p>
          </div>
          <Link to="/offres/nouvelle" className="fp-btn gold" style={{ margin: 0, textDecoration: "none" }}><Plus size={16} />Publier une offre</Link>
        </div>
        <div className="ep-stats">
          <div><b>{offres.length}</b> offres</div>
          <div><b>{count("active")}</b> actives</div>
          <div><b>{totalC}</b> candidatures</div>
          <div><b>{aTraiter}</b> à traiter</div>
        </div>
      </section>

      <section className="fp-card op-tools">
        <label className="mp-search" style={{ margin: 0 }}><Search size={16} /><input placeholder="Rechercher une offre ou un lieu…" value={q} onChange={(x) => setQ(x.target.value)} /></label>
        <div className="cp-pills">
          {["", ...C.statutsOffre].map((v) => (
            <button key={v || "all"} className={st === v ? "on" : ""} onClick={() => setSt(v)}>{v ? STAT[v] || lab(v) : "Toutes"} · {count(v)}</button>
          ))}
        </div>
        <div className="op-right">
          <select className="fp-input" style={{ width: "auto", padding: "8px 12px", fontSize: 13 }} value={sort} onChange={(x) => setSort(x.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <div className="fp-seg" style={{ flexWrap: "nowrap" }}>
            <button className={view === "grid" ? "on" : ""} onClick={() => switchView("grid")} aria-label="Grille"><LayoutGrid size={15} /></button>
            <button className={view === "list" ? "on" : ""} onClick={() => switchView("list")} aria-label="Liste"><List size={15} /></button>
          </div>
        </div>
      </section>

      <Err e={s.error} />
      {s.data === undefined && !s.error && <div className="op-grid">{[0, 1, 2].map((n) => <div key={n} className="tp-skel" style={{ height: 220 }} />)}</div>}
      {s.data !== undefined && (shown.length ? (
        <div className={"op-grid" + (view === "list" ? " list" : "")}>{shown.map(card)}</div>
      ) : (
        <div className="fp-card ep-empty">
          <Briefcase size={32} style={{ margin: "0 auto 8px", display: "block" }} />
          <b>Aucune offre</b>
          <p>{offres.length ? "Aucun résultat pour ce filtre." : "Publiez votre première offre pour recevoir des candidatures."}</p>
          {!offres.length && <Link className="fp-btn solid" to="/offres/nouvelle" style={{ textDecoration: "none", margin: "10px auto 0", display: "inline-flex" }}>Publier une offre</Link>}
        </div>
      ))}

      {del && (
        <div className="op-overlay" onClick={() => !busy && setDel(null)}>
          <div className="op-modal fp-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Supprimer cette offre ?</h2>
            <p>« {del.titre} » sera définitivement supprimée. Cette action est irréversible.</p>
            <div className="fp-actions">
              <button className="fp-btn" disabled={busy} onClick={() => setDel(null)}>Annuler</button>
              <button className="fp-btn danger" disabled={busy} onClick={confirmDel}><Trash2 size={16} />Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}