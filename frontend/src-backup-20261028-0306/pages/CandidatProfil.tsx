/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "sonner";
import { Award, Briefcase, ExternalLink, FileText, GraduationCap, Wallet } from "lucide-react";
import { api, openFile } from "../api";
import { Async, dispoLabel, useLoad } from "../ui";

const safe = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

export default function CandidatProfil({ id }: { id: string }) {
  const s = useLoad(() => api(`/candidatures/${id}/candidat`), [id]);
  const cv = async () => { try { await openFile(`/candidatures/${id}/cv`); } catch (x) { toast.error((x as Error).message); } };
  return (
    <Async s={s}>{(t: any) => (
      <div className="x-tdetail" style={{ borderTop: 0, paddingTop: 0 }}>
        <div className="x-meta">
          <span className="x-tag">{t.type_profil === "freelance" ? "Freelance" : "Étudiant"}</span>
          {t.disponibilite && <span><span className="x-dot-ok" /> {dispoLabel(t.disponibilite)}</span>}
          {t.tjm ? <span><Wallet size={13} /> TJM {t.tjm}</span> : null}
          {t.annees_experience != null && <span><Briefcase size={13} /> {t.annees_experience} an{t.annees_experience > 1 ? "s" : ""} d'expérience</span>}
        </div>
        {(t.competences || []).length > 0 && <div className="x-tags">{t.competences.map((c: string) => <span key={c}>{c}</span>)}</div>}
        {t.formations && <div><h4><GraduationCap size={15} /> Formations</h4><p>{t.formations}</p></div>}
        {t.experiences && <div><h4><Briefcase size={15} /> Expériences</h4><p style={{ whiteSpace: "pre-wrap" }}>{t.experiences}</p></div>}
        {(t.certifications || []).length > 0 && (
          <div><h4><Award size={15} /> Certifications</h4>
            <div className="x-tags">{t.certifications.map((c: any, i: number) => <span key={i}>{c.organisme ? `${c.intitule} (${c.organisme})` : c.intitule}</span>)}</div>
          </div>
        )}
        {(t.portfolio || []).length > 0 && (
          <div><h4><ExternalLink size={15} /> Réalisations</h4>
            <div className="x-tags">{t.portfolio.map((p: any, i: number) => safe(p.url)
              ? <a key={i} href={safe(p.url)!} target="_blank" rel="noreferrer noopener" style={{ textDecoration: "none" }}><span>{p.titre}</span></a>
              : <span key={i}>{p.titre}</span>)}</div>
          </div>
        )}
        <div className="x-cactions" style={{ marginTop: 0 }}>
          {safe(t.portfolio_url) && <a className="x-ia" href={safe(t.portfolio_url)!} target="_blank" rel="noreferrer noopener"><ExternalLink size={15} /> Portfolio</a>}
          {t.a_un_cv ? <button className="x-ia" onClick={cv}><FileText size={15} /> Voir le CV (PDF)</button> : <span className="mut">Aucun CV déposé.</span>}
        </div>
      </div>
    )}</Async>
  );
}