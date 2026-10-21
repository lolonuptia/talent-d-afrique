/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { api, openFile } from "../api";
import { Async, Err, dispoLabel, useLoad } from "../ui";

const safe = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

export default function CandidatProfil({ id }: { id: string }) {
  const s = useLoad(() => api(`/candidatures/${id}/candidat`), [id]);
  const [e, setE] = useState<Error | null>(null);
  const cv = async () => { try { setE(null); await openFile(`/candidatures/${id}/cv`); } catch (x) { setE(x as Error); } };
  return (
    <Async s={s}>{(t: any) => (
      <div>
        <p className="mut">
          {t.type_profil === "freelance" ? "Freelance" : "Étudiant"}
          {t.disponibilite ? ` · Disponibilité : ${dispoLabel(t.disponibilite)}` : ""}
          {t.tjm ? ` · TJM ${t.tjm}` : ""}
          {t.annees_experience != null ? ` · ${t.annees_experience} ans d'expérience` : ""}
        </p>
        {(t.competences || []).length > 0 && <div className="chips">{t.competences.map((c: string) => <span key={c} className="b">{c}</span>)}</div>}
        {t.formations && <p><b>Formations :</b> {t.formations}</p>}
        {t.experiences && <p style={{ whiteSpace: "pre-wrap" }}><b>Expériences :</b> {t.experiences}</p>}
        {(t.certifications || []).length > 0 && (
          <p><b>Certifications :</b> {t.certifications.map((c: any) => (c.organisme ? `${c.intitule} (${c.organisme})` : c.intitule)).join(", ")}</p>
        )}
        {(t.portfolio || []).length > 0 && (
          <p><b>Réalisations :</b> {t.portfolio.map((p: any, i: number) => (
            <span key={i}>{i > 0 && ", "}{safe(p.url) ? <a href={safe(p.url)!} target="_blank" rel="noreferrer noopener">{p.titre}</a> : p.titre}</span>
          ))}</p>
        )}
        {safe(t.portfolio_url) && <p><a href={safe(t.portfolio_url)!} target="_blank" rel="noreferrer noopener">Portfolio</a></p>}
        <Err e={e} />
        {t.a_un_cv ? <button className="ghost" onClick={cv}>Voir le CV (PDF)</button> : <p className="mut">Aucun CV déposé.</p>}
      </div>
    )}</Async>
  );
}