/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles, Target } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Err } from "../ui";

function Shell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="x-auth">
      <aside className="x-auth-art">
        <div className="x-auth-logo"><span className="logo-mark">T</span>TIBA</div>
        <h2>Recrutez les meilleurs talents africains.</h2>
        <p>Publiez vos offres, recevez des candidatures classées et planifiez vos entretiens depuis un seul endroit.</p>
        <ul>
          <li><Target size={18} /> Candidats classés automatiquement par score</li>
          <li><Sparkles size={18} /> Recommandations de profils pertinents</li>
          <li><ShieldCheck size={18} /> Données protégées et espace sécurisé</li>
        </ul>
      </aside>
      <main className="x-auth-main">
        <div className="x-auth-card">
          <h1>{title}</h1>
          {sub && <p className="mut x-auth-sub">{sub}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

function Input({ icon, type = "text", ...p }: any) {
  const [show, setShow] = useState(false);
  const pw = type === "password";
  return (
    <div className="x-in">
      {icon}
      <input {...p} type={pw && show ? "text" : type} />
      {pw && (
        <button type="button" className="x-eye" onClick={() => setShow(!show)} tabIndex={-1} aria-label="Afficher ou masquer le mot de passe">
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
  );
}
const L = ({ t, children }: { t: string; children: ReactNode }) => <label className="f"><span>{t}</span>{children}</label>;
const Submit = ({ busy, children }: { busy: boolean; children: ReactNode }) => (
  <button className="x-submit" disabled={busy}>{busy && <Loader2 size={18} className="spin" />}{children}</button>
);

const strength = (p: string) => [p.length >= 8, /[A-Z]/.test(p) && /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
const SL = ["Trop court", "Faible", "Moyen", "Bon", "Excellent"];
const SC = ["#ef4444", "#ef4444", "#f59e0b", "#14a07a", "#10b981"];

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", pw: "" });
  const [e, setE] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setBusy(true);
    try { await login(f.email, f.pw); nav("/"); } catch (x) { setE(x as Error); setBusy(false); }
  };
  return (
    <Shell title="Bon retour 👋" sub="Connecte-toi à ton espace entreprise.">
      <form onSubmit={go}>
        <L t="Email"><Input icon={<Mail size={17} />} type="email" required autoComplete="email" placeholder="contact@entreprise.com" value={f.email} onChange={(x: any) => setF({ ...f, email: x.target.value })} /></L>
        <L t="Mot de passe"><Input icon={<Lock size={17} />} type="password" required autoComplete="current-password" placeholder="••••••••" value={f.pw} onChange={(x: any) => setF({ ...f, pw: x.target.value })} /></L>
        <div className="x-auth-row"><Link to="/forgot-password">Mot de passe oublié ?</Link></div>
        <Err e={e} />
        <Submit busy={busy}>Se connecter</Submit>
        <p className="mut x-auth-foot">Pas de compte ? <Link to="/register">Créer un compte entreprise</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nom: "", email: "", pw: "", ok: false });
  const [e, setE] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const sc = strength(f.pw);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setBusy(true);
    try { await register({ nom: f.nom, email: f.email, mot_de_passe: f.pw }); nav("/profil"); } catch (x) { setE(x as Error); setBusy(false); }
  };
  return (
    <Shell title="Créer un compte entreprise" sub="Gratuit, prêt en moins d'une minute.">
      <form onSubmit={go}>
        <L t="Nom de l'entreprise"><Input icon={<Building2 size={17} />} required placeholder="Ma Société SARL" value={f.nom} onChange={(x: any) => setF({ ...f, nom: x.target.value })} /></L>
        <L t="Email"><Input icon={<Mail size={17} />} type="email" required autoComplete="email" placeholder="contact@entreprise.com" value={f.email} onChange={(x: any) => setF({ ...f, email: x.target.value })} /></L>
        <L t="Mot de passe (8 caractères minimum)">
          <Input icon={<Lock size={17} />} type="password" minLength={8} required autoComplete="new-password" placeholder="••••••••" value={f.pw} onChange={(x: any) => setF({ ...f, pw: x.target.value })} />
          {f.pw && (
            <>
              <div className="x-str" style={{ ["--c" as any]: SC[sc] }}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= sc ? "on" : ""} />)}</div>
              <small className="x-str-l" style={{ color: SC[sc] }}>{SL[sc]}</small>
            </>
          )}
        </L>
        <label className="x-check">
          <input type="checkbox" required checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} />
          <span>J'accepte les <Link to="/cgu" target="_blank" rel="noreferrer">conditions d'utilisation</Link> et la <Link to="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</Link>.</span>
        </label>
        <Err e={e} />
        <Submit busy={busy}>Créer mon compte</Submit>
        <p className="mut x-auth-foot">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<Error | null>(null);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setBusy(true);
    try { await api("/auth/forgot-password", "POST", { email }); setDone(true); } catch (x) { setE(x as Error); }
    setBusy(false);
  };
  return (
    <Shell title="Mot de passe oublié" sub="Nous t'envoyons un lien de réinitialisation.">
      {done ? (
        <p className="ok">Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé (valable 1 heure). Pense à regarder les courriers indésirables.</p>
      ) : (
        <form onSubmit={go}>
          <L t="Email du compte"><Input icon={<Mail size={17} />} type="email" required placeholder="contact@entreprise.com" value={email} onChange={(x: any) => setEmail(x.target.value)} /></L>
          <Err e={e} />
          <Submit busy={busy}>Envoyer le lien</Submit>
        </form>
      )}
      <p className="mut x-auth-foot"><Link to="/login">← Retour à la connexion</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [e, setE] = useState<Error | null>(null);
  const sc = strength(pw);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null); setBusy(true);
    try {
      await api("/auth/reset-password", "POST", { token, mot_de_passe: pw });
      setDone(true);
      setTimeout(() => nav("/login"), 2500);
    } catch (x) { setE(x as Error); }
    setBusy(false);
  };
  return (
    <Shell title="Nouveau mot de passe">
      {!token ? <p className="err">Lien incomplet. Refais une demande depuis « Mot de passe oublié ».</p> : done ? (
        <p className="ok">Mot de passe modifié. Redirection vers la connexion...</p>
      ) : (
        <form onSubmit={go}>
          <L t="Nouveau mot de passe (8 caractères minimum)">
            <Input icon={<Lock size={17} />} type="password" minLength={8} required autoComplete="new-password" placeholder="••••••••" value={pw} onChange={(x: any) => setPw(x.target.value)} />
            {pw && (
              <>
                <div className="x-str" style={{ ["--c" as any]: SC[sc] }}>{[1, 2, 3, 4].map((i) => <i key={i} className={i <= sc ? "on" : ""} />)}</div>
                <small className="x-str-l" style={{ color: SC[sc] }}>{SL[sc]}</small>
              </>
            )}
          </L>
          <Err e={e} />
          <Submit busy={busy}>Enregistrer</Submit>
        </form>
      )}
      <p className="mut x-auth-foot"><Link to="/login">← Retour à la connexion</Link></p>
    </Shell>
  );
}

export function VerifyEmail() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const [etat, setEtat] = useState<"attente" | "ok" | "erreur">(token ? "attente" : "erreur");
  const [e, setE] = useState<Error | null>(null);
  useEffect(() => {
    if (!token) return;
    api("/auth/verify-email", "POST", { token })
      .then(() => setEtat("ok"))
      .catch((x) => { setE(x as Error); setEtat("erreur"); });
  }, [token]);
  return (
    <Shell title="Confirmation de l'email">
      {etat === "attente" && <p className="mut"><Loader2 size={16} className="spin" style={{ verticalAlign: "middle" }} /> Vérification en cours...</p>}
      {etat === "ok" && <p className="ok">Adresse email confirmée. <a href="/">Accéder au dashboard</a></p>}
      {etat === "erreur" && <><Err e={e} />{!e && <p className="err">Lien incomplet.</p>}<p className="mut">Connecte-toi : le dashboard te permet de demander un nouveau lien.</p></>}
      <p className="mut x-auth-foot"><Link to="/login">Connexion</Link></p>
    </Shell>
  );
}