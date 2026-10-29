/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Search, Send } from "lucide-react";
import { api, list } from "../api";
import { useAuth } from "../auth";
import { Async, Page, useLoad } from "../ui";

const toDate = (d?: string) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");
const hm = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const dayLabel = (d: Date) => {
  const now = new Date(), y = new Date(); y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return "Aujourd'hui";
  if (sameDay(d, y)) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
const initials = (s?: string) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Messages() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const c = sp.get("c") || "";
  const [txt, setTxt] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const convs = useLoad(() => list("/messages"), [], 20000);
  // Lire un fil le marque comme lu côté serveur : on recharge la liste pour mettre à jour les compteurs.
  const th = useLoad(
    () => (c ? list(`/messages/${c}`).then((r) => { convs.reload(); return r; }) : Promise.resolve([] as any[])),
    [c],
    10000
  );
  const n = th.data?.length ?? 0;
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [n, c]);
  const cur = (convs.data || []).find((x: any) => x.candidature_id === c);
  const send = async (ev?: FormEvent) => {
    ev?.preventDefault();
    if (!txt.trim() || busy) return;
    setBusy(true);
    try { await api(`/messages/${c}`, "POST", { contenu: txt }); setTxt(""); th.reload(); convs.reload(); }
    catch (x) { toast.error((x as Error).message); }
    setBusy(false);
  };
  return (
    <Page title="Messages">
      <div className={"x-chat" + (c ? " has-c" : "")}>
        <aside className="card x-convs">
          <div className="x-conv-h">
            <div className="x-search"><Search size={16} /><input placeholder="Rechercher..." value={q} onChange={(x) => setQ(x.target.value)} /></div>
          </div>
          <div className="x-convs-list">
            <Async s={convs}>{(l) => {
              const f = l.filter((x: any) => (x.interlocuteur_nom + " " + x.offre_titre).toLowerCase().includes(q.trim().toLowerCase()));
              return f.length ? f.map((x: any) => (
                <div key={x.candidature_id} className={"x-conv" + (x.candidature_id === c ? " on" : "")} onClick={() => setSp({ c: x.candidature_id })}>
                  <div className="x-av">{initials(x.interlocuteur_nom)}</div>
                  <div className="x-conv-t">
                    <strong>{x.interlocuteur_nom}</strong>
                    <small className="mut">{x.offre_titre}</small>
                    <small className="mut">{x.dernier_message}</small>
                  </div>
                  {x.non_lus > 0 && <span className="x-unread">{x.non_lus}</span>}
                </div>
              )) : <p className="mut" style={{ padding: 16 }}>Aucune conversation.</p>;
            }}</Async>
          </div>
        </aside>

        <section className="card x-thread">
          {!c ? (
            <div className="x-th-empty">
              <MessageSquare size={40} />
              <b>Tes messages</b>
              <p className="mut">Choisis une conversation, ou écris à un candidat depuis la page Candidats.</p>
            </div>
          ) : (
            <>
              <div className="x-th-h">
                <button className="x-back x-ia" onClick={() => setSp({})} aria-label="Retour"><ArrowLeft size={16} /></button>
                <div className="x-av">{initials(cur?.interlocuteur_nom)}</div>
                <div><strong>{cur?.interlocuteur_nom ?? "Conversation"}</strong><small className="mut" style={{ display: "block" }}>{cur?.offre_titre}</small></div>
              </div>
              <div className="x-msgs" ref={box}>
                <Async s={th}>{(l) => l.length ? l.map((m: any, i: number) => {
                  const d = toDate(m.created_at);
                  const newDay = i === 0 || !sameDay(d, toDate(l[i - 1].created_at));
                  return (
                    <div key={m.id} style={{ display: "contents" }}>
                      {newDay && <div className="x-day">{dayLabel(d)}</div>}
                      <div className={"x-bub" + (m.expediteur_id === user.id ? " me" : "")}>
                        <span>{m.contenu}</span>
                        <small>{hm(d)}</small>
                      </div>
                    </div>
                  );
                }) : <p className="mut" style={{ margin: "auto" }}>Aucun message. Écris le premier.</p>}</Async>
              </div>
              <form className="x-compose" onSubmit={send}>
                <textarea rows={1} required maxLength={2000} value={txt} onChange={(x) => setTxt(x.target.value)}
                  placeholder="Votre message (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
                  onKeyDown={(k) => { if (k.key === "Enter" && !k.shiftKey) { k.preventDefault(); send(); } }} />
                <button className="x-send" disabled={busy || !txt.trim()} aria-label="Envoyer"><Send size={18} /></button>
              </form>
            </>
          )}
        </section>
      </div>
    </Page>
  );
}