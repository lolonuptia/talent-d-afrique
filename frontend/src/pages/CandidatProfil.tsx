// @ts-nocheck
import { toast } from "sonner";
import { Award, Briefcase, Clock, ExternalLink, FileText, GraduationCap, User, Wallet } from "lucide-react";
import { api, openFile } from "../api";
import { Async, dispoLabel, useLoad } from "../ui";

const safe = (u) => (u && /^https?:\/\//i.test(u) ? u : null);

export default function CandidatProfil({ id }) {
  const s = useLoad(() => api("/candidatures/" + id + "/candidat"), [id]);
  const cv = async () => { try { await openFile("/candidatures/" + id + "/cv"); } catch (x) { toast.error(x.message); } };
  return (
    <Async s={s}>{(t) => (
      <div className="cpf">
        <div className="cpf-stats">
          <div className="cpf-stat"><small><User size={12} />Profil</small><b>{t.type_profil === "freelance" ? "Freelance" : "Étudiant"}</b></div>
          {t.disponibilite && <div className="cpf-stat"><small><Clock size={12} />Disponibilité</small><b>{dispoLabel(t.disponibilite)}</b></div>}
          {t.tjm ? <div className="cpf-stat"><small><Wallet size={12} />TJM</small><b>{t.tjm}</b></div> : null}
          {t.annees_experience != null && <div className="cpf-stat"><small><Briefcase size={12} />Expérience</small><b>{t.annees_experience} an{t.annees_experience > 1 ? "s" : ""}</b></div>}
        </div>
        {(t.competences || []).length > 0 && (
          <div className="cpf-sec"><h4>Compétences</h4><div className="cpf-tags">{t.competences.map((c) => <span key={c}>{c}</span>)}</div></div>
        )}
        {t.formations && <div className="cpf-sec"><h4><GraduationCap size={14} />Formations</h4><p>{t.formations}</p></div>}
        {t.experiences && <div className="cpf-sec"><h4><Briefcase size={14} />Expériences</h4><p>{t.experiences}</p></div>}
        {(t.certifications || []).length > 0 && (
          <div className="cpf-sec"><h4><Award size={14} />Certifications</h4>
            <div className="cpf-tags">{t.certifications.map((c, i) => <span key={i}>{c.organisme ? c.intitule + " (" + c.organisme + ")" : c.intitule}</span>)}</div>
          </div>
        )}
        {(t.portfolio || []).length > 0 && (
          <div className="cpf-sec"><h4><ExternalLink size={14} />Réalisations</h4>
            <div className="cpf-tags">{t.portfolio.map((p, i) => safe(p.url)
              ? <a key={i} href={safe(p.url)} target="_blank" rel="noreferrer noopener">{p.titre}</a>
              : <span key={i}>{p.titre}</span>)}</div>
          </div>
        )}
        <div className="cpf-acts">
          {safe(t.portfolio_url) && <a className="cpf-btn" href={safe(t.portfolio_url)} target="_blank" rel="noreferrer noopener"><ExternalLink size={14} />Portfolio</a>}
          {t.a_un_cv ? <button className="cpf-btn solid" onClick={cv}><FileText size={14} />Voir le CV (PDF)</button> : <span className="cpf-none">Aucun CV déposé.</span>}
        </div>
      </div>
    )}</Async>
  );
}