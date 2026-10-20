/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, C, coerce, list } from "../api";
import { Async, Badge, Err, Field, Page, csv, dispoLabel, fdate, useLoad } from "../ui";

export function OffresList() {
  const [st, setSt] = useState("");
  const [e, setE] = useState<Error | null>(null);
  const s = useLoad(async () => {
    const [offres, cands] = await Promise.all([list("/offres/mine"), list("/candidatures/recues").catch(() => [] as any[])]);
    return { offres, cands };
  });
  const act = async (fn: () => Promise<unknown>) => { try { setE(null); await fn(); s.reload(); } catch (x) { setE(x as Error); } };
  return (
    <Page title="Mes offres" action={<Link className="btn" to="/offres/nouvelle">Publier une offre</Link>}>
      <div className="card">
        <Field label="Filtrer par statut">
          <select value={st} onChange={(x) => setSt(x.target.value)}>
            <option value="">Tous</option>{C.statutsOffre.map((v) => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Err e={e} />
        <Async s={s}>{({ offres, cands }) => {
          const l = offres.filter((o: any) => !st || o.statut === st);
          const nb = (id: string) => cands.filter((c: any) => c.offre_id === id).length;
          return l.length ? (
            <table>
              <thead><tr><th>Titre</th><th>Contrat</th><th>Statut</th><th>Candidats</th><th>Créée</th><th /></tr></thead>
              <tbody>{l.map((o: any) => (
                <tr key={o.id}>
                  <td>{o.titre}</td><td>{o.type_contrat}</td><td><Badge v={o.statut} /></td><td>{nb(o.id)}</td><td>{fdate(o.created_at)}</td>
                  <td className="actions">
                    <Link className="btn ghost" to={`/candidats?offre=${o.id}`}>Candidats</Link>
                    <Link className="btn ghost" to={`/offres/${o.id}/modifier`}>Modifier</Link>
                    {o.statut === "active"
                      ? <button className="ghost" onClick={() => act(() => api(`/offres/${o.id}`, "PATCH", { statut: "archivee" }))}>Archiver</button>
                      : <button className="ghost" onClick={() => act(() => api(`/offres/${o.id}`, "PATCH", { statut: "active" }))}>Réactiver</button>}
                    <button className="danger" disabled={nb(o.id) > 0} title={nb(o.id) > 0 ? "Archive l'offre : elle a des candidatures" : ""} onClick={() => confirm("Supprimer cette offre ?") && act(() => api(`/offres/${o.id}`, "DELETE"))}>Supprimer</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          ) : <p className="mut">Aucune offre pour ce filtre.</p>;
        }}</Async>
      </div>
    </Page>
  );
}

const NIVEAUX: [string, string][] = [["", "Non précisé"], ["debutant", "Débutant"], ["junior", "Junior (0 à 2 ans)"], ["confirme", "Confirmé"], ["senior", "Senior (5 ans et +)"]];
const empty: Record<string, string> = { titre: "", description: "", type_contrat: "stage", obl: "", sou: "", soft: "", niveau: "", disponibilite: "", localisation: "", remuneration: "", tjm: "", statut: "active" };

export function OffreForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<Record<string, string>>(empty);
  const [e, setE] = useState<Error | null>(null);
  const set = (k: string) => (x: { target: { value: string } }) => setF({ ...f, [k]: x.target.value });

  useEffect(() => {
    if (!id) return;
    api(`/offres/${id}`).then((o) => setF({
      titre: o.titre ?? "", description: o.description ?? "", type_contrat: o.type_contrat, statut: o.statut,
      obl: o.competences_obligatoires ?? "", sou: o.competences_souhaitees ?? "", soft: o.soft_skills ?? "",
      niveau: o.niveau_experience ?? "", disponibilite: o.disponibilite ?? "", localisation: o.localisation ?? "",
      remuneration: String(o.remuneration ?? ""), tjm: String(o.budget_tjm ?? ""),
    })).catch(setE);
  }, [id]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    const body: Record<string, unknown> = {
      titre: f.titre.trim(), description: f.description, type_contrat: f.type_contrat,
      competences_obligatoires: csv(f.obl).join(", ") || null,
      competences_souhaitees: csv(f.sou).join(", ") || null,
      soft_skills: csv(f.soft).join(", ") || null,
      niveau_experience: f.niveau || null,
      disponibilite: f.disponibilite || null,
      localisation: f.localisation.trim() || null,
      remuneration: coerce("OffreCreate", "remuneration", f.remuneration),
      budget_tjm: f.type_contrat === "mission" ? coerce("OffreCreate", "budget_tjm", f.tjm) : null,
    };
    if (id) body.statut = f.statut;
    try { await api(id ? `/offres/${id}` : "/offres", id ? "PATCH" : "POST", body); nav("/offres"); } catch (x) { setE(x as Error); }
  };

  return (
    <Page title={id ? "Modifier l'offre" : "Publier une offre"}>
      <form className="card" onSubmit={submit}>
        <Field label="Titre"><input required minLength={3} value={f.titre} onChange={set("titre")} /></Field>
        <Field label="Description"><textarea rows={5} required value={f.description} onChange={set("description")} /></Field>
        <div className="row">
          <Field label="Type de contrat"><select value={f.type_contrat} onChange={set("type_contrat")}>{C.contrats.map((v) => <option key={v}>{v}</option>)}</select></Field>
          {f.type_contrat === "mission" && <Field label="Budget TJM maximum"><input type="number" min={0} value={f.tjm} onChange={set("tjm")} /></Field>}
          <Field label="Niveau d'expérience">
            <select value={f.niveau} onChange={set("niveau")}>
              {NIVEAUX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              {f.niveau && !NIVEAUX.some(([v]) => v === f.niveau) && <option value={f.niveau}>{f.niveau}</option>}
            </select>
          </Field>
          <Field label="Disponibilité attendue">
            <select value={f.disponibilite} onChange={set("disponibilite")}>
              <option value="">Non précisée</option>{C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
            </select>
          </Field>
          <Field label="Localisation"><input value={f.localisation} onChange={set("localisation")} /></Field>
          <Field label="Rémunération"><input type="number" min={0} value={f.remuneration} onChange={set("remuneration")} /></Field>
          {id && <Field label="Statut"><select value={f.statut} onChange={set("statut")}>{C.statutsOffre.map((v) => <option key={v}>{v}</option>)}</select></Field>}
        </div>
        <Field label="Compétences obligatoires (séparées par des virgules)"><input value={f.obl} onChange={set("obl")} /></Field>
        <Field label="Compétences souhaitées"><input value={f.sou} onChange={set("sou")} /></Field>
        <Field label="Soft skills"><input value={f.soft} onChange={set("soft")} /></Field>
        <Err e={e} />
        <p className="actions"><button>{id ? "Enregistrer" : "Publier"}</button><Link className="btn ghost" to="/offres">Annuler</Link></p>
      </form>
    </Page>
  );
}