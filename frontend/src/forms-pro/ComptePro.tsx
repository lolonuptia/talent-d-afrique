// @ts-nocheck
import { useState } from "react";
import { toast } from "sonner";
import { Save, Loader2, User, ShieldCheck, Database, Download, Trash2, Eye, EyeOff, AlertTriangle, BadgeCheck } from "lucide-react";
import { api, setTokens } from "../api";
import { useAuth } from "../auth";
import { Err } from "../ui";
import { Field } from "./FormsPro";
import { normPhone } from "../whatsapp/wa";
import "./forms-pro.css";

const strength = (p) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const SL = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"];
const SC = ["#ef4444", "#ef4444", "#f59e0b", "#14a07a", "#10b981"];

function PwInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="fp-pw">
      <input className="fp-input" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(!show)} tabIndex={-1} aria-label="Afficher ou masquer">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
    </div>
  );
}

export default function ComptePro() {
  const { user, setUser, logout } = useAuth();
  const [tab, setTab] = useState("info");

  // ---- infos
  const [f, setF] = useState({ nom: user.nom || "", email: user.email || "", telephone: user.telephone || "", telephone_partage: !!user.telephone_partage });
  const [mdpActuel, setMdpActuel] = useState("");
  const [triedInfo, setTriedInfo] = useState(false);
  const [busyInfo, setBusyInfo] = useState(false);
  const [eInfo, setEInfo] = useState(null);
  const emailChanged = f.email !== user.email;
  const dirty = f.nom !== user.nom || emailChanged || (f.telephone || "") !== (user.telephone || "") || !!f.telephone_partage !== !!user.telephone_partage;
  const errInfo = {};
  if (f.nom.trim().length < 2) errInfo.nom = "Le nom doit contenir au moins 2 caractères.";
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errInfo.email = "Adresse email invalide.";
  if (f.telephone && !normPhone(f.telephone)) errInfo.telephone = "Numéro invalide (ex : 77 123 45 67 ou +221 77 123 45 67).";
  if (emailChanged && !mdpActuel) errInfo.mdp = "Requis pour confirmer le changement d'email.";
  const EI = triedInfo ? errInfo : {};

  const saveInfo = async () => {
    setTriedInfo(true); setEInfo(null);
    if (Object.keys(errInfo).length) return;
    setBusyInfo(true);
    try {
      const body = { ...f, telephone: f.telephone ? "+" + normPhone(f.telephone) : "" };
      const u = await api("/users/me", "PATCH", emailChanged ? { ...body, mot_de_passe_actuel: mdpActuel } : body);
      setF({ nom: u.nom, email: u.email, telephone: u.telephone || "", telephone_partage: !!u.telephone_partage });
      setUser(u); setMdpActuel(""); setTriedInfo(false); toast.success("Informations mises à jour");
    } catch (x) { setEInfo(x); toast.error(x.message); }
    setBusyInfo(false);
  };

  // ---- mot de passe
  const [pw, setPw] = useState({ ancien: "", nouveau: "", conf: "" });
  const [triedPw, setTriedPw] = useState(false);
  const [busyPw, setBusyPw] = useState(false);
  const [ePw, setEPw] = useState(null);
  const sc = strength(pw.nouveau);
  const errPw = {};
  if (!pw.ancien) errPw.ancien = "Saisissez votre mot de passe actuel.";
  if (pw.nouveau.length < 8) errPw.nouveau = "8 caractères minimum.";
  if (pw.conf !== pw.nouveau) errPw.conf = "Les deux mots de passe ne correspondent pas.";
  const EP = triedPw ? errPw : {};

  const savePw = async () => {
    setTriedPw(true); setEPw(null);
    if (Object.keys(errPw).length) return;
    setBusyPw(true);
    try {
      const t = await api("/auth/change-password", "POST", { ancien_mot_de_passe: pw.ancien, nouveau_mot_de_passe: pw.nouveau });
      if (t?.access_token) setTokens(t.access_token, t.refresh_token);
      setPw({ ancien: "", nouveau: "", conf: "" }); setTriedPw(false); toast.success("Mot de passe modifié");
    } catch (x) { setEPw(x); toast.error(x.message); }
    setBusyPw(false);
  };

  // ---- données
  const [conf, setConf] = useState("");
  const [eExp, setEExp] = useState(null);
  const [eDel, setEDel] = useState(null);
  const exp = async () => {
    try {
      setEExp(null);
      const d = await api("/users/me/export");
      const a = document.createElement("a");
      const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }));
      a.href = url; a.download = "mes-donnees-talent-afrique.json"; a.click();
      URL.revokeObjectURL(url); toast.success("Export téléchargé");
    } catch (x) { setEExp(x); }
  };
  const del = async () => {
    if (!confirm("Cette action est définitive après 30 jours. Confirmer la suppression ?")) return;
    try { setEDel(null); await api("/users/me", "DELETE"); await logout(); } catch (x) { setEDel(x); }
  };

  const ini = (user.nom || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const tabs = [["info", "Profil", User], ["secu", "Sécurité", ShieldCheck], ["data", "Données", Database]];

  return (
    <div className="fp">
      <section className="fp-hero" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span className="fp-logo lg" style={{ background: "rgba(255,255,255,.18)" }}>{ini}</span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0 }}>{user.nom}</h1>
          <p style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {user.email}
            {user.email_verifie !== false && <span className="fp-hero-chip"><BadgeCheck size={13} />Email vérifié</span>}
          </p>
        </div>
      </section>

      <div className="fp-tabs">
        {tabs.map(([k, l, I]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}><I size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />{l}</button>)}
      </div>

      {tab === "info" && (
        <div className="fp-card">
          <header className="fp-card-head">
            <div><h2>Informations</h2><p>Votre nom et votre email de connexion.</p></div>
            {dirty && <span className="fp-save">Modifications non enregistrées</span>}
          </header>
          <div className="fp-body">
            <div className="fp-grid2">
              <Field label="Nom" required error={EI.nom}><input className="fp-input" value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} /></Field>
              <Field label="Email" required error={EI.email}><input className="fp-input" type="email" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
            </div>
            <Field label="Numéro WhatsApp" error={EI.telephone} hint="Facultatif. Sans indicatif, +221 est ajouté.">
              <input className="fp-input" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" value={f.telephone || ""} onChange={(x) => setF({ ...f, telephone: x.target.value })} />
            </Field>
            {user.type_profil !== "entreprise" && !user.is_admin && (
              <label className="fp-check" style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.45 }}>
                <input type="checkbox" style={{ marginTop: 3 }} disabled={!f.telephone} checked={!!f.telephone_partage && !!f.telephone} onChange={(x) => setF({ ...f, telephone_partage: x.target.checked })} />
                <span>J'autorise les entreprises auxquelles je postule à voir mon numéro pour me contacter sur WhatsApp.</span>
              </label>
            )}
            {emailChanged && (
              <Field label="Mot de passe actuel" required error={EI.mdp} hint="Nécessaire pour changer votre adresse email.">
                <PwInput value={mdpActuel} onChange={(x) => setMdpActuel(x.target.value)} autoComplete="current-password" />
              </Field>
            )}
            <Err e={eInfo} />
          </div>
          <footer className="fp-actions">
            <button className="fp-btn" disabled={!dirty || busyInfo} onClick={() => { setF({ nom: user.nom, email: user.email, telephone: user.telephone || "", telephone_partage: !!user.telephone_partage }); setMdpActuel(""); setTriedInfo(false); }}>Annuler</button>
            <button className="fp-btn solid" disabled={!dirty || busyInfo} onClick={saveInfo}>{busyInfo ? <Loader2 size={16} className="spin" /> : <Save size={16} />}Enregistrer</button>
          </footer>
        </div>
      )}

      {tab === "secu" && (
        <div className="fp-card">
          <header className="fp-card-head"><div><h2>Mot de passe</h2><p>Choisissez un mot de passe long et unique.</p></div></header>
          <div className="fp-body">
            <Field label="Mot de passe actuel" required error={EP.ancien}><PwInput value={pw.ancien} onChange={(x) => setPw({ ...pw, ancien: x.target.value })} autoComplete="current-password" /></Field>
            <Field label="Nouveau mot de passe" required error={EP.nouveau}>
              <PwInput value={pw.nouveau} onChange={(x) => setPw({ ...pw, nouveau: x.target.value })} autoComplete="new-password" />
              {pw.nouveau && (
                <>
                  <div className="fp-str" style={{ "--c": SC[sc], marginTop: 8 }}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= sc ? "on" : ""} />)}</div>
                  <small style={{ color: SC[sc], fontWeight: 700 }}>{SL[sc]}</small>
                </>
              )}
            </Field>
            <Field label="Confirmer le nouveau mot de passe" required error={EP.conf}><PwInput value={pw.conf} onChange={(x) => setPw({ ...pw, conf: x.target.value })} autoComplete="new-password" /></Field>
            <Err e={ePw} />
          </div>
          <footer className="fp-actions">
            <button className="fp-btn solid" disabled={busyPw} onClick={savePw}>{busyPw ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={16} />}Changer le mot de passe</button>
          </footer>
        </div>
      )}

      {tab === "data" && (
        <>
          <div className="fp-card">
            <header className="fp-card-head"><div><h2>Mes données</h2><p>Téléchargez une copie de toutes les données de votre compte.</p></div></header>
            <Err e={eExp} />
            <footer className="fp-actions"><button className="fp-btn" onClick={exp}><Download size={16} />Exporter mes données</button></footer>
          </div>
          <div className="fp-card fp-danger">
            <header className="fp-card-head">
              <div><h2 style={{ color: "var(--fp-err)", display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={18} />Supprimer le compte</h2>
              <p>Le compte est désactivé immédiatement, puis les données sont effacées après 30 jours.</p></div>
            </header>
            <div className="fp-body">
              <Field label="Tapez SUPPRIMER pour confirmer"><input className="fp-input" value={conf} onChange={(x) => setConf(x.target.value)} placeholder="SUPPRIMER" /></Field>
              <Err e={eDel} />
            </div>
            <footer className="fp-actions"><button className="fp-btn danger" disabled={conf !== "SUPPRIMER"} onClick={del}><Trash2 size={16} />Supprimer mon compte</button></footer>
          </div>
        </>
      )}
    </div>
  );
}