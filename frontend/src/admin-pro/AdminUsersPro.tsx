// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Ban, Building2, ChevronLeft, ChevronRight, Copy, Eye, GraduationCap, Laptop, LayoutGrid, List as ListIcon, Loader2, MailCheck, MailWarning, MoreHorizontal, RotateCcw, School, Search, ShieldCheck, Sparkles, UserX, Users, X } from "lucide-react";
import { api, list, qs } from "../api";
import { Err, fdate, useLoad } from "../ui";
import { Field } from "../forms-pro/FormsPro";
import "../forms-pro/forms-pro.css";
import "./admin-pro.css";
import "./admin-users-pro.css";

const PAGE = 50;
const PROFIL = { etudiant: "Étudiant", freelance: "Freelance", entreprise: "Entreprise", ecole: "École" };
const PCOLOR = { etudiant: "#3b82f6", freelance: "#a855f7", entreprise: "#f59e0b", ecole: "#14a07a" };
const STATUT = { actif: "Actif", suspendu: "Suspendu", supprime: "Supprimé" };
const SCOLOR = { actif: "#0f9d73", suspendu: "#ef4444", supprime: "#94a3b8" };
const SORTS = [["recent", "Plus récents"], ["ancien", "Plus anciens"], ["az", "Nom A → Z"], ["za", "Nom Z → A"]];

const ini = (s) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const grad = (c) => "linear-gradient(135deg," + (c || "#64748b") + ",color-mix(in srgb," + (c || "#64748b") + " 55%,#000))";
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

/* ---------- fenetre de confirmation ---------- */
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

/* ---------- menu d'actions d'une ligne ---------- */
function RowMenu({ u, items, isOpen, toggle, close, up }) {
  return (
    <div className="au-menu-w" onClick={(e) => e.stopPropagation()}>
      <button className="au-ico-btn" onClick={toggle} aria-label="Actions" aria-haspopup="menu" aria-expanded={isOpen}><MoreHorizontal size={18} /></button>
      {isOpen && (
        <div className={"au-pop" + (up ? " up" : "")} role="menu">
          <Link to={"/admin/utilisateurs/" + u.id} onClick={close}><Eye size={15} />Voir la fiche</Link>
          {items.map((it) => (
            <button key={it.k} className={it.danger ? "danger" : ""} onClick={() => { close(); it.run(); }}><it.I size={15} />{it.l}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const Tags = ({ u }) => (
  <>
    <span className="ad-tag" style={{ "--c": PCOLOR[u.type_profil] || "#64748b" }}>{PROFIL[u.type_profil] || u.type_profil}</span>
    <span className="au-st" style={{ "--c": SCOLOR[u.statut] || "#94a3b8" }}><i />{STATUT[u.statut] || u.statut}</span>
  </>
);
const Identity = ({ u, big }) => (
  <>
    <span className="ad-ava" style={{ background: grad(PCOLOR[u.type_profil]), width: big ? 48 : undefined, height: big ? 48 : undefined }}>{ini(u.nom)}</span>
    <div className="au-id">
      <b>{u.nom}{u.is_admin && <span className="ad-tag admin">admin</span>}</b>
      <small>{u.email}{!u.email_verifie && u.statut !== "supprime" && <em title="Email non confirmé"><MailWarning size={12} />non confirmé</em>}</small>
    </div>
  </>
);

/* ================= PAGE ================= */
export function AdminUsers() {
  const [sp] = useSearchParams();
  const [q, setQ] = useState("");
  const [type, setType] = useState(sp.get("type") || "");
  const [statut, setStatut] = useState(sp.get("statut") || "");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(0);
  const [view, setView] = useState(() => { try { return localStorage.getItem("auView") || "list"; } catch { return "list"; } });
  const [dlg, setDlg] = useState(null);
  const [open, setOpen] = useState(null);
  const inp = useRef(null);
  const dq = useDebounced(q);

  const st = useLoad(() => api("/admin/statistiques").catch(() => null), [], 60000);
  const s = useLoad(() => list("/admin/utilisateurs" + qs({ q: dq, type_profil: type, statut, limit: PAGE, offset: page * PAGE })), [dq, type, statut, page]);
  const g = st.data;

  useEffect(() => {
    const close = () => setOpen(null);
    const key = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { e.preventDefault(); inp.current?.focus(); }
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("click", close); window.removeEventListener("keydown", key); };
  }, []);

  const setViewP = (v) => { setView(v); try { localStorage.setItem("auView", v); } catch {} };
  const raw = s.data || [];
  const rows = useMemo(() => {
    const a = [...raw];
    if (sort === "recent") a.sort((x, y) => tms(y.created_at) - tms(x.created_at));
    else if (sort === "ancien") a.sort((x, y) => tms(x.created_at) - tms(y.created_at));
    else if (sort === "az") a.sort((x, y) => (x.nom || "").localeCompare(y.nom || "", "fr"));
    else a.sort((x, y) => (y.nom || "").localeCompare(x.nom || "", "fr"));
    return a;
  }, [raw, sort]);

  const filtered = !!(q || type || statut);
  const reset = () => { setQ(""); setType(""); setStatut(""); setPage(0); };
  const pickType = (v) => { setType(v); setPage(0); };
  const pickStatut = (v) => { setStatut(v); setPage(0); };

  const copy = (t) => { try { navigator.clipboard.writeText(t).then(() => toast.success("Email copié")).catch(() => toast.error("Copie impossible")); } catch { toast.error("Copie impossible"); } };
  const simple = (path, msg) => async () => { await api(path, "PATCH"); toast.success(msg); s.reload(); st.reload(); };
  const suspendre = (u) => setDlg({
    title: "Suspendre " + u.nom + " ?", danger: true, confirm: "Suspendre",
    text: "Le compte est désactivé sans être supprimé." + (u.type_profil === "entreprise" ? " Ses offres actives seront archivées." : ""),
    fields: [{ k: "motif", label: "Motif (facultatif)", placeholder: "Ex : contenu inapproprié" }],
    run: async (v) => { await api("/admin/utilisateurs/" + u.id + "/suspendre" + qs({ motif: v.motif.trim() }), "PATCH"); toast.success(u.nom + " est suspendu."); s.reload(); st.reload(); },
  });
  const itemsFor = (u) => {
    const a = [{ k: "copy", l: "Copier l'email", I: Copy, run: () => copy(u.email) }];
    if (!u.email_verifie && u.statut !== "supprime")
      a.push({ k: "mail", l: "Confirmer l'email", I: MailCheck, run: () => setDlg({ title: "Confirmer l'email de " + u.nom + " ?", confirm: "Confirmer l'email", text: "Vous confirmez l'adresse à la place de l'utilisateur.", run: simple("/admin/utilisateurs/" + u.id + "/verifier-email", "Email de " + u.nom + " confirmé.") }) });
    if (u.statut === "suspendu")
      a.push({ k: "re", l: "Réactiver", I: RotateCcw, run: () => setDlg({ title: "Réactiver " + u.nom + " ?", confirm: "Réactiver", text: "Le compte pourra de nouveau se connecter.", run: simple("/admin/utilisateurs/" + u.id + "/reactiver", u.nom + " est réactivé.") }) });
    if (u.statut === "actif" && !u.is_admin)
      a.push({ k: "sus", l: "Suspendre", I: Ban, danger: true, run: () => suspendre(u) });
    return a;
  };
  const menu = (u, i) => (
    <RowMenu u={u} items={itemsFor(u)} isOpen={open === u.id} close={() => setOpen(null)}
      toggle={() => setOpen(open === u.id ? null : u.id)} up={rows.length > 4 && i >= rows.length - 3} />
  );

  const tiles = [
    ["", "Tous les comptes", Users, "#0f5d46", g?.total_utilisateurs],
    ["etudiant", "Étudiants", GraduationCap, PCOLOR.etudiant, g?.total_etudiants],
    ["freelance", "Freelances", Laptop, PCOLOR.freelance, g?.total_freelances],
    ["entreprise", "Entreprises", Building2, PCOLOR.entreprise, g?.total_entreprises],
    ["ecole", "Écoles", School, PCOLOR.ecole, g?.total_ecoles],
  ];
  const sus = g?.comptes_suspendus;

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="ad-top">
          <div>
            <span className="fp-hero-chip"><Sparkles size={14} />Comptes</span>
            <h1>Utilisateurs</h1>
            <p>Recherchez, vérifiez et modérez les comptes de la plateforme.</p>
          </div>
          <div className="au-hero-side"><b>{g ? g.total_utilisateurs : "–"}</b><small>comptes au total</small></div>
        </div>
      </section>

      <section className="au-tiles">
        {tiles.map(([v, l, I, c, n]) => (
          <button key={l} className={"au-tile" + (type === v ? " on" : "")} style={{ "--c": c }} onClick={() => pickType(type === v ? "" : v)}>
            <span><I size={19} /></span>
            <div><b>{n ?? "–"}</b><small>{l}</small></div>
          </button>
        ))}
      </section>

      <section className="fp-card ad-tools">
        <div className="au-bar">
          <label className="ad-search"><Search size={16} />
            <input ref={inp} placeholder="Rechercher par nom ou email…  ( / )" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
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
        <div className="ad-pills au-pills">
          {[["", "Tous statuts"], ["actifs", "Actifs"], ["suspendus", "Suspendus", sus], ["supprimes", "Supprimés"]].map(([v, l, n]) => (
            <button key={v || "all"} className={statut === v ? "on" : ""} onClick={() => pickStatut(v)}>{l}{n ? <em>{n}</em> : null}</button>
          ))}
          {filtered && <button className="au-reset" onClick={reset}><X size={13} />Réinitialiser</button>}
        </div>
      </section>

      <Err e={s.error} />
      {s.data === undefined && !s.error && <div className="ad-skels">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="ad-skel" style={{ height: 68 }} />)}</div>}

      {s.data !== undefined && !rows.length && (
        <div className="fp-card ad-empty"><UserX size={34} /><b>Aucun compte</b><p>Aucun compte ne correspond à ces filtres.</p>
          {filtered && <button className="fp-btn solid ad-sm" style={{ margin: "8px 0 0" }} onClick={reset}>Réinitialiser les filtres</button>}
        </div>
      )}

      {s.data !== undefined && rows.length > 0 && view === "list" && (
        <section className="fp-card au-table">
          <div className="au-head"><span>Utilisateur</span><span>Profil</span><span>Statut</span><span>Inscription</span><span /></div>
          {rows.map((u, i) => (
            <div className="au-row" key={u.id} style={{ "--c": SCOLOR[u.statut] || "#94a3b8", animationDelay: Math.min(i, 12) * 25 + "ms" }}>
              <div className="au-c-who"><Identity u={u} /></div>
              <div className="au-c-tags"><Tags u={u} /></div>
              <div className="au-c-date" title={fdate(u.created_at)}>{rel(u.created_at)}</div>
              <div className="au-c-act">
                <Link className="au-ico-btn" to={"/admin/utilisateurs/" + u.id} title="Voir la fiche" aria-label="Voir la fiche"><Eye size={16} /></Link>
                {menu(u, i)}
              </div>
            </div>
          ))}
        </section>
      )}

      {s.data !== undefined && rows.length > 0 && view === "cards" && (
        <div className="au-cards">
          {rows.map((u, i) => (
            <article className="fp-card au-card" key={u.id} style={{ "--c": SCOLOR[u.statut] || "#94a3b8", animationDelay: Math.min(i, 12) * 25 + "ms" }}>
              <div className="au-card-top"><Identity u={u} big /></div>
              <div className="au-card-tags"><Tags u={u} /></div>
              <div className="au-card-foot">
                <span title={fdate(u.created_at)}>Inscrit {rel(u.created_at)}</span>
                <div className="au-c-act">
                  <Link className="au-ico-btn" to={"/admin/utilisateurs/" + u.id} title="Voir la fiche" aria-label="Voir la fiche"><Eye size={16} /></Link>
                  {menu(u, i)}
                </div>
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