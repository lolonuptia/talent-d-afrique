import { useState } from "react";
import { api, list } from "../api";
import { Async, Page, useLoad } from "../ui";

function Detail({ id }: { id: string }) {
  const s = useLoad(() => api(`/talents/${id}`), [id]);
  return (
    <Async s={s}>{(t: any) => (
      <div style={{ marginTop: 8 }}>
        {t.formations && <p><b>Formations :</b> {typeof t.formations === "string" ? t.formations : JSON.stringify(t.formations)}</p>}
        {t.portfolio_url && <p><a href={t.portfolio_url} target="_blank" rel="noreferrer">Portfolio</a></p>}
        <p><b>Certifications :</b> {(t.certifications || []).map((c: any) => c.intitule).join(", ") || "aucune"}</p>
        <p><b>Réalisations :</b> {(t.portfolio || []).map((p: any) => p.titre).join(", ") || "aucune"}</p>
      </div>
    )}</Async>
  );
}

export default function Talents() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const s = useLoad(() => list("/talents"));
  return (
    <Page title="Talents">
      <div className="card">
        <input placeholder="Rechercher par nom ou compétence" value={q} onChange={(x) => setQ(x.target.value)} />
        <Async s={s}>{(l) => {
          const t = q.toLowerCase();
          const r = l.filter((x) => !t || (x.nom + " " + (x.competences || []).join(" ")).toLowerCase().includes(t));
          return r.length ? r.map((x) => (
            <div key={x.profile_id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
              <b>{x.nom}</b> <span className="b">{x.type_profil}</span>
              <div className="mut">{(x.competences || []).join(", ")}</div>
              <div className="mut">{x.disponibilite}{x.tjm ? ` · TJM ${x.tjm}` : ""}{x.annees_experience != null ? ` · ${x.annees_experience} ans` : ""}</div>
              <button className="ghost" onClick={() => setOpen(open === x.profile_id ? null : x.profile_id)}>{open === x.profile_id ? "Masquer" : "Voir le profil"}</button>
              {open === x.profile_id && <Detail id={x.profile_id} />}
            </div>
          )) : <p className="mut">Aucun talent trouvé.</p>;
        }}</Async>
      </div>
    </Page>
  );
}
