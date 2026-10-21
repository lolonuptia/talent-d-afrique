/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, C, coerce, list } from "../api";
import { Async, Badge, Err, Field, Page, fdate, useLoad } from "../ui";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const MODE: Record<string, string> = { visio: "Visio", presentiel: "Présentiel", telephone: "Téléphone" };

export default function Entretiens() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ candidature_id: sp.get("cand") || "", date_heure: "", duree_minutes: "30", mode: C.modes[0], lieu_ou_lien: "", message: "" });
  const [e, setE] = useState<Error | null>(null);
  const [eT, setET] = useState<Error | null>(null);
  const [rep, setRep] = useState<{ id: string; v: string } | null>(null);
  const s = useLoad(async () => {
    const [entretiens, cands] = await Promise.all([list("/entretiens"), list("/candidatures/recues")]);
    return { entretiens, cands };
  });
  const set = (k: string) => (x: { target: { value: string } }) => setF({ ...f, [k]: x.target.value });
  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try {
      await api("/entretiens", "POST", {
        candidature_id: f.candidature_id, date_heure: new Date(f.date_heure).toISOString(),
        duree_minutes: coerce("EntretienCreate", "duree_minutes", f.duree_minutes), mode: f.mode,
        lieu_ou_lien: f.lieu_ou_lien || null, message: f.message || null, fuseau: TZ,
      });
      setF({ ...f, date_heure: "", lieu_ou_lien: "", message: "" }); s.reload();
    } catch (x) { setE(x as Error); }
  };
  const patch = async (id: string, body: Record<string, unknown>) => {
    try { setET(null); await api(`/entretiens/${id}`, "PATCH", body); setRep(null); s.reload(); } catch (x) { setET(x as Error); }
  };
  return (
    <Page title="Entretiens">
      <Async s={s}>{({ entretiens, cands }) => {
        const byId = new Map<string, any>(cands.map((c: any) => [c.id, c] as [string, any]));
        const ouvertes = cands.filter((c: any) => !["refusee", "acceptee"].includes(c.statut));
        return (
          <>
            <form className="card" onSubmit={submit}>
              <h2>Planifier un entretien</h2>
              <div className="row">
                <Field label="Candidat">
                  <select required value={f.candidature_id} onChange={set("candidature_id")}>
                    <option value="">Choisir un candidat</option>
                    {ouvertes.map((c: any) => <option key={c.id} value={c.id}>{c.candidat_nom} — {c.offre_titre}</option>)}
                  </select>
                </Field>
                <Field label="Date et heure"><input type="datetime-local" required value={f.date_heure} onChange={set("date_heure")} /></Field>
                <Field label="Durée (minutes)"><input type="number" min={5} max={480} value={f.duree_minutes} onChange={set("duree_minutes")} /></Field>
                <Field label="Mode"><select value={f.mode} onChange={set("mode")}>{C.modes.map((v) => <option key={v} value={v}>{MODE[v] ?? v}</option>)}</select></Field>
              </div>
              <Field label="Lieu ou lien de visio"><input value={f.lieu_ou_lien} onChange={set("lieu_ou_lien")} /></Field>
              <Field label="Message au candidat"><textarea rows={2} value={f.message} onChange={set("message")} /></Field>
              <Err e={e} />
              <button>Planifier</button>
            </form>
            <div className="card">
              <h2>Entretiens prévus</h2>
              <Err e={eT} />
              {entretiens.length ? (
                <table>
                  <thead><tr><th>Date</th><th>Candidat</th><th>Offre</th><th>Durée</th><th>Mode</th><th>Lieu / lien</th><th>Statut</th><th /></tr></thead>
                  <tbody>{entretiens.map((x: any) => {
                    const c = byId.get(x.candidature_id);
                    const r = rep && rep.id === x.id ? rep : null;
                    return (
                      <tr key={x.id}>
                        <td>{fdate(x.date_heure)}</td><td>{c?.candidat_nom ?? "—"}</td><td>{c?.offre_titre ?? "—"}</td>
                        <td>{x.duree_minutes} min</td><td>{MODE[x.mode] ?? x.mode}</td><td>{x.lieu_ou_lien}</td>
                        <td><select value={x.statut} onChange={(ev) => patch(x.id, { statut: ev.target.value })}>
                          {(C.statutsEntretien.includes(x.statut) ? C.statutsEntretien : [x.statut, ...C.statutsEntretien]).map((v) => <option key={v}>{v}</option>)}
                        </select></td>
                        <td className="actions">
                          {x.statut === "planifie" && (r ? (
                            <>
                              <input type="datetime-local" value={r.v} onChange={(ev) => setRep({ id: x.id, v: ev.target.value })} />
                              <button disabled={!r.v} onClick={() => patch(x.id, { date_heure: new Date(r.v).toISOString(), fuseau: TZ })}>Valider</button>
                              <button className="ghost" onClick={() => setRep(null)}>Annuler</button>
                            </>
                          ) : <button className="ghost" onClick={() => setRep({ id: x.id, v: "" })}>Reporter</button>)}
                          {!c && <Badge v={x.statut} />}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              ) : <p className="mut">Aucun entretien planifié.</p>}
            </div>
          </>
        );
      }}</Async>
    </Page>
  );
}