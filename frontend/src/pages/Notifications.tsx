/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, Check } from "lucide-react";
import { api, list } from "../api";
import { Async, Page, useLoad } from "../ui";

const toDate = (d?: string) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return j < 7 ? `il y a ${j} j` : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export default function Notifications() {
  const s = useLoad(() => list("/notifications"), [], 30000);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const run = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => api(`/notifications/${id}/lue`, "PATCH")));
      toast.success(ids.length > 1 ? "Tout est marqué comme lu" : "Notification lue");
      s.reload();
      window.dispatchEvent(new Event("notifs"));
    } catch (x) { toast.error((x as Error).message); }
  };
  return (
    <Page title="Notifications">
      <Async s={s}>{(l) => {
        const nonLues = l.filter((n: any) => !n.lue);
        const shown = tab === "unread" ? nonLues : l;
        return (
          <>
            <div className="x-toolbar" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <div className="x-pills">
                <button className={"x-pill" + (tab === "all" ? " on" : "")} onClick={() => setTab("all")}>Toutes <em>{l.length}</em></button>
                <button className={"x-pill" + (tab === "unread" ? " on" : "")} onClick={() => setTab("unread")}>Non lues <em>{nonLues.length}</em></button>
              </div>
              {nonLues.length > 0 && <button className="x-ia" onClick={() => run(nonLues.map((n: any) => n.id))}><CheckCheck size={15} /> Tout marquer comme lu</button>}
            </div>
            {shown.length ? (
              <div className="x-notifs">
                {shown.map((n: any, i: number) => (
                  <div key={n.id} className={"x-notif" + (n.lue ? "" : " unread")} style={{ animationDelay: Math.min(i, 10) * 30 + "ms" }}>
                    <div className="x-notif-ico"><Bell size={17} /></div>
                    <div className="x-notif-body">
                      <div className="x-notif-top"><strong>{n.titre}</strong><small className="mut">{ago(toDate(n.created_at))}</small></div>
                      <p>{n.message}</p>
                    </div>
                    {!n.lue ? <button className="x-ia" onClick={() => run([n.id])} title="Marquer comme lue"><Check size={15} /></button> : null}
                  </div>
                ))}
              </div>
            ) : <div className="x-empty"><b>{tab === "unread" ? "Tout est à jour" : "Aucune notification"}</b><p className="mut">{tab === "unread" ? "Tu as lu toutes tes notifications." : "Les nouvelles candidatures et messages apparaîtront ici."}</p></div>}
          </>
        );
      }}</Async>
    </Page>
  );
}