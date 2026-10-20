/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, list } from "../api";
import { useAuth } from "../auth";
import { Async, Err, Page, fdate, useLoad } from "../ui";

export default function Messages() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const c = sp.get("c") || "";
  const [txt, setTxt] = useState("");
  const [e, setE] = useState<Error | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const convs = useLoad(() => list("/messages"), [], 20000);
  // Lire un fil le marque comme lu côté serveur : on recharge la liste pour mettre à jour les compteurs.
  const th = useLoad(
    () => (c ? list(`/messages/${c}`).then((r) => { convs.reload(); return r; }) : Promise.resolve([] as any[])),
    [c],
    10000
  );
  const n = th.data?.length ?? 0;
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [n]);
  const send = async (ev: FormEvent) => {
    ev.preventDefault(); setE(null);
    try { await api(`/messages/${c}`, "POST", { contenu: txt }); setTxt(""); th.reload(); convs.reload(); } catch (x) { setE(x as Error); }
  };
  return (
    <Page title="Messages">
      <div className="chat">
        <div className="card" style={{ padding: 0 }}>
          <Async s={convs}>{(l) => l.length ? l.map((x: any) => (
            <div key={x.candidature_id} className={"conv" + (x.candidature_id === c ? " on" : "")} onClick={() => setSp({ c: x.candidature_id })}>
              <b>{x.interlocuteur_nom}</b>{x.non_lus > 0 && <span className="b"> {x.non_lus}</span>}<br />
              <span className="mut">{x.offre_titre}</span><br /><small className="mut">{x.dernier_message}</small>
            </div>
          )) : <p className="mut" style={{ padding: 12 }}>Aucune conversation.</p>}</Async>
        </div>
        <div className="card">
          {!c ? <p className="mut">Choisis une conversation, ou écris à un candidat depuis la page Candidats.</p> : (
            <>
              <div className="msgs" ref={box}>
                <Async s={th}>{(l) => <>{l.length ? l.map((m: any) => <div key={m.id} className={"m" + (m.expediteur_id === user.id ? " me" : "")}>{m.contenu}<br /><small>{fdate(m.created_at)}</small></div>) : <p className="mut">Aucun message. Écris le premier.</p>}</>}</Async>
              </div>
              <form onSubmit={send}>
                <textarea rows={2} required maxLength={2000} value={txt} onChange={(x) => setTxt(x.target.value)} placeholder="Votre message (Ctrl+Entrée pour envoyer)"
                  onKeyDown={(k) => { if (k.key === "Enter" && (k.ctrlKey || k.metaKey)) k.currentTarget.form?.requestSubmit(); }} />
                <Err e={e} /><p><button>Envoyer</button></p>
              </form>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}