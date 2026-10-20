/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type FormEvent } from "react";
import { api, C, list } from "../api";
import { Async, Field, Page, csv, dispoLabel, useLoad } from "../ui";

const LIMIT = 20;
const EMPTY = { comp: "", dispo: "", type: "", tjm: "" };
const safe = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

function Detail({ id }: { id: string }) {
  const s = useLoad(() => api(`/talents/${id}`), [id]);
  return (
    <Async s={s}>{(t: any) => (
      <div style={{ marginTop: 8 }}>
        {t.formations && <p><b>Formations :</b> {typeof t.formations === "string" ? t.formations : JSON.stringify(t.formations)}</p>}
        {safe(t.portfolio_url) && <p><a href={safe(t.portfolio_url)!} target="_blank" rel="noreferrer noopener">Portfolio</a></p>}
        <p><b>Certifications :</b> {(t.certifications || []).map((c: any) => c.intitule).join(", ") || "aucune"}</p>
        <p><b>Réalisations :</b> {(t.portfolio || []).map((p: any) => p.titre).join(", ") || "aucune"}</p>
      </div>
    )}</Async>
  );
}

export default function Talents() {
  const [draft, setDraft] = useState(EMPTY);
  const [f, setF] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const s = useLoad(() => {
    const p = new URLSearchParams();
    csv(f.comp).forEach((c) => p.append("competence", c));
    if (f.dispo) p.set("disponibilite", f.dispo);
    if (f.type) p.set("type_profil", f.type);
    if (f.tjm) p.set("tjm_max", f.tjm);
    p.set("limit", String(LIMIT)); p.set("offset", String(page * LIMIT));
    return list("/talents?" + p.toString());
  }, [f, page]);
  const search = (ev: FormEvent) => { ev.preventDefault(); setPage(0); setF(draft); };
  return (
    <Page title="Talents">
      <form className="card" onSubmit={search}>
        <div className="row">
          <Field label="Compétences (séparées par des virgules, toutes requises)"><input placeholder="python, react" value={draft.comp} onChange={(x) => setDraft({ ...draft, comp: x.target.value })} /></Field>
          <Field label="Disponibilité">
            <select value={draft.dispo} onChange={(x) => setDraft({ ...draft, dispo: x.target.value })}>
              <option value="">Toutes</option>{C.dispos.map((v) => <option key={v} value={v}>{dispoLabel(v)}</option>)}
            </select>
          </Field>
          <Field label="Profil">
            <select value={draft.type} onChange={(x) => setDraft({ ...draft, type: x.target.value })}>
              <option value="">Tous</option><option value="etudiant">Étudiants</option><option value="freelance">Freelances</option>
            </select>
          </Field>
          <Field label="TJM max (freelances)"><input type="number" min={0} value={draft.tjm} onChange={(x) => setDraft({ ...draft, tjm: x.target.value })} /></Field>
        </div>
        <button>Rechercher</button>
      </form>
      <div className="card">
        <Async s={s}>{(r) => (
          <>
            {r.length ? r.map((x: any) => (
              <div key={x.profile_id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                <b>{x.nom}</b> <span className="b">{x.type_profil}</span>
                <div className="mut">{(x.competences || []).join(", ")}</div>
                <div className="mut">{dispoLabel(x.disponibilite)}{x.tjm ? ` · TJM ${x.tjm}` : ""}{x.annees_experience != null ? ` · ${x.annees_experience} ans` : ""}</div>
                <button className="ghost" onClick={() => setOpen(open === x.profile_id ? null : x.profile_id)}>{open === x.profile_id ? "Masquer" : "Voir le profil"}</button>
                {open === x.profile_id && <Detail id={x.profile_id} />}
              </div>
            )) : <p className="mut">Aucun talent trouvé.</p>}
            <p className="actions">
              <button className="ghost" disabled={page === 0} onClick={() => setPage(page - 1)}>Précédent</button>
              <button className="ghost" disabled={r.length < LIMIT} onClick={() => setPage(page + 1)}>Suivant</button>
              <span className="mut">Page {page + 1}</span>
            </p>
          </>
        )}</Async>
      </div>
    </Page>
  );
}