// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Building2, CalendarCheck, Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Mail, MailCheck, Moon, ShieldCheck, Sparkles, Sun, Target, XCircle } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Err } from "../ui"; import { useTranslation, Trans } from "react-i18next"; import LanguageSwitcher from "../components/LanguageSwitcher";

const strength = (p) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const SL = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"];
const SC = ["#ef4444", "#ef4444", "#f59e0b", "#2f7be5", "#10b981"];
const FEATS = [
  [Target, "Classement par score", "Les candidats sont triés automatiquement selon votre offre."],
  [CalendarCheck, "Entretiens en un clic", "Planification par créneaux, le candidat est prévenu automatiquement."],
  [ShieldCheck, "Espace sécurisé", "Vos données et celles des candidats sont protégées."],
];

function ThemeBtn() { const { t: tr } = useTranslation();
  const [t, setT] = useState(() => document.documentElement.dataset.theme || "light");
  const flip = () => {
    const n = t === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem("theme", n); } catch {}
    setT(n);
  };
  return <button type="button" className="sp-theme" onClick={flip} aria-label={tr("Changer de thème")} title={tr("Changer de thème")}>{t === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>;
}

function Shell({ title, sub, children }) { const { t: tr } = useTranslation();
  return (
    <div className="sp-auth">
      <aside className="sp-art">
        <div className="sp-blob b1" /><div className="sp-blob b2" />
        <Link to="/login" className="sp-logo"><img src="/logo-mark.png" alt="TIBA" className="tiba-logo" />TIBA</Link>
        <div className="sp-art-body">
          <span className="sp-pill"><Sparkles size={14} />{tr("Espace recruteur")}</span>
          <h2>{tr("Recrutez les meilleurs talents africains.")}</h2>
          <p>{tr("Publiez vos offres, recevez des candidatures classées et planifiez vos entretiens depuis un seul endroit.")}</p>
          <ul className="sp-feats">
            {FEATS.map(([I, t, d]) => <li key={t}><span><I size={19} /></span><div><b>{tr(t)}</b><small>{tr(d)}</small></div></li>)}
          </ul>
          <div className="sp-demo" aria-hidden="true">
            <span className="sp-demo-t">{tr("Exemple de classement")}</span>
            {[["Développeur React", 92], ["Data analyst", 84], ["Designer produit", 71]].map(([n, v]) => (
              <div key={n}><em>{tr(n)}</em><i><b style={{ width: v + "%" }} /></i><strong>{v}</strong></div>
            ))}
          </div>
        </div>
        <small className="sp-art-foot">© TIBA · <Link to="/cgu" target="_blank">{tr("Conditions")}</Link> · <Link to="/confidentialite" target="_blank">{tr("Confidentialité")}</Link></small>
      </aside>
      <main className="sp-main">
        <div style={{ position: "fixed", top: 16, right: 64, zIndex: 5 }}><LanguageSwitcher /></div><ThemeBtn />
        <div className="sp-card">
          <h1>{title}</h1>
          {sub && <p className="sp-sub">{sub}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

function Field({ label, icon: I, children }) { const { t: tr } = useTranslation();
  return <label className="sp-f"><span>{tr(label)}</span><div className="sp-in"><I size={17} />{children}</div></label>;
}

function PwField({ label, value, onChange, autoComplete, minLength, children }) { const { t: tr } = useTranslation();
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  return (
    <label className="sp-f">
      <span>{tr(label)}</span>
      <div className="sp-in">
        <Lock size={17} />
        <input type={show ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete} placeholder="••••••••" value={value} onChange={onChange}
          onKeyUp={(e) => setCaps(!!(e.getModifierState && e.getModifierState("CapsLock")))} onBlur={() => setCaps(false)} />
        <button type="button" className="sp-eye" onClick={() => setShow(!show)} tabIndex={-1} aria-label={tr("Afficher ou masquer le mot de passe")}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button>
      </div>
      {caps && <small className="sp-caps"><AlertTriangle size={13} />{tr("Verrouillage des majuscules activé")}</small>}
      {children}
    </label>
  );
}

const Meter = ({ pw }) => { const { t: tr } = useTranslation();
  if (!pw) return null;
  const sc = strength(pw);
  return (
    <>
      <div className="sp-str" style={{ "--c": SC[sc] }}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= sc ? "on" : ""} />)}</div>
      <small className="sp-strl" style={{ color: SC[sc] }}>{tr(SL[sc])}</small>
    </>
  );
};

const Submit = ({ busy, children, disabled }) => (
  <button className="sp-submit" disabled={busy || disabled}>{busy && <Loader2 size={18} className="spin" />}{children}</button>
);

export function Login() { const { t: tr } = useTranslation();
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState(() => { let m = ""; try { m = localStorage.getItem("lastEmail") || ""; } catch {} return { email: m, pw: "", keep: !!m }; });
  const [e, setE] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async (ev) => {
    ev.preventDefault(); setE(null); setBusy(true);
    try {
      await login(f.email, f.pw);
      try { f.keep ? localStorage.setItem("lastEmail", f.email) : localStorage.removeItem("lastEmail"); } catch {}
      nav("/");
    } catch (x) { setE(x); setBusy(false); }
  };
  return (
    <Shell title={tr("Bon retour") + " 👋"} sub={tr("Connectez-vous à votre espace entreprise.")}>
      <form onSubmit={go}>
        <Field label="Email" icon={Mail}><input type="email" required autoComplete="email" placeholder="contact@entreprise.com" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
        <PwField label="Mot de passe" autoComplete="current-password" value={f.pw} onChange={(x) => setF({ ...f, pw: x.target.value })} />
        <div className="sp-row">
          <label className="sp-chk"><input type="checkbox" checked={f.keep} onChange={(x) => setF({ ...f, keep: x.target.checked })} />{tr("Se souvenir de mon email")}</label>
          <Link to="/forgot-password">{tr("Mot de passe oublié ?")}</Link>
        </div>
        <Err e={e} />
        <Submit busy={busy}>{tr("Se connecter")}</Submit>
        <p className="sp-foot">{tr("Pas encore de compte ?")} <Link to="/register">{tr("Créer un compte entreprise")}</Link></p>
      </form>
    </Shell>
  );
}

export function Register() { const { t: tr } = useTranslation();
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nom: "", email: "", pw: "", pw2: "", ok: false });
  const [e, setE] = useState(null);
  const [busy, setBusy] = useState(false);
  const mismatch = f.pw2 && f.pw !== f.pw2;
  const crit = [["8 caractères minimum", f.pw.length >= 8], ["Majuscule et minuscule", /[A-Z]/.test(f.pw) && /[a-z]/.test(f.pw)], ["Un chiffre", /\d/.test(f.pw)], ["Un caractère spécial", /[^A-Za-z0-9]/.test(f.pw)]];
  const go = async (ev) => {
    ev.preventDefault(); setE(null);
    if (f.pw !== f.pw2) { setE(new Error(tr("Les deux mots de passe ne correspondent pas."))); return; }
    setBusy(true);
    try { await register({ nom: f.nom, email: f.email, mot_de_passe: f.pw }); nav("/profil"); } catch (x) { setE(x); setBusy(false); }
  };
  return (
    <Shell title={tr("Créer un compte entreprise")} sub={tr("Gratuit, prêt en moins d'une minute.")}>
      <form onSubmit={go}>
        <Field label="Nom de l'entreprise" icon={Building2}><input required placeholder="Ma Société SARL" value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} /></Field>
        <Field label="Email professionnel" icon={Mail}><input type="email" required autoComplete="email" placeholder="contact@entreprise.com" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
        <PwField label="Mot de passe" minLength={8} autoComplete="new-password" value={f.pw} onChange={(x) => setF({ ...f, pw: x.target.value })}>
          <Meter pw={f.pw} />
          {f.pw && <ul className="sp-crit">{crit.map(([t, ok]) => <li key={t} className={ok ? "ok" : ""}>{ok ? <Check size={13} /> : <XCircle size={13} />}{tr(t)}</li>)}</ul>}
        </PwField>
        <PwField label="Confirmer le mot de passe" minLength={8} autoComplete="new-password" value={f.pw2} onChange={(x) => setF({ ...f, pw2: x.target.value })}>
          {mismatch && <small className="sp-bad">{tr("Les mots de passe ne correspondent pas.")}</small>}
        </PwField>
        <label className="sp-chk" style={{ margin: "4px 0 16px" }}>
          <input type="checkbox" required checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} />
          <span><Trans i18nKey="J'accepte les <0>conditions d'utilisation</0> et la <1>politique de confidentialité</1>." components={[<Link to="/cgu" target="_blank" rel="noreferrer" />, <Link to="/confidentialite" target="_blank" rel="noreferrer" />]} /></span>
        </label>
        <Err e={e} />
        <Submit busy={busy}>{tr("Créer mon compte")}</Submit>
        <p className="sp-foot">{tr("Déjà inscrit ?")} <Link to="/login">{tr("Se connecter")}</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() { const { t: tr } = useTranslation();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState(null);
  const go = async (ev) => {
    ev.preventDefault(); setE(null); setBusy(true);
    try { await api("/auth/forgot-password", "POST", { email }); setDone(true); } catch (x) { setE(x); }
    setBusy(false);
  };
  return (
    <Shell title={tr("Mot de passe oublié")} sub={tr("Nous vous envoyons un lien de réinitialisation.")}>
      {done ? (
        <div className="sp-state"><span><MailCheck size={30} /></span><h2>{tr("Vérifiez votre boîte mail")}</h2>
          <p>{tr("Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé (valable 1 heure). Pensez à regarder les courriers indésirables.")}</p></div>
      ) : (
        <form onSubmit={go}>
          <Field label="Email du compte" icon={Mail}><input type="email" required placeholder="contact@entreprise.com" value={email} onChange={(x) => setEmail(x.target.value)} /></Field>
          <Err e={e} />
          <Submit busy={busy}>{tr("Envoyer le lien")}</Submit>
        </form>
      )}
      <p className="sp-foot"><Link to="/login"><ArrowLeft size={13} style={{ verticalAlign: "-2px" }} /> {tr("Retour à la connexion")}</Link></p>
    </Shell>
  );
}

export function ResetPassword() { const { t: tr } = useTranslation();
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState(null);
  const go = async (ev) => {
    ev.preventDefault(); setE(null);
    if (pw !== pw2) { setE(new Error(tr("Les deux mots de passe ne correspondent pas."))); return; }
    setBusy(true);
    try {
      await api("/auth/reset-password", "POST", { token, mot_de_passe: pw });
      setDone(true);
      setTimeout(() => nav("/login"), 2500);
    } catch (x) { setE(x); }
    setBusy(false);
  };
  return (
    <Shell title={tr("Nouveau mot de passe")} sub={tr("Choisissez un mot de passe long et unique.")}>
      {!token ? (
        <div className="sp-state bad"><span><XCircle size={30} /></span><h2>{tr("Lien incomplet")}</h2><p>{tr("Refaites une demande depuis « Mot de passe oublié ».")}</p></div>
      ) : done ? (
        <div className="sp-state"><span><CheckCircle2 size={30} /></span><h2>{tr("Mot de passe modifié")}</h2><p>{tr("Redirection vers la connexion…")}</p></div>
      ) : (
        <form onSubmit={go}>
          <PwField label="Nouveau mot de passe" minLength={8} autoComplete="new-password" value={pw} onChange={(x) => setPw(x.target.value)}><Meter pw={pw} /></PwField>
          <PwField label="Confirmer le mot de passe" minLength={8} autoComplete="new-password" value={pw2} onChange={(x) => setPw2(x.target.value)}>
            {pw2 && pw !== pw2 && <small className="sp-bad">{tr("Les mots de passe ne correspondent pas.")}</small>}
          </PwField>
          <Err e={e} />
          <Submit busy={busy}>{tr("Enregistrer")}</Submit>
        </form>
      )}
      <p className="sp-foot"><Link to="/login"><ArrowLeft size={13} style={{ verticalAlign: "-2px" }} /> {tr("Retour à la connexion")}</Link></p>
    </Shell>
  );
}

export function VerifyEmail() { const { t: tr } = useTranslation();
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [etat, setEtat] = useState(token ? "attente" : "erreur");
  const [e, setE] = useState(null);
  useEffect(() => {
    if (!token) return;
    api("/auth/verify-email", "POST", { token }).then(() => setEtat("ok")).catch((x) => { setE(x); setEtat("erreur"); });
  }, [token]);
  return (
    <Shell title={tr("Confirmation de l'email")}>
      {etat === "attente" && <div className="sp-state"><span><Loader2 size={30} className="spin" /></span><h2>{tr("Vérification en cours…")}</h2></div>}
      {etat === "ok" && <div className="sp-state"><span><CheckCircle2 size={30} /></span><h2>{tr("Adresse email confirmée")}</h2><p>{tr("Votre compte est prêt.")}</p><Link to="/" className="sp-submit" style={{ textDecoration: "none", marginTop: 8 }}>{tr("Accéder au dashboard")}</Link></div>}
      {etat === "erreur" && <div className="sp-state bad"><span><XCircle size={30} /></span><h2>{tr("Lien invalide")}</h2>
        <p>{e ? e.message : tr("Lien incomplet.")} {tr("Connectez-vous : le dashboard vous permet de demander un nouveau lien.")}</p></div>}
      <p className="sp-foot"><Link to="/login">{tr("Connexion")}</Link></p>
    </Shell>
  );
}