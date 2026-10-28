/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

type S<T> = { key?: string; data?: T; error?: Error };
type Res<T> = { data?: T; error?: Error; loading?: boolean };

/** Charge des données. `deps` relance le chargement, `pollMs` le répète, `reload()` le force. */
export function useLoad<T = any>(fn: () => Promise<T>, deps: unknown[] = [], pollMs = 0) {
  const [s, setS] = useState<S<T>>({});
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const key = JSON.stringify(deps);
  useEffect(() => {
    let stale = false;
    fnRef.current()
      .then((data) => { if (!stale) setS({ key, data }); })
      .catch((error) => { if (!stale) setS({ key, error }); });
    return () => { stale = true; };
  }, [key, tick]);
  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(() => setTick((x) => x + 1), pollMs);
    return () => clearInterval(t);
  }, [pollMs]);
  const reload = useCallback(() => setTick((x) => x + 1), []);
  const cur: S<T> = s.key === key ? s : {};
  return { data: cur.data, error: cur.error, loading: cur.data === undefined && !cur.error, reload };
}

export const Err = ({ e }: { e?: Error | null }) =>
  e ? (
    <p className="err">
      {e.message}
      {/profil entreprise/i.test(e.message) && <> <Link to="/profil">Compléter le profil</Link></>}
    </p>
  ) : null;
export const Page = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <div><div className="ph"><h1>{title}</h1>{action}</div>{children}</div>
);
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="f"><span>{label}</span>{children}</label>
);
export const Badge = ({ v }: { v: string }) => <span className={"b b-" + v}>{String(v).replace(/_/g, " ")}</span>;

export function Async<T>({ s, children }: { s: Res<T>; children: (d: T) => ReactNode }) {
  if (s.error) return <Err e={s.error} />;
  if (s.data === undefined) return <p className="mut">Chargement...</p>;
  return <>{children(s.data)}</>;
}

const DISPO: Record<string, string> = { immediate: "Immédiate", "1_mois": "Sous 1 mois", "3_mois": "Sous 3 mois", "6_mois": "Sous 6 mois" };
export const dispoLabel = (v?: string | null) => (v ? DISPO[v] ?? v : "");

/** Le backend renvoie des dates UTC sans fuseau : on force le « Z » pour un affichage à l'heure locale. */
export const fdate = (d?: string) => {
  if (!d) return "";
  const utc = /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z";
  return new Date(utc).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
};
export const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);