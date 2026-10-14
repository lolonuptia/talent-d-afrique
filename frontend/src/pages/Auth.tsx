import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
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
        <p><label><input type="checkbox" style={{ width: "auto" }} required checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} /> J'accepte les conditions d'utilisation et le traitement de mes données.</label></p>
        <Err e={e} />
        <p><button>Créer mon compte</button></p>
        <p className="mut">Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
      </form>
    </Shell>
  );
}
