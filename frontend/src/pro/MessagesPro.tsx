// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Send, Loader2, MessageSquare } from "lucide-react";
import { api, list } from "../api";
import { useAuth } from "../auth";
import { Err, fdate, useLoad } from "../ui";
import "../forms-pro/forms-pro.css";

const ini = (s) => (s || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function MessagesPro() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const c = sp.get("c") || "";
  const [txt, setTxt] = useState("");
  const [q, setQ] = useState("");
  const [e, setE] = useState(null);
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  const convs = useLoad(() => list("/messages"), [], 20000);
  // Lire un fil le marque comme lu côté serveur : on recharge la liste pour mettre à jour les compteurs.
  const th = useLoad(() => (c ? list("/messages/" + c).then((r) => { convs.reload(); return r; }) : Promise.resolve([])), [c], 10000);
  const n = th.data?.length ?? 0;
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [n, c]);

  const all = convs.data || [];
  const filtered = all.filter((x) => ((x.interlocuteur_nom || "") + " " + (x.offre_titre || "")).toLowerCase().includes(q.trim().toLowerCase()));
  const cur = all.find((x) => x.candidature_id === c);

  const send = async () => {
    if (!txt.trim()) return;
    setE(null); setBusy(true);
    try { await api("/messages/" + c, "POST", { contenu: txt.trim() }); setTxt(""); th.reload(); convs.reload(); }
    catch (x) { setE(x); }
    setBusy(false);
  };

  return (
    <div className="fp">
      <div className={"mp" + (c ? " has-c" : "")}>
        <aside className="mp-list fp-card">
          <div className="mp-search"><Search size={16} /><input placeholder="Rechercher une conversation…" value={q} onChange={(x) => setQ(x.target.value)} /></div>
          <div className="mp-convs">
            {convs.error && <Err e={convs.error} />}
            {convs.data === undefined && !convs.error && <p style={{ padding: 14, opacity: 0.6 }}>Chargement…</p>}
            {convs.data !== undefined && !filtered.length && <p style={{ padding: 14, opacity: 0.6, margin: 0 }}>Aucune conversation.</p>}
            {filtered.map((x) => (
              <button key={x.candidature_id} className={"mp-conv" + (x.candidature_id === c ? " on" : "")} onClick={() => setSp({ c: x.candidature_id })}>
                <span className="mp-ava">{ini(x.interlocuteur_nom)}</span>
                <span className="mp-ctx">
                  <b>{x.interlocuteur_nom}</b>
                  <em>{x.offre_titre}</em>
                  <small>{x.dernier_message}</small>
                </span>
                {x.non_lus > 0 && <span className="mp-badge">{x.non_lus}</span>}
              </button>
            ))}
          </div>
        </aside>

        <section className="mp-thread fp-card">
          {!c ? (
            <div className="mp-empty"><MessageSquare size={34} /><b>Vos messages</b><p>Choisissez une conversation, ou écrivez à un candidat depuis la page Candidats.</p></div>
          ) : (
            <>
              <header className="mp-head">
                <button className="mp-back" onClick={() => setSp({})} aria-label="Retour"><ArrowLeft size={18} /></button>
                <span className="mp-ava">{ini(cur?.interlocuteur_nom)}</span>
                <div><b>{cur?.interlocuteur_nom || "Conversation"}</b><small>{cur?.offre_titre}</small></div>
              </header>
              <div className="mp-msgs" ref={box}>
                {th.data === undefined && !th.error && <p style={{ opacity: 0.6 }}>Chargement…</p>}
                <Err e={th.error} />
                {th.data && !th.data.length && <p className="mp-none">Aucun message. Écrivez le premier.</p>}
                {(th.data || []).map((m) => (
                  <div key={m.id} className={"mp-bub" + (m.expediteur_id === user.id ? " me" : "")}>{m.contenu}<small>{fdate(m.created_at)}</small></div>
                ))}
              </div>
              <div className="mp-compose">
                <textarea className="fp-input" rows={2} maxLength={2000} value={txt} onChange={(x) => setTxt(x.target.value)} placeholder="Votre message (Ctrl+Entrée pour envoyer)"
                  onKeyDown={(k) => { if (k.key === "Enter" && (k.ctrlKey || k.metaKey)) { k.preventDefault(); send(); } }} />
                <button className="fp-btn solid" style={{ margin: 0 }} disabled={busy || !txt.trim()} onClick={send} aria-label="Envoyer">{busy ? <Loader2 size={16} className="spin" /> : <Send size={16} />}</button>
              </div>
              <Err e={e} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}