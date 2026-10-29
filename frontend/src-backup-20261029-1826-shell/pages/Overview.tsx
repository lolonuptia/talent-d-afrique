/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { C, list } from "../api";
import { Async, Badge, Page, fdate, useLoad } from "../ui";

export default function Overview() {
  const s = useLoad(async () => {
    const [offres, cands] = await Promise.all([list("/offres/mine"), list("/candidatures/recues")]);
    return { offres, cands };
  }, [], 60000);
  return (
    <Page title="Vue d'ensemble" action={<Link className="btn" to="/offres/nouvelle">Publier une offre</Link>}>
      <Async s={s}>{({ offres, cands }) => {
        const n = (st: string) => cands.filter((c: any) => c.statut === st).length;
        const kpi: [string, number][] = [
          ["Offres actives", offres.filter((o: any) => o.statut === "active").length],
          ["Candidatures reçues", cands.length],
          ["À traiter", n("recue")],
          ["En entretien", n("entretien")],
          ["Acceptées", n("acceptee")],
        ];
        return (
          <>
            <div className="grid">{kpi.map(([l, v]) => <div key={l} className="card kpi"><b>{v}</b>{l}</div>)}</div>
            <div className="card">
              <h2>Candidatures par statut</h2>
              {C.statutsCand.map((st) => (
                <div key={st} style={{ display: "grid", gridTemplateColumns: "120px 1fr 30px", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <span>{st.replace(/_/g, " ")}</span>
                  <div className="bar"><i style={{ width: cands.length ? (100 * n(st)) / cands.length + "%" : "0" }} /></div>
                  <span>{n(st)}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h2>Dernières candidatures</h2>
              {cands.length ? (
                <table>
                  <thead><tr><th>Candidat</th><th>Offre</th><th>Statut</th><th>Reçue</th><th /></tr></thead>
                  <tbody>{cands.slice(0, 5).map((c: any) => (
                    <tr key={c.id}><td>{c.candidat_nom}</td><td>{c.offre_titre}</td><td><Badge v={c.statut} /></td><td>{fdate(c.created_at)}</td>
                      <td><Link to={`/candidats?offre=${c.offre_id}`}>Voir</Link></td></tr>
                  ))}</tbody>
                </table>
              ) : <p className="mut">Aucune candidature pour l'instant.</p>}
            </div>
            <div className="card">
              <h2>Offres et candidats</h2>
              {offres.length ? (
                <table>
                  <thead><tr><th>Offre</th><th>Statut</th><th>Candidats</th><th /></tr></thead>
                  <tbody>{offres.map((o: any) => (
                    <tr key={o.id}><td>{o.titre}</td><td><Badge v={o.statut} /></td><td>{cands.filter((c: any) => c.offre_id === o.id).length}</td>
                      <td><Link to={`/candidats?offre=${o.id}`}>Voir le classement</Link></td></tr>
                  ))}</tbody>
                </table>
              ) : <p className="mut">Aucune offre pour l'instant. Publie ta première offre pour recevoir des candidatures.</p>}
            </div>
          </>
        );
      }}</Async>
    </Page>
  );
}