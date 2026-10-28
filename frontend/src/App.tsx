/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Briefcase, Building2, CalendarDays, ChevronsLeft, ChevronsRight, LayoutDashboard, LogOut, MessageSquare, Moon, ScrollText, Search, Settings, Sun, Users, Wrench } from "lucide-react";
import { Link, NavLink, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, list } from "./api";
import { useAuth } from "./auth";
import { useLoad } from "./ui";
import { ForgotPassword, Login, Register, ResetPassword, VerifyEmail } from "./pages/Auth";
import Overview from "./pro/OverviewPro";
import { OffresList } from "./pages/Offres";
import OffreForm from "./forms-pro/OffreFormPro";
import Candidats from "./forms-pro/CandidatsPro";
import Entretiens from "./forms-pro/EntretiensPro";
import Messages from "./pro/MessagesPro";
import Talents from "./pro/TalentsPro";
import Notifications from "./pro/NotificationsPro";
import Compte from "./forms-pro/ComptePro";
import Profil from "./forms-pro/ProfilPro";
import { Cgu, Confidentialite } from "./pages/Legal";
import { AdminHome, AdminOffres, AdminUsers } from "./pages/Admin";
import { AdminJournalPlus, AdminOutils, AdminUserDetail } from "./pages/AdminPlus";
import FormsPro from "./forms-pro/FormsPro";

const ADMIN_NAV: [string, string][] = [
  ["/admin", "Tableau de bord"], ["/admin/utilisateurs", "Utilisateurs"], ["/admin/offres", "Offres"],
  ["/admin/outils", "Outils"], ["/admin/journal", "Journal"], ["/compte", "Mon compte"],
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

const ICON: Record<string, ReactNode> = {
  "/": <LayoutDashboard size={18} />, "/offres": <Briefcase size={18} />, "/candidats": <Users size={18} />,
  "/entretiens": <CalendarDays size={18} />, "/messages": <MessageSquare size={18} />, "/talents": <Search size={18} />,
  "/notifications": <Bell size={18} />, "/profil": <Building2 size={18} />, "/formulaires": <Briefcase size={18} />, "/compte": <Settings size={18} />,
  "/admin": <LayoutDashboard size={18} />, "/admin/utilisateurs": <Users size={18} />, "/admin/offres": <Briefcase size={18} />,
  "/admin/outils": <Wrench size={18} />, "/admin/journal": <ScrollText size={18} />,
};

function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const go = useNavigate();
  const [mini, setMini] = useState(() => localStorage.getItem("mini") === "1");
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
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
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => { localStorage.setItem("mini", mini ? "1" : "0"); }, [mini]);
  useEffect(() => { setMenu(false); setQ(""); }, [pathname]);

  if (loading) return <p style={{ padding: 24 }}>Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_admin && pathname !== "/compte" && !pathname.startsWith("/admin")) return <Navigate to="/admin" replace />;
  if (!user.is_admin && pathname.startsWith("/admin")) return <Navigate to="/" replace />;
  const unread = (notifs.data || []).filter((n: any) => !n.lue).length;
  const nav: [string, string][] = user.is_admin ? ADMIN_NAV : [
    ["/", "Vue d'ensemble"], ["/offres", "Mes offres"], ["/candidats", "Candidats"], ["/entretiens", "Entretiens"],
    ["/messages", "Messages"], ["/talents", "Talents"], ["/notifications", "Notifications"],
    ["/profil", "Profil entreprise"], ["/formulaires", "Formulaires"], ["/compte", "Mon compte"],
  ];
  const current = nav.find(([to]) => (to === "/" ? pathname === "/" : pathname.startsWith(to)))?.[1] ?? "";
  const matches = q.trim() ? nav.filter(([, l]) => l.toLowerCase().includes(q.trim().toLowerCase())) : [];
  const ini = (user.nom || "?").split(" ").filter(Boolean).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className={"app" + (mini ? " mini" : "")}>
      <aside className="side">
        <div className="side-top">
          <div className="logo"><span className="logo-mark">T</span><span className="nl">Talent d'Afrique</span></div>
          <button className="side-toggle" onClick={() => setMini(!mini)} title="Réduire / agrandir le menu">{mini ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}</button>
        </div>
        <div className="who nl">{user.nom}</div>
        {nav.map(([to, l]) => (
          <NavLink key={to} to={to} end={to === "/"} title={l}>
            <span className="ni">{ICON[to] ?? "•"}</span>
            <span className="nl">{l}</span>
            {to === "/notifications" && unread > 0 && <span className="b nb">{unread}</span>}
          </NavLink>
        ))}
        <button className="side-out" onClick={logout} title="Se déconnecter"><span className="ni"><LogOut size={18} /></span><span className="nl">Se déconnecter</span></button>
      </aside>
      <div className="shell">
        <header className="topbar">
          <div className="crumb"><span>Talent d'Afrique</span><i>/</i><b>{current}</b></div>
          <div className="tsearch">
            <input
              placeholder="Aller à… (offres, candidats, messages)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) go(matches[0][0]); if (e.key === "Escape") setQ(""); }}
            />
            {matches.length > 0 && (
              <div className="tsearch-res">
                {matches.map(([to, l]) => <Link key={to} to={to}><span>{ICON[to]}</span>{l}</Link>)}
              </div>
            )}
          </div>
          <div className="tright">
            <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Changer de thème">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
            {!user.is_admin && (
              <Link className="icon-btn bell" to="/notifications" title="Notifications"><Bell size={18} />{unread > 0 && <em>{unread > 9 ? "9+" : unread}</em>}</Link>
            )}
            <div className="profile">
              <button className="avatar" onClick={() => setMenu(!menu)} title={user.nom}>{ini}</button>
              {menu && (
                <>
                  <div className="overlay" onClick={() => setMenu(false)} />
                  <div className="menu">
                    <div className="menu-h"><strong>{user.nom}</strong><small>{user.email}</small></div>
                    {!user.is_admin && <Link to="/profil"><Building2 size={16} /> Profil entreprise</Link>}
                    <Link to="/compte"><Settings size={16} /> Mon compte</Link>
                    <button onClick={logout}><LogOut size={16} /> Se déconnecter</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="main"><VerifBanner user={user} /><Outlet /></main>
      </div>
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
        <Route path="/formulaires" element={<FormsPro />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/utilisateurs" element={<AdminUsers />} />
        <Route path="/admin/offres" element={<AdminOffres />} />
        <Route path="/admin/utilisateurs/:id" element={<AdminUserDetail />} />
        <Route path="/admin/outils" element={<AdminOutils />} />
        <Route path="/admin/journal" element={<AdminJournalPlus />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}