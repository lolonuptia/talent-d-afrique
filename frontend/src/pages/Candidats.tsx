import { Fragment, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, C, list as getList, qs, queryParams } from "../api";
import { Async, Badge, Err, Field, Page, useLoad } from "../ui";

const crit = (d: any) =>
  d && typeof d === "object"
    ? Object.entries(d).map(([k, v]: [string, any]) => (
        <li key={k}>{k.replace(/_/g, " ")} : {typeof v === "object" && v ? (v.score ?? JSON.stringify(v)) : String(v)}</li>
      ))
    : null;

const P = () => {
  const n = queryParams("/api/candidatures/offre/{offre_id}/classees");
  const f = (re: RegExp, d: string) => (n.length ? n.find((x) => re.test(x)) : d);
  return { score: f(/score/, "score_min"), dispo: f(/dispo/, "disponibilite"), statut: f(/statut/, "statut") };
};

export default function Candidats() {
  const k = P();
  const [sp, setSp] = useSearchParams();
  const offre = sp.get("offre") || "";
  const [q, setQ] = useState({ score_min: "", disponibilite: "", statut: "" });
  const [open, setOpen] = useState<string | null>(null);
  const [e, setE] = useState<Error | null>(null);
  const offres = useLoad(() => getList("/offres/mine"));
  const list = useLoad(
    () => (offre ? getList(`/candidatures/offre/${offre}/classees${qs({ [k.score ?? "_s"]: k.score ? q.score_min : "", [k.dispo ?? "_d"]: k.dispo ? q.disponibilite : "", [k.statut ?? "_t"]: k.statut ? q.statut : "" })}`) : Promise.resolve([] as any[])),
    [offre, q.score_min, q.disponibilite, q.statut]
  );
  const setStatut = async (id: string, statut: string) => {
    try { setE(null); await api(`/candidatures/${id}/statut`, "PATCH", { statut }); list.reload(); } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Candidats classés par score">
      <div className="card">
        <div className="row">
          <Field label="Offre">
            <select value={offre} onChange={(x) => setSp(x.target.value ? { offre: x.target.value } : {})}>
              <option value="">Choisir une offre</option>
              {(offres.data || []).map((o) => <option key={o.id} value={o.id}>{o.titre}</option>)}
            </select>
          </Field>
          {k.score && <Field label="Score minimum"><input type="number" min={0} max={100} value={q.score_min} onChange={(x) => setQ({ ...q, score_min: x.target.value })} /></Field>}
          {k.dispo && <Field label="Disponibilité"><input value={q.disponibilite} onChange={(x) => setQ({ ...q, disponibilite: x.target.value })} /></Field>}
          {k.statut && <Field label="Statut">
            <select value={q.statut} onChange={(x) => setQ({ ...q, statut: x.target.value })}>
              <option value="">Tous</option>{C.statutsCand.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>}
        </div>
        <Err e={e} />
        {!offre ? <p className="mut">Choisis une offre pour voir ses candidats.</p> : (
          <Async s={list}>{(rows) => rows.length ? (
            <table>
              <thead><tr><th>#</th><th>Candidat</th><th>Score</th><th>Statut</th><th /></tr></thead>
              <tbody>{rows.map((c, i) => (
                <Fragment key={c.id}>
                  <tr>
                    <td>{i + 1}</td>
                    <td>{String(c.candidat_id).slice(0, 8)}{c.recommandee && <> <Badge v="active" /></>}<br /><span className="mut">{c.message}</span></td>
                    <td><b>{Math.round(c.score_global)}</b>/100<div className="bar"><i style={{ width: c.score_global + "%" }} /></div></td>
                    <td><select value={c.statut} onChange={(x) => setStatut(c.id, x.target.value)}>{C.statutsCand.map((v) => <option key={v}>{v}</option>)}</select></td>
                    <td className="actions">
                      <button className="ghost" onClick={() => setOpen(open === c.id ? null : c.id)}>Détail du score</button>
                      <Link className="btn ghost" to={`/entretiens?cand=${c.id}`}>Entretien</Link>
                      <Link className="btn ghost" to={`/messages?c=${c.id}`}>Écrire</Link>
                    </td>
                  </tr>
                  {open === c.id && <tr><td /><td colSpan={4}><ul>{crit(c.detail_score)}</ul></td></tr>}
                </Fragment>
              ))}</tbody>
            </table>
          ) : <p className="mut">Aucun candidat pour ces filtres.</p>}</Async>
        )}
      </div>
    </Page>
  );
}
