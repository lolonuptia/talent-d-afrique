// @ts-nocheck
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, Building2 } from "lucide-react";
import { api, coerce } from "../api";
import { useAuth } from "../auth";
import { Err } from "../ui";
import { Field, Segmented } from "./FormsPro";
import "./forms-pro.css";

const EMPTY = { logo_url: "", description: "", secteur: "", taille: "", culture: "", localisation: "" };
const KEYS = Object.keys(EMPTY);
const SECTEURS = ["Technologie", "Finance", "Santé", "Éducation", "Logistique", "Commerce", "Industrie", "Autre"];
const TAILLES = ["1-10", "11-50", "51-200", "200+"];

export default function ProfilPro() {
  const { user } = useAuth();
  const [base, setBase] = useState(EMPTY);
  const [f, setF] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const [e, setE] = useState(null);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const inp = (k) => ({ value: f[k] ?? "", onChange: (x) => set(k)(x.target.value) });

  useEffect(() => {
    api("/profiles/me")
      .then((d) => { const v = { ...EMPTY }; KEYS.forEach((k) => { v[k] = d?.[k] ?? ""; }); setBase(v); setF(v); })
      .catch((x) => { if (x.status !== 404) setE(x); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => setLogoOk(true), [f.logo_url]);

  const dirty = JSON.stringify(f) !== JSON.stringify(base);
  const err = {};
  if (f.logo_url && !/^https?:\/\/\S+\.\S+/i.test(f.logo_url)) err.logo_url = "Format attendu : https://monsite.com/logo.png";
  const E = tried ? err : {};
  const filled = KEYS.filter((k) => String(f[k] ?? "").trim()).length;
  const pct = Math.round((filled / KEYS.length) * 100);
  const nom = user?.nom || "Entreprise";
  const ini = nom.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const showLogo = /^https?:\/\//i.test(f.logo_url) && logoOk;

  const save = async () => {
    setTried(true); setE(null);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      const body = Object.fromEntries(KEYS.map((k) => [k, coerce("EntrepriseProfileIn", k, f[k])]));
      await api("/profiles/me", "PUT", body);
      setBase(f); setTried(false); toast.success("Profil enregistré");
    } catch (x) { setE(x); toast.error(x.message); }
    setBusy(false);
  };

  if (loading) return <div className="fp"><p style={{ opacity: 0.6 }}>Chargement…</p></div>;

  return (
    <div className="fp">
      <div className="fp-card">
        <header className="fp-card-head">
          <div><h2>Profil de l'entreprise</h2><p>Ces informations sont visibles par les talents.</p></div>
          {dirty && <span className="fp-save">Modifications non enregistrées</span>}
        </header>

        <div className="fp-company-id">
          {showLogo
            ? <img src={f.logo_url} alt="Logo" onError={() => setLogoOk(false)} style={{ width: 56, height: 56, borderRadius: 16, objectFit: "cover" }} />
            : <span className="fp-logo lg">{ini}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{nom}</b>
            <small>{[f.secteur, f.localisation].filter(Boolean).join(" · ") || "Complétez votre profil"}</small>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(15,157,115,.14)", marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#0f9d73,#e3b023)", transition: "width .5s" }} />
            </div>
            <small>Profil complété à {pct} %</small>
          </div>
        </div>

        <div className="fp-body">
          <div className="fp-grid2">
            <Field label="Secteur">
              <select className="fp-input" {...inp("secteur")}>
                <option value="">Sélectionner…</option>
                {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
                {f.secteur && !SECTEURS.includes(f.secteur) && <option value={f.secteur}>{f.secteur}</option>}
              </select>
            </Field>
            <Field label="Localisation"><input className="fp-input" placeholder="Ex : Dakar" {...inp("localisation")} /></Field>
          </div>
          <Field label="Taille de l'équipe">
            <Segmented options={[...TAILLES, ...(f.taille && !TAILLES.includes(f.taille) ? [f.taille] : [])]} value={f.taille} onChange={set("taille")} />
          </Field>
          <Field label="Adresse du logo (URL)" error={E.logo_url} hint="Lien direct vers une image hébergée en ligne.">
            <input className="fp-input" placeholder="https://…" {...inp("logo_url")} />
          </Field>
          <Field label="Description" right={String(f.description ?? "").length + " caractères"}>
            <textarea className="fp-input" rows={4} placeholder="Que fait votre entreprise ?" {...inp("description")} />
          </Field>
          <Field label="Culture d'entreprise" right={String(f.culture ?? "").length + " caractères"}>
            <textarea className="fp-input" rows={3} placeholder="Valeurs, manière de travailler…" {...inp("culture")} />
          </Field>
          <Err e={e} />
        </div>

        <footer className="fp-actions">
          <button className="fp-btn" disabled={!dirty || busy} onClick={() => { setF(base); setTried(false); }}>Annuler</button>
          <button className="fp-btn solid" disabled={!dirty || busy} onClick={save}>
            {busy ? <Loader2 size={16} className="spin" /> : <Save size={16} />}Enregistrer
          </button>
        </footer>
      </div>
    </div>
  );
}