import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, C, coerce, enumOf, list } from "../api";
import { Async, Badge, Err, Field, Page, fdate, useLoad } from "../ui";

export default function Entretiens() {
  const stOpts = enumOf("EntretienUpdate", "statut", []);
  const [sp] = useSearchParams();
  const [f, setF] = useState({ candidature_id: sp.get("cand") || "", date_heure: "", duree_minutes: "30", mode: C.modes[0], lieu_ou_lien: "", message: "" });
  const [e, setE] = useState<Error | null>(null);
  const s = useLoad(() => list("/entretiens"));
  const set = (k: string) => (x: any) => setF({ ...f, [k]: x.target.value });
  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try {
      await api("/entretiens", "POST", { ...f, date_heure: new Date(f.date_heure).toISOString(), duree_minutes: coerce("EntretienCreate", "duree_minutes", f.duree_minutes) });
      setF({ ...f, date_heure: "", lieu_ou_lien: "", message: "" }); s.reload();
    } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Entretiens">
      <form className="card" onSubmit={submit}>
        <h2>Planifier un entretien</h2>
        <div className="row">
          <Field label="Candidature (identifiant)"><input required value={f.candidature_id} onChange={set("candidature_id")} placeholder="Depuis la page Candidats" /></Field>
          <Field label="Date et heure"><input type="datetime-local" required value={f.date_heure} onChange={set("date_heure")} /></Field>
          <Field label="Durée (minutes)"><input type="number" min={5} value={f.duree_minutes} onChange={set("duree_minutes")} /></Field>
          <Field label="Mode"><select value={f.mode} onChange={set("mode")}>{C.modes.map((v) => <option key={v}>{v}</option>)}</select></Field>
        </div>
        <Field label="Lieu ou lien de visio"><input value={f.lieu_ou_lien} onChange={set("lieu_ou_lien")} /></Field>
        <Field label="Message au candidat"><textarea rows={2} value={f.message} onChange={set("message")} /></Field>
        <Err e={e} />
        <button>Planifier</button>
      </form>
      <div className="card">
        <h2>Entretiens prévus</h2>
        <Async s={s}>{(l) => l.length ? (
          <table>
            <thead><tr><th>Date</th><th>Durée</th><th>Mode</th><th>Lieu / lien</th><th>Statut</th></tr></thead>
            <tbody>{l.map((x) => <tr key={x.id}><td>{fdate(x.date_heure)}</td><td>{x.duree_minutes} min</td><td>{x.mode}</td><td>{x.lieu_ou_lien}</td><td>{stOpts.length ? <select value={x.statut} onChange={(e) => api(`/entretiens/${x.id}`, "PATCH", { statut: e.target.value }).then(s.reload).catch(setE)}>{stOpts.map((v) => <option key={v}>{v}</option>)}</select> : <Badge v={x.statut} />}</td></tr>)}</tbody>
          </table>
        ) : <p className="mut">Aucun entretien planifié.</p>}</Async>
      </div>
    </Page>
  );
}
