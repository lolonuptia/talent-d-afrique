/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { api, list } from "../api";
import { Async, Err, Page, fdate, useLoad } from "../ui";

export default function Notifications() {
  const s = useLoad(() => list("/notifications"), [], 30000);
  const [e, setE] = useState<Error | null>(null);
  const run = async (ids: string[]) => {
    try {
      setE(null);
      await Promise.all(ids.map((id) => api(`/notifications/${id}/lue`, "PATCH")));
      s.reload();
      window.dispatchEvent(new Event("notifs"));
    } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Notifications">
      <div className="card">
        <Err e={e} />
        <Async s={s}>{(l) => {
          const nonLues = l.filter((n: any) => !n.lue).map((n: any) => n.id);
          return l.length ? (
            <>
              {nonLues.length > 0 && <p><button className="ghost" onClick={() => run(nonLues)}>Tout marquer comme lu ({nonLues.length})</button></p>}
              {l.map((n: any) => (
                <div key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", opacity: n.lue ? 0.6 : 1 }}>
                  <b>{n.titre}</b> <small className="mut">{fdate(n.created_at)}</small>
                  <div>{n.message}</div>
                  {!n.lue && <button className="ghost" onClick={() => run([n.id])}>Marquer comme lue</button>}
                </div>
              ))}
            </>
          ) : <p className="mut">Aucune notification.</p>;
        }}</Async>
      </div>
    </Page>
  );
}