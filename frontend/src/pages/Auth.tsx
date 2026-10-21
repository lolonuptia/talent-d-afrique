import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { Err, Field } from "../ui";

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth">
      <h1 style={{ marginBottom: 16 }}>Talent d'Afrique</h1>
      <div className="card"><h2>{title}</h2>{children}</div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", pw: "" });
  const [e, setE] = useState<Error | null>(null);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try { await login(f.email, f.pw); nav("/"); } catch (x) { setE(x as Error); }
  };
  return (
    <Shell title="Connexion entreprise">
      <form onSubmit={go}>
        <Field label="Email"><input type="email" required value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
        <Field label="Mot de passe"><input type="password" required value={f.pw} onChange={(x) => setF({ ...f, pw: x.target.value })} /></Field>
        <Err e={e} />
        <p><button>Se connecter</button></p>
        <p className="mut"><Link to="/forgot-password">Mot de passe oublié ?</Link></p>
        <p className="mut">Pas de compte ? <Link to="/register">Créer un compte entreprise</Link></p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ nom: "", email: "", pw: "", ok: false });
  const [e, setE] = useState<Error | null>(null);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try { await register({ nom: f.nom, email: f.email, mot_de_passe: f.pw }); nav("/profil"); } catch (x) { setE(x as Error); }
  };
  return (
    <Shell title="Créer un compte entreprise">
      <form onSubmit={go}>
        <Field label="Nom de l'entreprise"><input required value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></Field>
        <Field label="Mot de passe (8 caractères minimum)"><input type="password" minLength={8} required value={f.pw} onChange={(x) => setF({ ...f, pw: x.target.value })} /></Field>
        <p><label><input type="checkbox" style={{ width: "auto" }} required checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} /> J'accepte les <Link to="/cgu" target="_blank" rel="noreferrer">conditions d'utilisation</Link> et la <Link to="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</Link>.</label></p>
        <Err e={e} />
        <p><button>Créer mon compte</button></p>
        <p className="mut">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [e, setE] = useState<Error | null>(null);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try { await api("/auth/forgot-password", "POST", { email }); setDone(true); } catch (x) { setE(x as Error); }
  };
  return (
    <Shell title="Mot de passe oublié">
      {done ? (
        <p className="ok">Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé (valable 1 heure). Pense à regarder les courriers indésirables.</p>
      ) : (
        <form onSubmit={go}>
          <Field label="Email du compte"><input type="email" required value={email} onChange={(x) => setEmail(x.target.value)} /></Field>
          <Err e={e} />
          <p><button>Envoyer le lien</button></p>
        </form>
      )}
      <p className="mut"><Link to="/login">Retour à la connexion</Link></p>
    </Shell>
  );
}

export function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [done, setDone] = useState(false);
  const [e, setE] = useState<Error | null>(null);
  const go = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try {
      await api("/auth/reset-password", "POST", { token, mot_de_passe: pw });
      setDone(true);
      setTimeout(() => nav("/login"), 2500);
    } catch (x) { setE(x as Error); }
  };
  return (
    <Shell title="Nouveau mot de passe">
      {!token ? <p className="err">Lien incomplet. Refais une demande depuis « Mot de passe oublié ».</p> : done ? (
        <p className="ok">Mot de passe modifié. Redirection vers la connexion...</p>
      ) : (
        <form onSubmit={go}>
          <Field label="Nouveau mot de passe (8 caractères minimum)"><input type="password" minLength={8} required value={pw} onChange={(x) => setPw(x.target.value)} /></Field>
          <Err e={e} />
          <p><button>Enregistrer</button></p>
        </form>
      )}
      <p className="mut"><Link to="/login">Retour à la connexion</Link></p>
    </Shell>
  );
}