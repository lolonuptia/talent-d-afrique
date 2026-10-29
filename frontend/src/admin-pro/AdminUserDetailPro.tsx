// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Ban, Briefcase, CalendarDays, Copy, FileText, Info, KeyRound, Loader2, LogOut, MailCheck, MailWarning, RotateCcw, ScrollText, Send, ShieldCheck, ShieldOff, Trash2, UserCog } from "lucide-react";
import { api, qs } from "../api";
import { useAuth } from "../auth";
import { Err, fdate, useLoad } from "../ui";
import { Field } from "../forms-pro/FormsPro";
import { ACTIONS } from "./AdminPro";
import { MessageCircle } from "lucide-react";
import { WhatsAppDialog } from "../whatsapp/WhatsAppDialog";
import { ADMIN_TEMPLATES } from "../whatsapp/wa";
import "../forms-pro/forms-pro.css";
import "./admin-pro.css";
import "./admin-user-detail.css";

const PROFIL = { etudiant: "Étudiant", freelance: "Freelance", entreprise: "Entreprise", ecole: "École" };
const PCOLOR = { etudiant: "#3b82f6", freelance: "#a855f7", entreprise: "#f59e0b", ecole: "#14a07a" };
const STATUT = { actif: "Actif", suspendu: "Suspendu", supprime: "Supprimé" };
const SCOLOR = { actif: "#34d399", suspendu: "#f87171", supprime: "#94a3b8" };
const OCOLOR = { active: "#0f9d73", expiree: "#f59e0b", archivee: "#94a3b8" };
const OLAB = { active: "Active", expiree: "Expirée", archivee: "Archivée" };
const AMETA = {
  suspension_compte: [Ban, "#ef4444"], reactivation_compte: [RotateCcw, "#0f9d73"], suppression_offre: [Trash2, "#ef4444"],
  archivage_offre_moderation: [Briefcase, "#f59e0b"], verification_email_manuelle: [MailCheck, "#3b82f6"],
  promotion_admin: [ShieldCheck, "#a855f7"], retrait_admin: [ShieldOff, "#f59e0b"], deconnexion_forcee: [LogOut, "#f59e0b"],
  lien_reinitialisation_envoye: [KeyRound, "#3b82f6"], purge_compte: [Trash2, "#dc2626"],
};
const ini = (s) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const grad = (c) => "linear-gradient(135deg," + c + ",color-mix(in srgb," + c + " 55%,#000))";
const nice = (k) => { const t = String(k).replace(/_/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); };
const show = (v) => {
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? JSON.stringify(x) : x)).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};
const isUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);

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

export function AdminUserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const s = useLoad(() => api("/admin/utilisateurs/" + id + "/fiche"), [id]);
  const [dlg, setDlg] = useState(null);
  const [wa, setWa] = useState(false);

  const back = <Link className="af-back" to="/admin/utilisateurs"><ArrowLeft size={14} />Retour à la liste</Link>;
  if (s.error) return <div className="fp">{back}<Err e={s.error} /></div>;
  if (!s.data) return <div className="fp">{back}<div className="ad-skels"><div className="ad-skel" style={{ height: 150 }} /><div className="ad-skel" style={{ height: 80 }} /><div className="ad-skel" style={{ height: 220 }} /></div></div>;

  const f = s.data, c = f.compte;
  const moi = c.id === user.id, supprime = f.statut === "supprime";
  const col = PCOLOR[c.type_profil] || "#64748b";
  const profil = Object.entries(f.profil ?? {}).filter(([k, v]) => v !== null && v !== "" && !["id", "user_id"].includes(k));
  const verifie = !!c.email_verifie_at;
  const ok = (r) => { toast.success(r?.message ?? "Fait."); s.reload(); };
  const copy = () => { try { navigator.clipboard.writeText(c.email).then(() => toast.success("Email copié")).catch(() => toast.error("Copie impossible")); } catch { toast.error("Copie impossible"); } };
  const post = (p, m) => async () => { await api("/admin/utilisateurs/" + id + p, m || "PATCH"); toast.success("Fait."); s.reload(); };

  const stats = [
    ["Offres", f.compteurs.offres, "#0f5d46", Briefcase],
    ["Candidatures reçues", f.compteurs.candidatures_recues, "#3b82f6", FileText],
    ["Candidatures envoyées", f.compteurs.candidatures_envoyees, "#a855f7", Send],
  ];
  const canAct = !supprime && !moi;

  return (
    <div className="fp">
      {back}

      <section className="af-hero" style={{ "--c": col }}>
        <div className="af-ava" style={{ background: grad(col) }}>{ini(c.nom)}</div>
        <div className="af-id">
          <h1>{c.nom}{c.is_admin && <span className="af-pill admin">admin</span>}{moi && <span className="af-pill you">Vous</span>}</h1>
          <p className="af-mail">
            <span>{c.email}</span>
            <button onClick={copy} title="Copier l'email" aria-label="Copier l'email"><Copy size={14} /></button>
            {!verifie && <span className="af-warn"><MailWarning size={13} />Email non confirmé</span>}
          </p>
          <div className="af-chips">
            <span className="af-chip">{PROFIL[c.type_profil] || c.type_profil}</span>
            <span className="af-chip" style={{ "--d": SCOLOR[f.statut] || "#94a3b8" }}><i />{STATUT[f.statut] || f.statut}</span>
            <span className="af-chip"><CalendarDays size={13} />Inscrit le {fdate(c.created_at)}</span>
          </div>
        </div>
      </section>

      <section className="af-stats">
        {stats.map(([l, v, cl, I]) => (
          <div key={l} className={"af-stat" + (v ? "" : " zero")} style={{ "--c": cl }}>
            <span><I size={19} /></span><div><b>{v ?? 0}</b><small>{l}</small></div>
          </div>
        ))}
      </section>

      <div className="af-grid">
        <div className="af-col">
          {profil.length > 0 && (
            <article className="fp-card">
              <h2 className="af-h"><UserCog size={17} />Profil</h2>
              <dl className="af-dl">
                {profil.map(([k, v]) => <div key={k}><dt>{nice(k)}</dt><dd>{isUrl(v) ? <a href={v} target="_blank" rel="noreferrer noopener">{v}</a> : show(v)}</dd></div>)}
              </dl>
              {f.a_un_cv && <span className="af-cv"><FileText size={14} />Un CV est déposé.</span>}
            </article>
          )}

          {f.offres.length > 0 && (
            <article className="fp-card">
              <h2 className="af-h"><Briefcase size={17} />Offres<small>{f.offres.length}</small></h2>
              <ul className="af-offers">
                {f.offres.map((o) => (
                  <li key={o.id}>
                    <span>{o.titre}</span>
                    <em className="ad-tag" style={{ "--c": OCOLOR[o.statut] || "#94a3b8" }}>{OLAB[o.statut] || nice(o.statut)}</em>
                    <b>{o.candidatures} candidat{o.candidatures > 1 ? "s" : ""}</b>
                  </li>
                ))}
              </ul>
            </article>
          )}

          <article className="fp-card">
            <h2 className="af-h"><ScrollText size={17} />Historique des actions admin{f.historique.length > 0 && <small>{f.historique.length}</small>}</h2>
            {f.historique.length ? (
              <ul className="af-tl">
                {f.historique.map((h, i) => {
                  const [I, cl] = AMETA[h.action] || [ScrollText, "#64748b"];
                  return (
                    <li key={i} style={{ "--c": cl }}>
                      <span className="af-tl-ico"><I size={16} /></span>
                      <div><b>{ACTIONS[h.action] || nice(h.action)}</b>{h.details && <p>{h.details}</p>}<small>{fdate(h.created_at)} · {h.admin_nom || "—"}</small></div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="ad-none">Aucune action enregistrée sur ce compte.</p>}
          </article>
        </div>

        <aside className="af-side">
          <article className="fp-card">
            <h2 className="af-h">Actions</h2>
            {moi && <p className="af-note"><Info size={16} />C'est votre compte : les actions sensibles sont désactivées.</p>}
            {supprime && <p className="af-note"><Info size={16} />Ce compte est supprimé : aucune action n'est disponible.</p>}
            {canAct && (
              <div className="af-acts">
                <button className="af-act wa" onClick={() => setWa(true)}><MessageCircle size={16} />Contacter sur WhatsApp</button>
                {f.statut === "actif" && !c.is_admin && <button className="af-act warn" onClick={() => setDlg({
                  title: "Suspendre " + c.nom + " ?", danger: true, confirm: "Suspendre",
                  text: "Le compte est désactivé sans être supprimé." + (c.type_profil === "entreprise" ? " Ses offres actives seront archivées." : ""),
                  fields: [{ k: "motif", label: "Motif (facultatif)", placeholder: "Ex : contenu inapproprié" }],
                  run: async (v) => { await api("/admin/utilisateurs/" + id + "/suspendre" + qs({ motif: v.motif.trim() }), "PATCH"); toast.success(c.nom + " est suspendu."); s.reload(); },
                })}><Ban size={16} />Suspendre le compte</button>}
                {f.statut === "suspendu" && <button className="af-act" onClick={() => setDlg({ title: "Réactiver " + c.nom + " ?", confirm: "Réactiver", text: "Le compte pourra de nouveau se connecter.", run: post("/reactiver") })}><RotateCcw size={16} />Réactiver le compte</button>}
                {!verifie && <button className="af-act" onClick={() => setDlg({ title: "Confirmer l'email de " + c.nom + " ?", confirm: "Confirmer l'email", text: "Vous confirmez l'adresse à la place de l'utilisateur.", run: post("/verifier-email") })}><MailCheck size={16} />Confirmer l'email</button>}
                <button className="af-act" onClick={() => setDlg({ title: "Déconnecter partout ?", confirm: "Fermer les sessions", text: "Toutes les sessions ouvertes de ce compte seront fermées.", run: async () => ok(await api("/admin/utilisateurs/" + id + "/deconnecter", "POST")) })}><LogOut size={16} />Déconnecter partout</button>
                <button className="af-act" onClick={() => setDlg({ title: "Envoyer un lien de réinitialisation ?", confirm: "Envoyer le lien", text: "L'utilisateur recevra un email pour choisir un nouveau mot de passe.", run: async () => ok(await api("/admin/utilisateurs/" + id + "/lien-reinitialisation", "POST")) })}><KeyRound size={16} />Lien de réinitialisation</button>
                <button className="af-act" onClick={() => setDlg({ title: c.is_admin ? "Retirer le rôle admin ?" : "Donner le rôle admin ?", confirm: "Confirmer", text: "Confirmez avec votre mot de passe.", fields: [{ k: "mdp", label: "Votre mot de passe", type: "password", required: true }], run: async (v) => ok(await api("/admin/utilisateurs/" + id + "/role", "PATCH", { is_admin: !c.is_admin, mot_de_passe: v.mdp })) })}>{c.is_admin ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}{c.is_admin ? "Retirer le rôle admin" : "Donner le rôle admin"}</button>
              </div>
            )}
            <p className="ad-none" style={{ marginTop: 12 }}>Chaque action est enregistrée dans le journal.</p>
          </article>

          {canAct && !c.is_admin && (
            <article className="fp-card af-danger">
              <h2 className="af-h" style={{ color: "#dc2626" }}><AlertTriangle size={17} style={{ color: "#dc2626" }} />Zone dangereuse</h2>
              <p className="af-note" style={{ marginBottom: 12 }}>Détruit le compte et toutes ses données, sans retour possible (demande RGPD).</p>
              <button className="af-act" onClick={() => setDlg({
                title: "Effacer définitivement ?", danger: true, confirm: "Effacer définitivement",
                text: "Le compte et toutes ses données seront détruits, sans retour possible.",
                fields: [{ k: "email", label: "Tapez l'email du compte : " + c.email, required: true }, { k: "mdp", label: "Votre mot de passe", type: "password", required: true }],
                run: async (v) => { const r = await api("/admin/utilisateurs/" + id + "/purger", "POST", { email_confirmation: v.email, mot_de_passe: v.mdp }); toast.success(r?.message ?? "Compte effacé."); nav("/admin/utilisateurs"); },
              })}><Trash2 size={16} />Effacer définitivement</button>
            </article>
          )}
        </aside>
      </div>
      {dlg && <Confirm cfg={dlg} onClose={() => setDlg(null)} />}
      {wa && <WhatsAppDialog title={"Contacter " + c.nom} subtitle={c.email} templates={ADMIN_TEMPLATES} vars={{ nom: c.nom, expediteur: user.nom }} phone={c.telephone || String((profil.find(([k]) => /tel|phone|whats/i.test(k)) || [])[1] || "")} onClose={() => setWa(false)} />}
    </div>
  );
}