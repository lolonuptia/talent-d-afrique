import { useCallback, useEffect, useState, type ReactNode } from "react";

type S<T> = { data?: T; error?: Error; loading: boolean };

export function useLoad<T = any>(fn: () => Promise<T>, deps: any[] = []) {
  const [s, setS] = useState<S<T>>({ loading: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(() => {
    setS((p) => ({ ...p, loading: true }));
    fn().then((data) => setS({ data, loading: false })).catch((error) => setS({ error, loading: false }));
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { ...s, reload: load };
}

export const Err = ({ e }: { e?: Error | null }) => (e ? <p className="err">{e.message}</p> : null);
export const Page = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <div><div className="ph"><h1>{title}</h1>{action}</div>{children}</div>
);
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="f"><span>{label}</span>{children}</label>
);
export const Badge = ({ v }: { v: string }) => <span className={"b b-" + v}>{String(v).replace("_", " ")}</span>;

export function Async<T>({ s, children }: { s: S<T>; children: (d: T) => ReactNode }) {
  if (s.error) return <Err e={s.error} />;
  if (s.loading && s.data === undefined) return <p className="mut">Chargement...</p>;
  return <>{children(s.data as T)}</>;
}

export const fdate = (d?: string) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "");
export const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
