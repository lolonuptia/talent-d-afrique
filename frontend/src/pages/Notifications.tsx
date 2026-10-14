import { api, list } from "../api";
import { Async, Page, fdate, useLoad } from "../ui";

export default function Notifications() {
  const s = useLoad(() => list("/notifications"));
  const read = async (id: string) => { await api(`/notifications/${id}/lue`, "PATCH"); s.reload(); };
  return (
    <Page title="Notifications">
      <div className="card">
        <Async s={s}>{(l) => l.length ? l.map((n) => (
          <div key={n.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", opacity: n.lue ? 0.6 : 1 }}>
            <b>{n.titre}</b> <small className="mut">{fdate(n.created_at)}</small>
            <div>{n.message}</div>
            {!n.lue && <button className="ghost" onClick={() => read(n.id)}>Marquer comme lue</button>}
          </div>
        )) : <p className="mut">Aucune notification.</p>}</Async>
      </div>
    </Page>
  );
}
