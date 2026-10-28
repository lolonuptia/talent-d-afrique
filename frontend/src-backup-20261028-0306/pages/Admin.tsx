/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Ban, Briefcase, Building2, Eye, FileText, GraduationCap, Laptop, MailCheck, Percent, RotateCcw, School, Search, ShieldAlert, ShieldCheck, Trash2, Users } from "lucide-react";
import { C, api, list, qs } from "../api";
import { Async, Field, Page, fdate, useLoad } from "../ui";

const PAGE = 50;
const initials = (s?: string) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

function Pager({ page, setPage, n }: { page: number; setPage: (p: number) => void; n: number }) {
  return (
    <div className="actions" style={{ marginTop: 12 }}>
      <button className="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
      <button className="ghost" disabled={n < PAGE} onClick={() => setPage(page + 1)}>Suivant</button>
      <span className="mut">Page {page + 1}</span>
    </div>
  );
}

function Bars({ rows, label }: { rows: any[]; label: (r: any) => string }) {
  if (!rows.length) return <p className="mut">Aucune donnée.</p>;
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="x-hb">
      {rows.map((r, i) => (
        <div key={i} className="x-hb-r">
          <span title={label(r)}>{label(r) || "—"}</span>
          <div className="bar"><i style={{ width: (100 * r.total) / max + "%" }} /></div>
          <b>{r.total}</b>
        </div>
      ))}
    </div>
  );
}

function Cols({ rows }: { rows: any[] }) {
  if (!rows.length) return <p className="mut">Aucune donnée.</p>;
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="x-cols">
      {rows.map((r, i) => (
        <div key={i} className="x-col" title={`${r.mois} : ${r.total}`}>
          <b>{r.total}</b>
          <div className="x-col-t"><i style={{ height: Math.max(4, (100 * r.total) / max) + "%" }} /></div>
          <span>{r.mois}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminHome() {
  const s = useLoad(async () => {
    const [g, d] = await Promise.all([api("/admin/statistiques"), api("/admin/statistiques/detail")]);
    return { g, d };
  }, [], 60000);
  return (
    <Page title="Administration">
      <Async s={s}>{({ g, d }) => {
        const kpi: [ReactNode, string, number | string, string][] = [
          [<Users size={18} />, "Comptes", g.total_utilisateurs, "#0f5d46"],
          [<GraduationCap size={18} />, "Étudiants", g.total_etudiants, "#3b82f6"],
          [<Laptop size={18} />, "Freelances", g.total_freelances, "#a855f7"],
          [<Building2 size={18} />, "Entreprises", g.total_entreprises, "#f59e0b"],
          [<School size={18} />, "Écoles", g.total_ecoles, "#14a07a"],
          [<Briefcase size={18} />, "Offres actives", g.total_offres_actives, "#0ea5e9"],
          [<FileText size={18} />, "Candidatures", g.total_candidatures, "#6366f1"],
          [<Percent size={18} />, "Taux d'acceptation", g.taux_matching_moyen + " %", "#10b981"],
          [<ShieldAlert size={18} />, "Comptes suspendus", g.comptes_suspendus, g.comptes_suspendus ? "#dc2626" : "#94a3b8"],
          [<ShieldCheck size={18} />, "Entreprises à vérifier", g.entreprises_non_verifiees, g.entreprises_non_verifiees ? "#f59e0b" : "#94a3b8"],
        ];
        const top = [...d.candidatures_par_offre].sort((a: any, b: any) => b.total - a.total).slice(0, 10);
        return (
          <>
            <div className="x-kpis">
              {kpi.map(([ic, l, v, c], i) => (
                <div key={l} className="x-kpi" style={{ ["--c" as any]: c, animationDelay: i * 40 + "ms" }}>
                  <div className="x-ico" style={{ color: c }}>{ic}</div><span>{l}</span><b>{v}</b>
                </div>
              ))}
            </div>
            <div className="card"><h2>Inscriptions par mois</h2><Cols rows={d.inscriptions_par_mois} /></div>
            <div className="x-grid2">
              <div className="card"><h2>Entreprises par secteur</h2><Bars rows={d.entreprises_par_secteur} label={(r) => r.secteur} /></div>
              <div className="card"><h2>Offres par localisation</h2><Bars rows={d.offres_par_localisation} label={(r) => r.localisation} /></div>
            </div>
            <div className="card"><h2>Offres les plus demandées</h2><Bars rows={top} label={(r) => r.titre} /></div>
          </>
        );
      }}</Async>
    </Page>
  );
}

const STATUT: Record<string, string> = { actif: "Actif", suspendu: "Suspendu", supprime: "Supprimé" };
const PROFIL: Record<string, string> = { etudiant: "Étudiant", freelance: "Freelance", entreprise: "Entreprise", ecole: "École" };

export function AdminUsers() {
  const [draft, setDraft] = useState({ q: "", type: "", statut: "" });
  const [f, setF] = useState(draft);
  const [page, setPage] = useState(0);
  const s = useLoad(
    () => list("/admin/utilisateurs" + qs({ q: f.q, type_profil: f.type, statut: f.statut, limit: PAGE, offset: page * PAGE })),
    [f, page]
  );
  const search = (ev: FormEvent) => { ev.preventDefault(); setPage(0); setF(draft); };
  const run = async (path: string, msg: string) => {
    try { await api(path, "PATCH"); toast.success(msg); s.reload(); } catch (x) { toast.error((x as Error).message); }
  };
  const suspendre = (u: any) => {
    const motif = window.prompt(`Suspendre ${u.nom} ? Motif (facultatif) :`);
    if (motif === null) return;
    run(`/admin/utilisateurs/${u.id}/suspendre${qs({ motif: motif.trim() })}`, `${u.nom} est suspendu.`);
  };
  return (
    <Page title="Utilisateurs">
      <form className="card" onSubmit={search}>
        <div className="x-search wide"><Search size={16} /><input placeholder="Rechercher par nom ou email..." value={draft.q} onChange={(x) => setDraft({ ...draft, q: x.target.value })} /></div>
        <div className="row">
          <Field label="Profil">
            <select value={draft.type} onChange={(x) => setDraft({ ...draft, type: x.target.value })}>
              <option value="">Tous</option>{Object.entries(PROFIL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select value={draft.statut} onChange={(x) => setDraft({ ...draft, statut: x.target.value })}>
              <option value="">Tous</option><option value="actifs">Actifs</option><option value="suspendus">Suspendus</option><option value="supprimes">Supprimés</option>
            </select>
          </Field>
        </div>
        <div><button><Search size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Rechercher</button></div>
      </form>
      <div className="card">
        <Async s={s}>{(l) => (
          <>
            {l.length ? (
              <table>
                <thead><tr><th>Nom</th><th>Email</th><th>Profil</th><th>Statut</th><th>Inscrit</th><th /></tr></thead>
                <tbody>{l.map((u: any) => (
                  <tr key={u.id}>
                    <td><div className="x-who"><div className="x-av">{initials(u.nom)}</div><span>{u.nom}{u.is_admin && <> <span className="b">admin</span></>}</span></div></td>
                    <td>{u.email}{!u.email_verifie && <><br /><small className="mut">email non confirmé</small></>}</td>
                    <td>{PROFIL[u.type_profil] ?? u.type_profil}</td>
                    <td><span className={"b b-" + (u.statut === "actif" ? "active" : "refusee")}>{STATUT[u.statut] ?? u.statut}</span></td>
                    <td>{fdate(u.created_at)}</td>
                    <td className="actions">
                      <Link className="x-ia" to={`/admin/utilisateurs/${u.id}`}><Eye size={15} /> Fiche</Link>
                      {u.statut === "actif" && !u.is_admin && <button className="x-ia del" onClick={() => suspendre(u)}><Ban size={15} /> Suspendre</button>}
                      {u.statut === "suspendu" && <button className="x-ia" onClick={() => run(`/admin/utilisateurs/${u.id}/reactiver`, `${u.nom} est réactivé.`)}><RotateCcw size={15} /> Réactiver</button>}
                      {!u.email_verifie && u.statut !== "supprime" && <button className="x-ia" onClick={() => run(`/admin/utilisateurs/${u.id}/verifier-email`, `Email de ${u.nom} confirmé.`)}><MailCheck size={15} /> Confirmer l'email</button>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <div className="x-empty"><b>Aucun compte</b><p className="mut">Aucun compte pour ces filtres.</p></div>}
            <Pager page={page} setPage={setPage} n={l.length} />
          </>
        )}</Async>
      </div>
    </Page>
  );
}

export function AdminOffres() {
  const [draft, setDraft] = useState({ q: "", statut: "" });
  const [f, setF] = useState(draft);
  const [page, setPage] = useState(0);
  const s = useLoad(
    () => list("/admin/offres" + qs({ q: f.q, statut: f.statut, limit: PAGE, offset: page * PAGE })),
    [f, page]
  );
  const search = (ev: FormEvent) => { ev.preventDefault(); setPage(0); setF(draft); };
  const retirer = async (o: any) => {
    const note = o.candidatures > 0 ? "Elle a des candidatures : elle sera archivée, pas supprimée." : "Elle sera supprimée définitivement.";
    const motif = window.prompt(`Retirer « ${o.titre} » ? ${note}\nMotif (facultatif, transmis à l'entreprise) :`);
    if (motif === null) return;
    try {
      const r = await api(`/admin/offres/${o.id}${qs({ motif: motif.trim() })}`, "DELETE");
      toast.success(r?.message ?? "Offre retirée."); s.reload();
    } catch (x) { toast.error((x as Error).message); }
  };
  return (
    <Page title="Modération des offres">
      <form className="card" onSubmit={search}>
        <div className="x-search wide"><Search size={16} /><input placeholder="Rechercher par titre ou entreprise..." value={draft.q} onChange={(x) => setDraft({ ...draft, q: x.target.value })} /></div>
        <div className="row">
          <Field label="Statut">
            <select value={draft.statut} onChange={(x) => setDraft({ ...draft, statut: x.target.value })}>
              <option value="">Tous</option>{C.statutsOffre.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <div><button><Search size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Rechercher</button></div>
      </form>
      <div className="card">
        <Async s={s}>{(l) => (
          <>
            {l.length ? (
              <table>
                <thead><tr><th>Offre</th><th>Entreprise</th><th>Statut</th><th>Candidats</th><th>Créée</th><th /></tr></thead>
                <tbody>{l.map((o: any) => (
                  <tr key={o.id}>
                    <td><b>{o.titre}</b><br /><small className="mut">{o.type_contrat}{o.localisation ? " · " + o.localisation : ""}</small></td>
                    <td>{o.entreprise}</td>
                    <td><span className={"b b-" + o.statut}>{o.statut}</span></td>
                    <td>{o.candidatures}</td>
                    <td>{fdate(o.created_at)}</td>
                    <td className="actions"><button className="x-ia del" onClick={() => retirer(o)}><Trash2 size={15} /> Retirer</button></td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <div className="x-empty"><b>Aucune offre</b><p className="mut">Aucune offre pour ces filtres.</p></div>}
            <Pager page={page} setPage={setPage} n={l.length} />
          </>
        )}</Async>
      </div>
    </Page>
  );
}

const ACTIONS: Record<string, string> = {
  suspension_compte: "Compte suspendu",
  reactivation_compte: "Compte réactivé",
  suppression_offre: "Offre supprimée",
  archivage_offre_moderation: "Offre archivée (modération)",
  verification_email_manuelle: "Email confirmé manuellement",
};

export function AdminJournal() {
  const [page, setPage] = useState(0);
  const s = useLoad(() => list("/admin/logs" + qs({ limit: PAGE, offset: page * PAGE })), [page]);
  return (
    <Page title="Journal des actions">
      <div className="card">
        <Async s={s}>{(l) => (
          <>
            {l.length ? (
              <table>
                <thead><tr><th>Date</th><th>Administrateur</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead>
                <tbody>{l.map((x: any) => (
                  <tr key={x.id}>
                    <td>{fdate(x.created_at)}</td><td>{x.admin_nom ?? "—"}</td>
                    <td>{ACTIONS[x.action] ?? x.action}</td>
                    <td>{x.cible_type} <small className="mut">{String(x.cible_id).slice(0, 8)}</small></td>
                    <td>{x.details}</td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="mut">Aucune action enregistrée.</p>}
            <Pager page={page} setPage={setPage} n={l.length} />
          </>
        )}</Async>
      </div>
    </Page>
  );
}