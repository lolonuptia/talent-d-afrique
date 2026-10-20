/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { NavLink, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { list } from "./api";
import { useAuth } from "./auth";
import { useLoad } from "./ui";
import { ForgotPassword, Login, Register, ResetPassword } from "./pages/Auth";
import Overview from "./pages/Overview";
import { OffreForm, OffresList } from "./pages/Offres";
import Candidats from "./pages/Candidats";
import Entretiens from "./pages/Entretiens";
import Messages from "./pages/Messages";
import Talents from "./pages/Talents";
import Notifications from "./pages/Notifications";
import { Compte, Profil } from "./pages/Compte";

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
  const unread = (notifs.data || []).filter((n: any) => !n.lue).length;
  const nav: [string, string][] = [
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
      <main className="main"><Outlet /></main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}