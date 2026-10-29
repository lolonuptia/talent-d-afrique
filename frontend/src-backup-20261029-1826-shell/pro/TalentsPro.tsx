// @ts-nocheck
import { useEffect, useState } from "react";
import { Search, Heart, Wallet, Briefcase, X, Users, Zap, Star, Award, GraduationCap, ExternalLink, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { api, C, list } from "../api";
import { Async, csv, dispoLabel, useLoad } from "../ui";
import "../talents-pro/talents-pro.css";

const LIMIT = 20;
const TYPES = [["", "Tous"], ["etudiant", "Étudiants"], ["freelance", "Freelances"]];
const tagLabel = (t) => (t === "etudiant" ? "Étudiant" : t === "freelance" ? "Freelance" : t || "Profil");
const rank = (d) => (d === "immediate" ? 1 : d === "1_mois" ? 2 : 3);
const safe = (u) => (u && /^https?:\/\//i.test(u) ? u : null);
const initials = (s) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Detail({ id }) {
  const s = useLoad(() => api("/talents/" + id), [id]);
  return (
    <Async s={s}>{(t) => {
      const certs = (t.certifications || []).map((c) => c.intitule).filter(Boolean);
      const reals = (t.portfolio || []).map((p) => p.titre).filter(Boolean);
      return (
        <>
          {t.formations && <section><h4><GraduationCap size={13} style={{ verticalAlign: "-2px" }} /> Formations</h4><p className="tp-bio">{typeof t.formations === "string" ? t.formations : JSON.stringify(t.formations)}</p></section>}
          <section><h4><Award size={13} style={{ verticalAlign: "-2px" }} /> Certifications</h4>{certs.length ? <ul className="tp-skills">{certs.map((c, i) => <li key={c + i}>{c}</li>)}</ul> : <p className="tp-bio" style={{ opacity: 0.6 }}>Aucune</p>}</section>
          <section><h4><Briefcase size={13} style={{ verticalAlign: "-2px" }} /> Réalisations</h4>{reals.length ? <ul className="tp-skills">{reals.map((c, i) => <li key={c + i}>{c}</li>)}</ul> : <p className="tp-bio" style={{ opacity: 0.6 }}>Aucune</p>}</section>
          {safe(t.portfolio_url) && <a className="tp-btn solid" style={{ textDecoration: "none" }} href={safe(t.portfolio_url)} target="_blank" rel="noreferrer noopener"><ExternalLink size={16} />Voir le portfolio</a>}
        </>
      );
    }}</Async>
  );
}

function Drawer({ t, fav, onFav, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="tp-overlay" onClick={onClose}>
      <aside className="tp-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="tp-grab" />
        <button className="tp-x" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        <div className="tp-d-hero">
          <span className="tp-avatar lg">{initials(t.nom)}</span>
          <h2>{t.nom}</h2>
          <div className="tp-row center"><span className={"tp-tag tp-tag-" + tagLabel(t.type_profil)}>{tagLabel(t.type_profil)}</span></div>
        </div>
        <div className="tp-d-stats">
          <div><b>{t.tjm || "—"}</b><span>TJM</span></div>
          <div><b>{t.annees_experience ?? "—"}</b><span>Ans d'exp.</span></div>
          <div><b style={{ fontSize: 14 }}>{t.disponibilite ? dispoLabel(t.disponibilite) : "—"}</b><span>Disponibilité</span></div>
        </div>
        {(t.competences || []).length > 0 && <section><h4>Compétences</h4><ul className="tp-skills">{t.competences.map((c, i) => <li key={c + i}>{c}</li>)}</ul></section>}
        <Detail id={t.profile_id} />
        <div className="tp-d-cta">
          <button className={"tp-btn " + (fav ? "on" : "")} onClick={() => onFav(t)}><Heart size={16} fill={fav ? "currentColor" : "none"} />{fav ? "Retirer des favoris" : "Ajouter aux favoris"}</button>
        </div>
      </aside>
    </div>
  );
}

export default function TalentsPro() {
  const [comp, setComp] = useState("");
  const [tjm, setTjm] = useState("");
  const [f, setF] = useState({ comp: "", tjm: "", type: "", dispo: "" });
  const [page, setPage] = useState(0);
  const [onlyFav, setOnlyFav] = useState(false);
  const [open, setOpen] = useState(null);
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("tp-favs") || "{}"); } catch { return {}; } });

  useEffect(() => {
    const t = setTimeout(() => { setF((x) => ({ ...x, comp, tjm })); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [comp, tjm]);

  const s = useLoad(() => {
    const p = new URLSearchParams();
    csv(f.comp).forEach((c) => p.append("competence", c));
    if (f.dispo) p.set("disponibilite", f.dispo);
    if (f.type) p.set("type_profil", f.type);
    if (f.tjm) p.set("tjm_max", f.tjm);
    p.set("limit", String(LIMIT)); p.set("offset", String(page * LIMIT));
    return list("/talents?" + p.toString());
  }, [f, page]);

  const toggleFav = (t) => setFavs((cur) => {
    const next = { ...cur };
    if (next[t.profile_id]) delete next[t.profile_id]; else next[t.profile_id] = t;
    try { localStorage.setItem("tp-favs", JSON.stringify(next)); } catch {}
    return next;
  });
  const setFilter = (k, v) => { setF((x) => ({ ...x, [k]: v })); setPage(0); };
  const reset = () => { setComp(""); setTjm(""); setF({ comp: "", tjm: "", type: "", dispo: "" }); setPage(0); };
  const nbFav = Object.keys(favs).length;
  const shown = onlyFav ? Object.values(favs) : s.data || [];
  const dispo = shown.filter((t) => t.disponibilite === "immediate").length;
  const dirty = comp || tjm || f.type || f.dispo;

  return (
    <div className="tp">
      <section className="tp-hero tp-in" style={{ "--i": 0 }}>
        <div className="tp-hero-glow" aria-hidden />
        <h1>Trouvez le bon talent</h1>
        <p>Recherchez par compétences, disponibilité et type de profil.</p>
        <div className="tp-stats">
          <div><Users size={16} /><b>{shown.length}</b><span>profils</span></div>
          <div><Zap size={16} /><b>{dispo}</b><span>disponibles</span></div>
          <div><Star size={16} /><b>{nbFav}</b><span>favoris</span></div>
        </div>
      </section>

      <section className="tp-filters tp-in" style={{ "--i": 1 }}>
        <label className="tp-search">
          <Search size={18} />
          <input value={comp} onChange={(e) => setComp(e.target.value)} placeholder="Compétences requises : python, react, sql…" />
          {comp && <button onClick={() => setComp("")} aria-label="Effacer"><X size={16} /></button>}
        </label>
        {csv(comp).length > 0 && <ul className="tp-skills">{csv(comp).map((c, i) => <li key={c + i}>{c}</li>)}</ul>}
        <div className="tp-chips">
          {TYPES.map(([v, l]) => <button key={v || "all"} className={f.type === v ? "on" : ""} onClick={() => setFilter("type", v)}>{l}</button>)}
        </div>
        <div className="tp-selects">
          <select value={f.dispo} onChange={(e) => setFilter("dispo", e.target.value)}>
            <option value="">Toutes disponibilités</option>
            {C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
          </select>
          <input type="number" min="0" value={tjm} onChange={(e) => setTjm(e.target.value)} placeholder="TJM max (freelances)" style={{ flex: 1, minWidth: 140, height: 40, borderRadius: 12, border: "1px solid var(--tp-border)", background: "var(--tp-soft)", padding: "0 10px", fontSize: 13 }} />
          <button className={"tp-favbtn " + (onlyFav ? "on" : "")} onClick={() => setOnlyFav((v) => !v)}><Heart size={15} fill={onlyFav ? "currentColor" : "none"} />Favoris ({nbFav})</button>
          {dirty && <button className="tp-favbtn" onClick={reset}><X size={15} />Réinitialiser</button>}
        </div>
      </section>

      {s.error && !onlyFav ? <p className="err">{s.error.message}</p> : null}
      {!onlyFav && s.data === undefined && !s.error ? (
        <div className="tp-grid">{[0, 1, 2, 3, 4, 5].map((n) => <div key={n} className="tp-skel" />)}</div>
      ) : shown.length === 0 ? (
        <div className="tp-empty tp-in">
          <Search size={34} />
          <h3>{onlyFav ? "Aucun favori" : "Aucun talent trouvé"}</h3>
          <p>{onlyFav ? "Cliquez sur le cœur d'un profil pour le retrouver ici." : "Essayez avec moins de compétences ou d'autres filtres."}</p>
        </div>
      ) : (
        <div className="tp-grid">
          {shown.map((t, i) => (
            <article className="tp-card tp-in" key={t.profile_id} style={{ "--i": Math.min(i, 10) }}>
              <header className="tp-card-top">
                <span className="tp-avatar">{initials(t.nom)}</span>
                <div className="tp-id"><h3>{t.nom}</h3><p>{tagLabel(t.type_profil)}</p></div>
                <button className={"tp-heart " + (favs[t.profile_id] ? "on" : "")} onClick={() => toggleFav(t)} aria-label="Favori"><Heart size={18} fill={favs[t.profile_id] ? "currentColor" : "none"} /></button>
              </header>
              {(t.competences || []).length > 0 && (
                <ul className="tp-skills">
                  {t.competences.slice(0, 4).map((c, k) => <li key={c + k}>{c}</li>)}
                  {t.competences.length > 4 && <li className="more">+{t.competences.length - 4}</li>}
                </ul>
              )}
              <div className="tp-meta">
                {t.disponibilite && <span className={"tp-avail r" + rank(t.disponibilite)}><i />{dispoLabel(t.disponibilite)}</span>}
                {t.tjm ? <span><Wallet size={14} />TJM {t.tjm}</span> : null}
                {t.annees_experience != null && <span><Briefcase size={14} />{t.annees_experience} an{t.annees_experience > 1 ? "s" : ""}</span>}
              </div>
              <button className="tp-btn" onClick={() => setOpen(t)}>Voir le profil</button>
            </article>
          ))}
        </div>
      )}

      {!onlyFav && s.data !== undefined && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button className="tp-btn" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={16} />Précédent</button>
          <span className="tp-count">Page {page + 1}</span>
          <button className="tp-btn" disabled={s.data.length < LIMIT} onClick={() => setPage(page + 1)}>Suivant<ChevronRight size={16} /></button>
        </div>
      )}

      {open && <Drawer t={open} fav={!!favs[open.profile_id]} onFav={toggleFav} onClose={() => setOpen(null)} />}
    </div>
  );
}