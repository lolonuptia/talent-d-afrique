/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, KeyRound, LogOut, Megaphone, Search, Send, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { api, list, qs, saveFile } from "../api";
import { useAuth } from "../auth";
import { Async, Field, Page, fdate, useLoad } from "../ui";

const PAGE = 50;
const PROFIL: Record<string, string> = { etudiant: "Étudiant", freelance: "Freelance", entreprise: "Entreprise", ecole: "École" };
const STATUT: Record<string, string> = { actif: "Actif", suspendu: "Suspendu", supprime: "Supprimé" };
const initials = (s?: string) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export const ACTIONS: Record<string, string> = {
  suspension_compte: "Compte suspendu",
  reactivation_compte: "Compte réactivé",
  suppression_offre: "Offre supprimée",
  archivage_offre_moderation: "Offre archivée (modération)",
  verification_email_manuelle: "Email confirmé manuellement",
  promotion_admin: "Rôle admin accordé",
  retrait_admin: "Rôle admin retiré",
  deconnexion_forcee: "Sessions fermées",
  lien_reinitialisation_envoye: "Lien de réinitialisation envoyé",
  purge_compte: "Compte effacé définitivement",
  annonce: "Annonce envoyée",
  export_donnees: "Export de données",
};

export function AdminUserDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const s = useLoad(() => api(`/admin/utilisateurs/${id}/fiche`), [id]);
  const [panel, setPanel] = useState<"" | "role" | "purge">("");
  const [mdp, setMdp] = useState("");
  const [conf, setConf] = useState("");
  const run = async (fn: () => Promise<any>, after?: () => void) => {
    try {
      const r = await fn();
      toast.success(r?.message ?? "Fait."); setPanel(""); setMdp(""); setConf("");
      if (after) after(); else s.reload();
    } catch (x) { toast.error((x as Error).message); }
  };
  return (
    <Page title="Fiche utilisateur" action={<Link className="x-ia" to="/admin/utilisateurs"><ArrowLeft size={15} /> Retour à la liste</Link>}>
      <Async s={s}>{(f: any) => {
        const c = f.compte;
        const moi = c.id === user.id;
        const supprime = f.statut === "supprime";
        const profil = Object.entries(f.profil ?? {}).filter(([k, v]) => v !== null && v !== "" && !["id", "user_id"].includes(k));
        return (
          <>
            <div className="card">
              <div className="x-uhead">
                <div className="x-av big">{initials(c.nom)}</div>
                <div className="x-uhead-t">
                  <h2 style={{ marginBottom: 2 }}>{c.nom} {c.is_admin && <span className="b">admin</span>}</h2>
                  <div>{c.email}{!c.email_verifie_at && <small className="mut"> · email non confirmé</small>}</div>
                  <div className="x-meta" style={{ marginTop: 6 }}>
                    <span className="x-tag">{PROFIL[c.type_profil] ?? c.type_profil}</span>
                    <span className={"b b-" + (f.statut === "actif" ? "active" : "refusee")}>{STATUT[f.statut] ?? f.statut}</span>
                    <span>inscrit le {fdate(c.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="x-kpis" style={{ marginTop: 16, marginBottom: 0 }}>
                <div className="x-kpi" style={{ ["--c" as any]: "#0f5d46" }}><span>Offres</span><b>{f.compteurs.offres}</b></div>
                <div className="x-kpi" style={{ ["--c" as any]: "#3b82f6" }}><span>Candidatures reçues</span><b>{f.compteurs.candidatures_recues}</b></div>
                <div className="x-kpi" style={{ ["--c" as any]: "#a855f7" }}><span>Candidatures envoyées</span><b>{f.compteurs.candidatures_envoyees}</b></div>
              </div>
              {!supprime && !moi && (
                <div className="x-cactions" style={{ marginTop: 16 }}>
                  <button className="x-ia" onClick={() => window.confirm("Fermer toutes les sessions de ce compte ?") && run(() => api(`/admin/utilisateurs/${id}/deconnecter`, "POST"))}><LogOut size={15} /> Déconnecter partout</button>
                  <button className="x-ia" onClick={() => window.confirm("Envoyer un lien de réinitialisation à cet utilisateur ?") && run(() => api(`/admin/utilisateurs/${id}/lien-reinitialisation`, "POST"))}><KeyRound size={15} /> Lien de réinitialisation</button>
                  <button className="x-ia" onClick={() => setPanel(panel === "role" ? "" : "role")}>{c.is_admin ? <ShieldOff size={15} /> : <ShieldCheck size={15} />} {c.is_admin ? "Retirer le rôle admin" : "Donner le rôle admin"}</button>
                  {!c.is_admin && <button className="x-ia del" style={{ marginLeft: 0 }} onClick={() => setPanel(panel === "purge" ? "" : "purge")}><Trash2 size={15} /> Effacer définitivement</button>}
                </div>
              )}
            </div>
            {panel === "role" && (
              <form className="card" onSubmit={(ev: FormEvent) => { ev.preventDefault(); run(() => api(`/admin/utilisateurs/${id}/role`, "PATCH", { is_admin: !c.is_admin, mot_de_passe: mdp })); }}>
                <h2>{c.is_admin ? "Retirer le rôle admin" : "Donner le rôle admin"}</h2>
                <Field label="Ton mot de passe (confirmation)"><input type="password" required value={mdp} onChange={(x) => setMdp(x.target.value)} /></Field>
                <div><button>Confirmer</button></div>
              </form>
            )}
            {panel === "purge" && (
              <form className="card x-danger" onSubmit={(ev: FormEvent) => { ev.preventDefault(); run(() => api(`/admin/utilisateurs/${id}/purger`, "POST", { email_confirmation: conf, mot_de_passe: mdp }), () => nav("/admin/utilisateurs")); }}>
                <h2 style={{ color: "#dc2626" }}>Effacer définitivement</h2>
                <p className="mut">Le compte et toutes ses données seront détruits, sans retour possible. À utiliser pour une demande de suppression RGPD.</p>
                <div className="row">
                  <Field label={`Tape l'email du compte : ${c.email}`}><input required value={conf} onChange={(x) => setConf(x.target.value)} /></Field>
                  <Field label="Ton mot de passe"><input type="password" required value={mdp} onChange={(x) => setMdp(x.target.value)} /></Field>
                </div>
                <div><button className="danger">Effacer définitivement</button></div>
              </form>
            )}
            {profil.length > 0 && (
              <div className="card">
                <h2>Profil</h2>
                <dl className="x-dl">
                  {profil.map(([k, v]) => <div key={k}><dt>{k.replace(/_/g, " ")}</dt><dd>{String(v)}</dd></div>)}
                </dl>
                {f.a_un_cv && <p className="mut" style={{ marginBottom: 0 }}><FileText size={14} style={{ verticalAlign: "middle" }} /> Un CV est déposé.</p>}
              </div>
            )}
            {f.offres.length > 0 && (
              <div className="card">
                <h2>Offres</h2>
                <table>
                  <thead><tr><th>Titre</th><th>Statut</th><th>Candidats</th></tr></thead>
                  <tbody>{f.offres.map((o: any) => <tr key={o.id}><td>{o.titre}</td><td><span className={"b b-" + o.statut}>{o.statut}</span></td><td>{o.candidatures}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            <div className="card">
              <h2>Historique des actions admin</h2>
              {f.historique.length ? (
                <div className="x-tl">
                  {f.historique.map((h: any, i: number) => (
                    <div key={i} className="x-tl-i">
                      <i style={{ background: "#0f5d46" }} />
                      <div><strong>{ACTIONS[h.action] ?? h.action}</strong>{h.details && <> — {h.details}</>}<small>{fdate(h.created_at)} · {h.admin_nom ?? "—"}</small></div>
                    </div>
                  ))}
                </div>
              ) : <p className="mut">Aucune action enregistrée sur ce compte.</p>}
            </div>
          </>
        );
      }}</Async>
    </Page>
  );
}

const CIBLES: Record<string, string> = { tous: "tous les comptes", etudiant: "les étudiants", freelance: "les freelances", entreprise: "les entreprises", ecole: "les écoles" };

export function AdminOutils() {
  const [f, setF] = useState({ titre: "", message: "", cible: "tous" });
  const [busy, setBusy] = useState(false);
  const envoyer = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!window.confirm(`Envoyer cette annonce à ${CIBLES[f.cible]} ?`)) return;
    setBusy(true);
    try {
      const r = await api("/admin/annonces", "POST", f);
      toast.success(r?.message ?? "Annonce envoyée."); setF({ ...f, titre: "", message: "" });
    } catch (x) { toast.error((x as Error).message); }
    setBusy(false);
  };
  const exporter = async (path: string, nom: string) => {
    try { await saveFile(path, nom); toast.success("Export téléchargé"); } catch (x) { toast.error((x as Error).message); }
  };
  return (
    <Page title="Outils">
      <form className="card" onSubmit={envoyer}>
        <div className="x-sec-h"><span className="ico"><Megaphone size={17} /></span><div><h2>Annonce aux utilisateurs</h2><p className="mut">Elle apparaît dans les notifications des comptes actifs du groupe choisi (aucun email n'est envoyé).</p></div></div>
        <div className="x-pills" style={{ marginBottom: 14 }}>
          {Object.entries(CIBLES).map(([v, l]) => <button type="button" key={v} className={"x-pill" + (f.cible === v ? " on" : "")} onClick={() => setF({ ...f, cible: v })}>{l}</button>)}
        </div>
        <Field label="Titre"><input required minLength={3} maxLength={120} value={f.titre} onChange={(x) => setF({ ...f, titre: x.target.value })} /><small className="x-count-t">{f.titre.length}/120</small></Field>
        <Field label="Message"><textarea rows={4} required minLength={3} maxLength={1000} value={f.message} onChange={(x) => setF({ ...f, message: x.target.value })} /><small className="x-count-t">{f.message.length}/1000</small></Field>
        <div><button disabled={busy}><Send size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />{busy ? "Envoi..." : "Envoyer l'annonce"}</button></div>
      </form>
      <div className="card">
        <div className="x-sec-h"><span className="ico"><Download size={17} /></span><div><h2>Exports (CSV)</h2><p className="mut">Fichiers lisibles dans Excel. Chaque export est enregistré dans le journal.</p></div></div>
        <div className="x-cactions">
          <button className="x-ia" onClick={() => exporter("/admin/export/utilisateurs.csv", "utilisateurs.csv")}><Download size={15} /> Exporter les utilisateurs</button>
          <button className="x-ia" onClick={() => exporter("/admin/export/offres.csv", "offres.csv")}><Download size={15} /> Exporter les offres</button>
        </div>
      </div>
    </Page>
  );
}

export function AdminJournalPlus() {
  const [draft, setDraft] = useState({ action: "", cible: "" });
  const [f, setF] = useState(draft);
  const [page, setPage] = useState(0);
  const s = useLoad(() => list("/admin/journal" + qs({ action: f.action, cible_id: f.cible, limit: PAGE, offset: page * PAGE })), [f, page]);
  const search = (ev: FormEvent) => { ev.preventDefault(); setPage(0); setF(draft); };
  return (
    <Page title="Journal des actions">
      <form className="card" onSubmit={search}>
        <div className="row">
          <Field label="Action">
            <select value={draft.action} onChange={(x) => setDraft({ ...draft, action: x.target.value })}>
              <option value="">Toutes</option>{Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Identifiant de la cible (copié depuis une fiche)"><input value={draft.cible} onChange={(x) => setDraft({ ...draft, cible: x.target.value })} /></Field>
        </div>
        <div><button><Search size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Filtrer</button></div>
      </form>
      <div className="card">
        <Async s={s}>{(l) => (
          <>
            {l.length ? (
              <table>
                <thead><tr><th>Date</th><th>Administrateur</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead>
                <tbody>{l.map((x: any) => (
                  <tr key={x.id}>
                    <td>{fdate(x.created_at)}</td><td>{x.admin_nom ?? "—"}</td>
                    <td><span className="b">{ACTIONS[x.action] ?? x.action}</span></td>
                    <td>{x.cible_type === "user" ? <Link to={`/admin/utilisateurs/${x.cible_id}`}>{String(x.cible_id).slice(0, 8)}</Link> : <>{x.cible_type} <small className="mut">{String(x.cible_id).slice(0, 8)}</small></>}</td>
                    <td>{x.details}</td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <div className="x-empty"><b>Aucune action</b><p className="mut">Aucune action pour ces filtres.</p></div>}
            <div className="actions" style={{ marginTop: 12 }}>
              <button className="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
              <button className="ghost" disabled={l.length < PAGE} onClick={() => setPage(page + 1)}>Suivant</button>
              <span className="mut">Page {page + 1}</span>
            </div>
          </>
        )}</Async>
      </div>
    </Page>
  );
}