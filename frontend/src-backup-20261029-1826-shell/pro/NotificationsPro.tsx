// @ts-nocheck
import { useState } from "react";
import { Bell, BellRing, CheckCheck, Check } from "lucide-react";
import { api, list } from "../api";
import { Err, fdate, useLoad } from "../ui";
import "../forms-pro/forms-pro.css";

export default function NotificationsPro() {
  const s = useLoad(() => list("/notifications"), [], 30000);
  const [e, setE] = useState(null);
  const [only, setOnly] = useState(false);
  const run = async (ids) => {
    try {
      setE(null);
      await Promise.all(ids.map((id) => api("/notifications/" + id + "/lue", "PATCH")));
      s.reload();
      window.dispatchEvent(new Event("notifs"));
    } catch (x) { setE(x); }
  };
  const l = s.data || [];
  const nonLues = l.filter((n) => !n.lue);
  const shown = only ? nonLues : l;
  return (
    <div className="fp">
      <section className="fp-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <span className="fp-hero-chip"><BellRing size={14} />Centre de notifications</span>
          <h1>Notifications</h1>
          <p>{nonLues.length ? nonLues.length + " non lue" + (nonLues.length > 1 ? "s" : "") : "Tout est à jour."}</p>
        </div>
        {nonLues.length > 0 && <button className="fp-btn gold" style={{ margin: 0 }} onClick={() => run(nonLues.map((n) => n.id))}><CheckCheck size={16} />Tout marquer comme lu</button>}
      </section>
      <div className="fp-tabs">
        <button className={!only ? "on" : ""} onClick={() => setOnly(false)}>Toutes ({l.length})</button>
        <button className={only ? "on" : ""} onClick={() => setOnly(true)}>Non lues ({nonLues.length})</button>
      </div>
      <Err e={e || s.error} />
      {s.data === undefined && !s.error && <p style={{ opacity: 0.6 }}>Chargement…</p>}
      {s.data !== undefined && (shown.length ? (
        <div className="np-list">
          {shown.map((n) => (
            <div key={n.id} className={"np-item " + (n.lue ? "read" : "unread")}>
              <span className="np-ico"><Bell size={18} /></span>
              <div className="np-body"><b>{n.titre}</b>{n.message && <p>{n.message}</p>}<small>{fdate(n.created_at)}</small></div>
              {!n.lue && <button className="fp-btn np-btn" onClick={() => run([n.id])}><Check size={14} />Lu</button>}
            </div>
          ))}
        </div>
      ) : <div className="fp-card ep-empty"><b>Aucune notification</b><p>{only ? "Toutes vos notifications sont lues." : "Vous serez prévenu ici des nouvelles candidatures et messages."}</p></div>)}
    </div>
  );
}