/* eslint-disable react-refresh/only-export-components, @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type ReactNode } from "react";

type S<T> = { data?: T; error?: Error; loading: boolean };

export function useLoad<T = any>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [s, setS] = useState<S<T>>({ loading: true });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const key = JSON.stringify(deps);
  useEffect(() => {
    let stale = false;
    Promise.resolve().then(() => { if (!stale) setS((p) => ({ ...p, loading: true })); });
    fnRef.current()
      .then((data) => { if (!stale) setS({ data, loading: false }); })
      .catch((error) => { if (!stale) setS({ error, loading: false }); });
    return () => { stale = true; };
  }, [key, tick]);
  return { ...s, reload: () => setTick((t) => t + 1) };
}
export const Err = ({ e }: { e?: Error | null }) => (e ? <p className="err">{e.message}</p> : null);
export const Page = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <div><div className="ph"><h1>{title}</h1>{action}</div>{children}</div>
);
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="f"><span>{label}</span>{children}</label>
);
export const Badge = ({ v }: { v: string }) => <span className={"b b-" + v}>{String(v).replaceAll("_", " ")}</span>;

export function Async<T>({ s, children }: { s: S<T>; children: (d: T) => ReactNode }) {
  if (s.error) return <Err e={s.error} />;
  if (s.loading && s.data === undefined) return <p className="mut">Chargement...</p>;
  return <>{children(s.data as T)}</>;
}

export const fdate = (d?: string) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "");
export const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
