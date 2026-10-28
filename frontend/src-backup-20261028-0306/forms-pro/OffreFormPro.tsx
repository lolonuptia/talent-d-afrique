// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Briefcase, MapPin, Building2, Check, ChevronLeft, ChevronRight, Send, Save, Eye, Loader2 } from "lucide-react";
import { api, C, coerce } from "../api";
import { csv, dispoLabel } from "../ui";
import { Field, Segmented, Tags } from "./FormsPro";
import "./forms-pro.css";

const DRAFT = "fp-offre-draft";
const STEPS = ["Poste", "Détails", "Conditions", "Récap"];
const NIVEAUX = [["", "Non précisé"], ["debutant", "Débutant"], ["junior", "Junior (0 à 2 ans)"], ["confirme", "Confirmé"], ["senior", "Senior (5 ans et +)"]];
const EMPTY = { titre: "", description: "", type_contrat: "stage", obl: [], sou: [], soft: [], niveau: "", disponibilite: "", localisation: "", remuneration: "", tjm: "", statut: "active" };
const label = (v) => (v === "cdi" || v === "cdd" ? v.toUpperCase() : v.charAt(0).toUpperCase() + v.slice(1));

function validate(step, f) {
  const e = {};
  if (step === 0) {
    if (f.titre.trim().length < 3) e.titre = "Donnez un intitulé d'au moins 3 caractères.";
  }
  if (step === 1) {
    if (f.description.trim().length < 20) e.description = "Encore " + (20 - f.description.trim().length) + " caractères minimum pour une description utile.";
  }
  if (step === 2) {
    if (f.remuneration !== "" && Number(f.remuneration) < 0) e.remuneration = "La valeur doit être positive.";
    if (f.type_contrat === "mission" && f.tjm !== "" && Number(f.tjm) < 0) e.tjm = "La valeur doit être positive.";
  }
  return e;
}

export default function OffreFormPro() {
  const { id } = useParams();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [f, setF] = useState(() => {
    if (id) return EMPTY;
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(DRAFT) || "{}") }; } catch { return EMPTY; }
  });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const inp = (k) => ({ value: f[k], onChange: (e) => set(k)(e.target.value) });

  useEffect(() => {
    if (!id) return;
    api("/offres/" + id).then((o) => setF({
      titre: o.titre ?? "", description: o.description ?? "", type_contrat: o.type_contrat ?? "stage", statut: o.statut ?? "active",
      obl: csv(o.competences_obligatoires ?? ""), sou: csv(o.competences_souhaitees ?? ""), soft: csv(o.soft_skills ?? ""),
      niveau: o.niveau_experience ?? "", disponibilite: o.disponibilite ?? "", localisation: o.localisation ?? "",
      remuneration: o.remuneration == null ? "" : String(o.remuneration), tjm: o.budget_tjm == null ? "" : String(o.budget_tjm),
    })).catch((x) => toast.error(x.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (id || loading) return;
    setSaved(false);
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT, JSON.stringify(f)); setSaved(true); } catch {} }, 500);
    return () => clearTimeout(t);
  }, [f, id, loading]);

  const errors = validate(step, f);
  const E = tried ? errors : {};
  const next = () => { setTried(true); if (Object.keys(errors).length) return; setTried(false); setStep((s) => s + 1); };

  const submit = async () => {
    for (let s = 0; s < 3; s++) { if (Object.keys(validate(s, f)).length) { setStep(s); setTried(true); return; } }
    setBusy(true);
    const body = {
      titre: f.titre.trim(), description: f.description, type_contrat: f.type_contrat,
      competences_obligatoires: f.obl.join(", ") || null,
      competences_souhaitees: f.sou.join(", ") || null,
      soft_skills: f.soft.join(", ") || null,
      niveau_experience: f.niveau || null,
      disponibilite: f.disponibilite || null,
      localisation: f.localisation.trim() || null,
      remuneration: coerce("OffreCreate", "remuneration", f.remuneration),
      budget_tjm: f.type_contrat === "mission" ? coerce("OffreCreate", "budget_tjm", f.tjm) : null,
    };
    if (id) body.statut = f.statut;
    try {
      await api(id ? "/offres/" + id : "/offres", id ? "PATCH" : "POST", body);
      try { localStorage.removeItem(DRAFT); } catch {}
      toast.success(id ? "Offre enregistrée" : "Offre publiée");
      nav("/offres");
    } catch (x) { toast.error(x.message); setBusy(false); }
  };

  if (loading) return <div className="fp"><p style={{ opacity: 0.6 }}>Chargement…</p></div>;

  const money = f.type_contrat === "mission" ? (f.tjm ? "TJM max " + f.tjm : "TJM à négocier") : (f.remuneration ? f.remuneration : "À négocier");
  const contrats = (C.contrats || []).map((v) => ({ value: v, label: label(v) }));
  const dispos = [{ value: "", label: "Non précisée" }, ...(C.dispos || []).map((v) => ({ value: v, label: dispoLabel(v) }))];

  return (
    <div className="fp">
      <div className="fp-split">
        <div className="fp-card">
          <header className="fp-card-head">
            <div><h2>{id ? "Modifier l'offre" : "Publier une offre"}</h2><p>Étape {step + 1} sur 4</p></div>
            {!id && <span className={"fp-save" + (saved ? " ok" : "")}><Save size={13} />{saved ? "Brouillon enregistré" : "Enregistrement…"}</span>}
          </header>
          <ol className="fp-steps">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? "done" : i === step ? "cur" : ""}>
                <span>{i < step ? <Check size={14} /> : i + 1}</span><b>{s}</b>
              </li>
            ))}
          </ol>

          <div className="fp-body">
            {step === 0 && (<>
              <Field label="Titre du poste" required error={E.titre} right={f.titre.length + " / 120"} hint="Soyez précis : « Développeur React confirmé » attire mieux que « Développeur ».">
                <input className="fp-input" maxLength={120} placeholder="Ex : Développeur React confirmé" {...inp("titre")} />
              </Field>
              <Field label="Type de contrat"><Segmented options={contrats} value={f.type_contrat} onChange={set("type_contrat")} /></Field>
              <Field label="Localisation"><input className="fp-input" placeholder="Ex : Dakar" {...inp("localisation")} /></Field>
            </>)}

            {step === 1 && (<>
              <Field label="Description" required error={E.description} right={f.description.length + " caractères"}>
                <textarea className="fp-input" rows={7} placeholder="Missions, contexte, équipe, avantages…" {...inp("description")} />
              </Field>
              <Field label="Compétences obligatoires" hint="Tapez puis Entrée, ou cliquez une suggestion.">
                <Tags value={f.obl} onChange={set("obl")} suggestions={["React", "TypeScript", "Python", "SQL", "Git", "Docker", "Node.js", "Figma"]} placeholder="Ex : React" />
              </Field>
              <Field label="Compétences souhaitées">
                <Tags value={f.sou} onChange={set("sou")} suggestions={["Docker", "Tests", "CI/CD", "AWS", "Agile"]} placeholder="Ex : Docker" />
              </Field>
              <Field label="Soft skills">
                <Tags value={f.soft} onChange={set("soft")} suggestions={["Autonomie", "Communication", "Esprit d'équipe", "Rigueur"]} placeholder="Ex : Autonomie" />
              </Field>
            </>)}

            {step === 2 && (<>
              <Field label="Niveau d'expérience">
                <select className="fp-input" {...inp("niveau")}>
                  {NIVEAUX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  {f.niveau && !NIVEAUX.some(([v]) => v === f.niveau) && <option value={f.niveau}>{f.niveau}</option>}
                </select>
              </Field>
              <Field label="Disponibilité attendue"><Segmented options={dispos} value={f.disponibilite} onChange={set("disponibilite")} /></Field>
              <div className="fp-grid2">
                <Field label="Rémunération" error={E.remuneration}><input className="fp-input" type="number" min="0" placeholder="0" {...inp("remuneration")} /></Field>
                {f.type_contrat === "mission" && <Field label="Budget TJM maximum" error={E.tjm}><input className="fp-input" type="number" min="0" placeholder="0" {...inp("tjm")} /></Field>}
              </div>
              {id && <Field label="Statut"><Segmented options={(C.statutsOffre || []).map((v) => ({ value: v, label: label(v) }))} value={f.statut} onChange={set("statut")} /></Field>}
            </>)}

            {step === 3 && (
              <div className="fp-recap">
                <p className="fp-hint">Vérifiez les informations avant de {id ? "enregistrer" : "publier"}.</p>
                {[["Poste", f.titre], ["Contrat", label(f.type_contrat)], ["Lieu", f.localisation || "Non précisé"],
                  ["Obligatoires", f.obl.join(", ") || "—"], ["Souhaitées", f.sou.join(", ") || "—"], ["Soft skills", f.soft.join(", ") || "—"],
                  ["Expérience", (NIVEAUX.find(([v]) => v === f.niveau) || [0, f.niveau || "Non précisé"])[1]],
                  ["Disponibilité", f.disponibilite ? dispoLabel(f.disponibilite) : "Non précisée"], ["Rémunération", money]]
                  .map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
              </div>
            )}
          </div>

          <footer className="fp-actions">
            {step === 0
              ? <button className="fp-btn" onClick={() => nav("/offres")}>Annuler</button>
              : <button className="fp-btn" onClick={() => { setTried(false); setStep((s) => s - 1); }}><ChevronLeft size={16} />Retour</button>}
            {step < 3
              ? <button className="fp-btn solid" onClick={next}>Continuer<ChevronRight size={16} /></button>
              : <button className="fp-btn gold" disabled={busy} onClick={submit}>{busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}{id ? "Enregistrer" : "Publier l'offre"}</button>}
          </footer>
        </div>

        <aside className="fp-preview">
          <span className="fp-prev-lab"><Eye size={14} />Aperçu en direct</span>
          <div className="fp-card fp-offer">
            <div className="fp-offer-top">
              <span className="fp-logo"><Building2 size={20} /></span>
              <div><b>{f.titre || "Titre du poste"}</b><small>Votre entreprise</small></div>
            </div>
            <div className="fp-chips">
              <span><Briefcase size={12} />{label(f.type_contrat)}</span>
              <span><MapPin size={12} />{f.localisation || "Lieu"}</span>
              {f.disponibilite && <span>{dispoLabel(f.disponibilite)}</span>}
            </div>
            <p>{f.description ? f.description.slice(0, 140) + (f.description.length > 140 ? "…" : "") : "La description de votre offre apparaîtra ici."}</p>
            <div className="fp-minitags">{f.obl.slice(0, 4).map((s) => <span key={s}>{s}</span>)}</div>
            <div className="fp-offer-foot"><b>{money}</b></div>
          </div>
        </aside>
      </div>
    </div>
  );
}