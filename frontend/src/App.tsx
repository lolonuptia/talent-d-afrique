/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { api, list } from "./api";
import { useAuth } from "./auth";
import { useLoad } from "./ui";
import { ForgotPassword, Login, Register, ResetPassword, VerifyEmail } from "./pages/Auth";
import Overview from "./pages/Overview";
import { OffreForm, OffresList } from "./pages/Offres";
import Candidats from "./pages/Candidats";
import Entretiens from "./pages/Entretiens";
import Messages from "./pages/Messages";
import Talents from "./pages/Talents";
import Notifications from "./pages/Notifications";
import { Compte, Profil } from "./pages/Compte";
import { Cgu, Confidentialite } from "./pages/Legal";
import { AdminHome, AdminJournal, AdminOffres, AdminUsers } from "./pages/Admin";

const ADMIN_NAV: [string, string][] = [
  ["/admin", "Tableau de bord"], ["/admin/utilisateurs", "Utilisateurs"], ["/admin/offres", "Offres"],
  ["/admin/journal", "Journal"], ["/compte", "Mon compte"],
];

function VerifBanner({ user }: { user: any }) {
  const [msg, setMsg] = useState("");
  if (user.email_verifie !== false || user.is_admin) return null;
  const renvoyer = async () => {
    try { await api("/auth/resend-verification", "POST"); setMsg("Lien renvoyé : regarde ta boîte mail (et les courriers indésirables)."); }
    catch (x) { setMsg((x as Error).message); }
  };
  return (
    <p className="err">
      Confirme ton adresse email pour publier des offres et chercher des talents.{" "}
      <button className="ghost" onClick={renvoyer}>Renvoyer le lien</button> {msg}
    </p>
  );
}

function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const notifs = useLoad(
    () => (user ? list("/notifications").catch(() => [] as any[]) : Promise.resolve([] as any[])),
    [user?.id, pathname],
    30000
  );
  const { reload } = notifs;
  useEffect(() => {
    window.addEventListener("notifs", reload);
    return () => window.removeEventListener("notifs", reload);
  }, [reload]);
  if (loading) return <p style={{ padding: 24 }}>Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_admin && pathname !== "/compte" && !pathname.startsWith("/admin")) return <Navigate to="/admin" replace />;
  if (!user.is_admin && pathname.startsWith("/admin")) return <Navigate to="/" replace />;
  const unread = (notifs.data || []).filter((n: any) => !n.lue).length;
  const nav: [string, string][] = user.is_admin ? ADMIN_NAV : [
    ["/", "Vue d'ensemble"], ["/offres", "Mes offres"], ["/candidats", "Candidats"], ["/entretiens", "Entretiens"],
    ["/messages", "Messages"], ["/talents", "Talents"], ["/notifications", "Notifications"],
    ["/profil", "Profil entreprise"], ["/compte", "Mon compte"],
  ];
  return (
    <div className="app">
      <aside className="side">
        <div className="logo">Talent d'Afrique</div>
        <div className="who">{user.nom}</div>
        {nav.map(([to, l]) => (
          <NavLink key={to} to={to} end={to === "/"}>{l}{to === "/notifications" && unread > 0 && <span className="b">{unread}</span>}</NavLink>
        ))}
        <button onClick={logout}>Se déconnecter</button>
      </aside>
      <main className="main"><VerifBanner user={user} /><Outlet /></main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="auth">
      <h1 style={{ marginBottom: 16 }}>Page introuvable</h1>
      <p className="mut">Cette adresse n'existe pas.</p>
      <Link className="btn" to="/">Retour à l'accueil</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/cgu" element={<Cgu />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/offres" element={<OffresList />} />
        <Route path="/offres/nouvelle" element={<OffreForm key="new" />} />
        <Route path="/offres/:id/modifier" element={<OffreForm key="edit" />} />
        <Route path="/candidats" element={<Candidats />} />
        <Route path="/entretiens" element={<Entretiens />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/talents" element={<Talents />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/utilisateurs" element={<AdminUsers />} />
        <Route path="/admin/offres" element={<AdminOffres />} />
        <Route path="/admin/journal" element={<AdminJournal />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}