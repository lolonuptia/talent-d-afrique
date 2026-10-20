/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, C, list as getList, qs } from "../api";
import { Async, Err, Field, Page, dispoLabel, useLoad } from "../ui";

const LAB: Record<string, string> = {
  competences_obligatoires: "Compétences obligatoires", competences_souhaitees: "Compétences souhaitées",
  experience: "Expérience / TJM", disponibilite: "Disponibilité", soft_skills: "Soft skills",
};

export default function Candidats() {
  const [sp, setSp] = useSearchParams();
  const offre = sp.get("offre") || "";
  const [q, setQ] = useState({ score_min: "", disponibilite: "", statut: "" });
  const [scoreIn, setScoreIn] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);
  const [e, setE] = useState<Error | null>(null);
  const offres = useLoad(() => getList("/offres/mine"));
  const rows = useLoad(
    () => (offre ? getList(`/candidatures/offre/${offre}/classees${qs(q)}`) : Promise.resolve([] as any[])),
    [offre, q.score_min, q.disponibilite, q.statut]
  );
  const onScore = (v: string) => {
    setScoreIn(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setQ((p) => ({ ...p, score_min: v })), 400);
  };
  const setStatut = async (id: string, statut: string) => {
    try { setE(null); await api(`/candidatures/${id}/statut`, "PATCH", { statut }); rows.reload(); } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Candidats classés par score">
      <div className="card">
        <div className="row">
          <Field label="Offre">
            <select value={offre} onChange={(x) => setSp(x.target.value ? { offre: x.target.value } : {})}>
              <option value="">Choisir une offre</option>
              {(offres.data || []).map((o: any) => <option key={o.id} value={o.id}>{o.titre}</option>)}
            </select>
          </Field>
          <Field label="Score minimum"><input type="number" min={0} max={100} value={scoreIn} onChange={(x) => onScore(x.target.value)} /></Field>
          <Field label="Disponibilité">
            <select value={q.disponibilite} onChange={(x) => setQ({ ...q, disponibilite: x.target.value })}>
              <option value="">Toutes</option>{C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select value={q.statut} onChange={(x) => setQ({ ...q, statut: x.target.value })}>
              <option value="">Tous</option>{C.statutsCand.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
        </div>
        <Err e={offres.error} />
        <Err e={e} />
        {!offre ? <p className="mut">Choisis une offre pour voir ses candidats.</p> : (
          <Async s={rows}>{(l) => l.length ? (
            <table>
              <thead><tr><th>#</th><th>Candidat</th><th>Score</th><th>Statut</th><th /></tr></thead>
              <tbody>{l.map((c: any, i: number) => (
                <Fragment key={c.id}>
                  <tr>
                    <td>{i + 1}</td>
                    <td><b>{c.candidat_nom || String(c.candidat_id).slice(0, 8)}</b>{c.recommandee && <> <span className="b b-active">Recommandé</span></>}<br /><span className="mut">{c.message}</span></td>
                    <td><b>{Math.round(c.score_global)}</b>/100<div className="bar"><i style={{ width: c.score_global + "%" }} /></div></td>
                    <td><select value={c.statut} onChange={(x) => setStatut(c.id, x.target.value)}>{C.statutsCand.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}</select></td>
                    <td className="actions">
                      <button className="ghost" onClick={() => setOpen(open === c.id ? null : c.id)}>Détail du score</button>
                      <Link className="btn ghost" to={`/entretiens?cand=${c.id}`}>Entretien</Link>
                      <Link className="btn ghost" to={`/messages?c=${c.id}`}>Écrire</Link>
                    </td>
                  </tr>
                  {open === c.id && <tr><td /><td colSpan={4}>{Object.entries(c.detail_score || {}).map(([k, v]) => (
                    <div key={k} style={{ display: "grid", gridTemplateColumns: "220px 1fr 40px", gap: 10, alignItems: "center", marginBottom: 4 }}>
                      <span>{LAB[k] ?? k.replace(/_/g, " ")}</span><div className="bar"><i style={{ width: Number(v) + "%" }} /></div><span>{Math.round(Number(v))}</span>
                    </div>
                  ))}</td></tr>}
                </Fragment>
              ))}</tbody>
            </table>
          ) : <p className="mut">Aucun candidat pour ces filtres.</p>}</Async>
        )}
      </div>
    </Page>
  );
}