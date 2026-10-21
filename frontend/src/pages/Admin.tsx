/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent } from "react";
import { C, api, list, qs } from "../api";
import { Async, Err, Field, Page, fdate, useLoad } from "../ui";

const PAGE = 50;

function Pager({ page, setPage, n }: { page: number; setPage: (p: number) => void; n: number }) {
  return (
    <p className="actions">
      <button className="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
      <button className="ghost" disabled={n < PAGE} onClick={() => setPage(page + 1)}>Suivant</button>
      <span className="mut">Page {page + 1}</span>
    </p>
  );
}

function Bars({ rows, label }: { rows: any[]; label: (r: any) => string }) {
  if (!rows.length) return <p className="mut">Aucune donnée.</p>;
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 40px", gap: 10, alignItems: "center", marginBottom: 6 }}>
          <span>{label(r)}</span>
          <div className="bar"><i style={{ width: (100 * r.total) / max + "%" }} /></div>
          <span>{r.total}</span>
        </div>
      ))}
    </>
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
        const kpi: [string, number | string][] = [
          ["Comptes", g.total_utilisateurs], ["Étudiants", g.total_etudiants], ["Freelances", g.total_freelances],
          ["Entreprises", g.total_entreprises], ["Écoles", g.total_ecoles], ["Offres actives", g.total_offres_actives],
          ["Candidatures", g.total_candidatures], ["Taux d'acceptation", g.taux_matching_moyen + " %"],
          ["Comptes suspendus", g.comptes_suspendus], ["Entreprises à vérifier", g.entreprises_non_verifiees],
        ];
        const top = [...d.candidatures_par_offre].sort((a: any, b: any) => b.total - a.total).slice(0, 10);
        return (
          <>
            <div className="grid">{kpi.map(([l, v]) => <div key={l} className="card kpi"><b>{v}</b>{l}</div>)}</div>
            <div className="card"><h2>Inscriptions par mois</h2><Bars rows={d.inscriptions_par_mois} label={(r) => r.mois} /></div>
            <div className="card"><h2>Entreprises par secteur</h2><Bars rows={d.entreprises_par_secteur} label={(r) => r.secteur} /></div>
            <div className="card"><h2>Offres par localisation</h2><Bars rows={d.offres_par_localisation} label={(r) => r.localisation} /></div>
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
  const [e, setE] = useState<Error | null>(null);
  const [ok, setOk] = useState("");
  const s = useLoad(
    () => list("/admin/utilisateurs" + qs({ q: f.q, type_profil: f.type, statut: f.statut, limit: PAGE, offset: page * PAGE })),
    [f, page]
  );
  const search = (ev: FormEvent) => { ev.preventDefault(); setPage(0); setF(draft); };
  const run = async (path: string, msg: string) => {
    try { setE(null); setOk(""); await api(path, "PATCH"); setOk(msg); s.reload(); } catch (x) { setE(x as Error); }
  };
  const suspendre = (u: any) => {
    const motif = window.prompt(`Suspendre ${u.nom} ? Motif (facultatif) :`);
    if (motif === null) return;
    run(`/admin/utilisateurs/${u.id}/suspendre${qs({ motif: motif.trim() })}`, `${u.nom} est suspendu.`);
  };
  return (
    <Page title="Utilisateurs">
      <form className="card" onSubmit={search}>
        <div className="row">
          <Field label="Recherche (nom ou email)"><input value={draft.q} onChange={(x) => setDraft({ ...draft, q: x.target.value })} /></Field>
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
        <button>Rechercher</button>
      </form>
      <div className="card">
        <Err e={e} />{ok && <p className="ok">{ok}</p>}
        <Async s={s}>{(l) => (
          <>
            {l.length ? (
              <table>
                <thead><tr><th>Nom</th><th>Email</th><th>Profil</th><th>Statut</th><th>Inscrit</th><th /></tr></thead>
                <tbody>{l.map((u: any) => (
                  <tr key={u.id}>
                    <td>{u.nom}{u.is_admin && <> <span className="b">admin</span></>}</td>
                    <td>{u.email}{!u.email_verifie && <><br /><small className="mut">email non confirmé</small></>}</td>
                    <td>{PROFIL[u.type_profil] ?? u.type_profil}</td>
                    <td><span className={"b b-" + (u.statut === "actif" ? "active" : "refusee")}>{STATUT[u.statut] ?? u.statut}</span></td>
                    <td>{fdate(u.created_at)}</td>
                    <td className="actions">
                      {u.statut === "actif" && !u.is_admin && <button className="danger" onClick={() => suspendre(u)}>Suspendre</button>}
                      {u.statut === "suspendu" && <button className="ghost" onClick={() => run(`/admin/utilisateurs/${u.id}/reactiver`, `${u.nom} est réactivé.`)}>Réactiver</button>}
                      {!u.email_verifie && u.statut !== "supprime" && <button className="ghost" onClick={() => run(`/admin/utilisateurs/${u.id}/verifier-email`, `Email de ${u.nom} confirmé.`)}>Confirmer l'email</button>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="mut">Aucun compte pour ces filtres.</p>}
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
  const [e, setE] = useState<Error | null>(null);
  const [ok, setOk] = useState("");
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
      setE(null); setOk("");
      const r = await api(`/admin/offres/${o.id}${qs({ motif: motif.trim() })}`, "DELETE");
      setOk(r?.message ?? "Offre retirée."); s.reload();
    } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Modération des offres">
      <form className="card" onSubmit={search}>
        <div className="row">
          <Field label="Recherche (titre ou entreprise)"><input value={draft.q} onChange={(x) => setDraft({ ...draft, q: x.target.value })} /></Field>
          <Field label="Statut">
            <select value={draft.statut} onChange={(x) => setDraft({ ...draft, statut: x.target.value })}>
              <option value="">Tous</option>{C.statutsOffre.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <button>Rechercher</button>
      </form>
      <div className="card">
        <Err e={e} />{ok && <p className="ok">{ok}</p>}
        <Async s={s}>{(l) => (
          <>
            {l.length ? (
              <table>
                <thead><tr><th>Offre</th><th>Entreprise</th><th>Statut</th><th>Candidats</th><th>Créée</th><th /></tr></thead>
                <tbody>{l.map((o: any) => (
                  <tr key={o.id}>
                    <td>{o.titre}<br /><small className="mut">{o.type_contrat}{o.localisation ? " · " + o.localisation : ""}</small></td>
                    <td>{o.entreprise}</td>
                    <td><span className={"b b-" + o.statut}>{o.statut}</span></td>
                    <td>{o.candidatures}</td>
                    <td>{fdate(o.created_at)}</td>
                    <td className="actions"><button className="danger" onClick={() => retirer(o)}>Retirer</button></td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="mut">Aucune offre pour ces filtres.</p>}
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