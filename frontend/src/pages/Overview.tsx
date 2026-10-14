import { Link } from "react-router-dom";
import { C, list } from "../api";
import { Async, Page, useLoad } from "../ui";

export default function Overview() {
  const s = useLoad(async () => {
    const offres: any[] = await list("/offres/mine");
    const cands: any[][] = await Promise.all(offres.map((o) => list(`/candidatures/offre/${o.id}`).catch(() => [])));
    return { offres, cands };
  });
  return (
    <Page title="Vue d'ensemble" action={<Link className="btn" to="/offres/nouvelle">Publier une offre</Link>}>
      <Async s={s}>{({ offres, cands }) => {
        const all = cands.flat();
        const n = (st: string) => all.filter((c) => c.statut === st).length;
        const kpi: [string, number][] = [
          ["Offres actives", offres.filter((o) => o.statut === "active").length],
          ["Candidatures reçues", all.length],
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
                  <span>{st.replace("_", " ")}</span>
                  <div className="bar"><i style={{ width: all.length ? (100 * n(st)) / all.length + "%" : "0" }} /></div>
                  <span>{n(st)}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <h2>Offres et candidats</h2>
              {offres.length ? (
                <table>
                  <thead><tr><th>Offre</th><th>Statut</th><th>Candidats</th><th /></tr></thead>
                  <tbody>{offres.map((o, i) => (
                    <tr key={o.id}><td>{o.titre}</td><td>{o.statut}</td><td>{cands[i].length}</td>
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
