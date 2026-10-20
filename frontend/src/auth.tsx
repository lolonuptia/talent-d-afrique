/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearTokens, enumOf, setTokens } from "./api";

const Ctx = createContext<any>(null);
export const useAuth = () => useContext(Ctx);

const norm = (s: any) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const typeEntreprise = () => enumOf("UserCreate", "type_profil", ["entreprise"]).find((v) => norm(v) === "entreprise") ?? "entreprise";

function check(u: any) {
  if (norm(u?.type_profil) === "entreprise") return;
  clearTokens();
  throw new Error(norm(u?.type_profil) === "etudiant"
    ? "Les étudiants utilisent l'application mobile Talent d'Afrique."
    : "Cet espace web est pour l'instant réservé aux entreprises.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem("access"));

  useEffect(() => {
    if (!localStorage.getItem("access")) return;
    api("/auth/me")
      .then((u) => { check(u); setUser(u); })
      .catch((x) => { if (x?.status === 401 || x?.status === 403) clearTokens(); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener("session-expired", h);
    return () => window.removeEventListener("session-expired", h);
  }, []);

  const login = async (email: string, mot_de_passe: string) => {
    const t = await api("/auth/login", "POST", { email, mot_de_passe });
    setTokens(t.access_token, t.refresh_token);
    check(t.user);
    setUser(t.user);
  };
  const register = async (b: { nom: string; email: string; mot_de_passe: string }) => {
    await api("/auth/register", "POST", { ...b, type_profil: typeEntreprise(), consentement: true, consent_version: "1.0" });
    await login(b.email, b.mot_de_passe);
  };
  const logout = async () => {
    try { await api("/auth/logout", "POST", { refresh_token: localStorage.getItem("refresh") }); } catch { /* ignore */ }
    clearTokens(); setUser(null);
  };
  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}