// @ts-nocheck
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, CalendarPlus, Clock, ExternalLink, Eye, Loader2, MapPin, Phone, RotateCcw, Sparkles, Video } from "lucide-react";
import { api, C, coerce, list } from "../api";
import { Err, useLoad } from "../ui";
import { Field, Segmented } from "./FormsPro";
import "./forms-pro.css";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const MODE = { visio: "Visio", presentiel: "Présentiel", telephone: "Téléphone" };
const MICON = { visio: Video, presentiel: MapPin, telephone: Phone };
const STAT = { planifie: "Planifié", annule: "Annulé", termine: "Terminé" };
const DUREES = ["15", "30", "45", "60", "90"];
const SLOTS = Array.from({ length: 21 }, (_, i) => { const m = 480 + i * 30; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); });
const toDate = (d) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");
const ymd = (d) => d.toLocaleDateString("en-CA");
const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const PLACE = {
  visio: ["Lien de visio", "https://meet.google.com/…"],
  presentiel: ["Adresse du rendez-vous", "Ex : 12 rue Carnot, Dakar"],
  telephone: ["Numéro à appeler", "Ex : +221 77 000 00 00"],
};

export default function EntretiensPro() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ candidature_id: sp.get("cand") || "", date: sp.get("date") || "", time: "", duree: "30", mode: C.modes[0], lieu: "", message: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rep, setRep] = useState(null);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const s = useLoad(async () => {
    const [entretiens, cands] = await Promise.all([list("/entretiens"), list("/candidatures/recues")]);
    return { entretiens, cands };
  });

  const entretiens = s.data?.entretiens || [];
  const cands = s.data?.cands || [];
  const byId = useMemo(() => new Map(cands.map((c) => [c.id, c])), [cands]);
  const ouvertes = cands.filter((c) => !["refusee", "acceptee"].includes(c.statut));
  const venir = entretiens.filter((x) => x.statut === "planifie").sort((a, b) => +toDate(a.date_heure) - +toDate(b.date_heure));
  const histo = entretiens.filter((x) => x.statut !== "planifie").sort((a, b) => +toDate(b.date_heure) - +toDate(a.date_heure));
  const semaine = venir.filter((x) => +toDate(x.date_heure) - Date.now() < 7 * 864e5).length;
  const termines = entretiens.filter((x) => x.statut === "termine").length;

  const today = ymd(new Date());
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const dur = Number(f.duree);
  const busySlots = useMemo(() => {
    if (!f.date) return new Set();
    const occ = venir.filter((x) => ymd(toDate(x.date_heure)) === f.date).map((x) => {
      const d = toDate(x.date_heure); const st = d.getHours() * 60 + d.getMinutes();
      return [st, st + (Number(x.duree_minutes) || 30)];
    });
    const out = new Set();
    SLOTS.forEach((t) => {
      const a = mins(t), b = a + dur;
      if (occ.some(([x, y]) => a < y && b > x) || (f.date === today && a <= nowMin)) out.add(t);
    });
    return out;
  }, [f.date, f.duree, venir.length, today, nowMin]);

  const err = {};
  if (!f.candidature_id) err.cand = "Choisissez un candidat.";
  if (!f.date) err.date = "Choisissez une date.";
  else if (f.date < today) err.date = "La date doit être dans le futur.";
  if (!f.time) err.time = "Sélectionnez un créneau.";
  const E = tried ? err : {};
  const cand = byId.get(f.candidature_id);
  const dateLabel = f.date ? new Date(f.date + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
  const [pl, ph] = PLACE[f.mode] || PLACE.visio;
  const ModeI = MICON[f.mode] || Video;

  const submit = async () => {
    setTried(true);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await api("/entretiens", "POST", {
        candidature_id: f.candidature_id, date_heure: new Date(f.date + "T" + f.time).toISOString(),
        duree_minutes: coerce("EntretienCreate", "duree_minutes", f.duree), mode: f.mode,
        lieu_ou_lien: f.lieu || null, message: f.message || null, fuseau: TZ,
      });
      toast.success("Entretien planifié");
      setF((x) => ({ ...x, candidature_id: "", date: "", time: "", lieu: "", message: "" })); setTried(false); s.reload();
    } catch (x) { toast.error(x.message); }
    setBusy(false);
  };
  const patch = async (id, body) => {
    try { await api("/entretiens/" + id, "PATCH", body); toast.success("Entretien mis à jour"); setRep(null); s.reload(); }
    catch (x) { toast.error(x.message); }
  };

  const card = (x, past) => {
    const c = byId.get(x.candidature_id);
    const r = rep && rep.id === x.id ? rep : null;
    const d = toDate(x.date_heure);
    const lien = String(x.lieu_ou_lien || "");
    const I = MICON[x.mode] || Video;
    return (
      <div className={"ep-iv" + (past ? " past" : "")} key={x.id}>
        <div className="ep-date"><b>{d.getDate()}</b><span>{d.toLocaleDateString("fr-FR", { month: "short" })}</span></div>
        <div className="ep-body">
          <strong>{c?.candidat_nom ?? "—"}</strong>
          <small>{c?.offre_titre ?? "—"}</small>
          <div className="ep-meta">
            <span><Clock size={13} />{d.toLocaleDateString("fr-FR", { weekday: "long" })} · {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {x.duree_minutes} min</span>
            <span><I size={13} />{MODE[x.mode] ?? x.mode}</span>
            {lien && (/^https?:/i.test(lien)
              ? <a href={lien} target="_blank" rel="noreferrer"><ExternalLink size={13} />Rejoindre</a>
              : <span><MapPin size={13} />{lien}</span>)}
          </div>
        </div>
        <div className="ep-act">
          <select className="fp-input ep-status" value={x.statut} onChange={(ev) => patch(x.id, { statut: ev.target.value })}>
            {(C.statutsEntretien.includes(x.statut) ? C.statutsEntretien : [x.statut, ...C.statutsEntretien]).map((v) => <option key={v} value={v}>{STAT[v] ?? v}</option>)}
          </select>
          {x.statut === "planifie" && !r && <button className="fp-btn ep-small" onClick={() => setRep({ id: x.id, v: "" })}><RotateCcw size={14} />Reporter</button>}
        </div>
        {r && (
          <div className="ep-rep">
            <input className="fp-input" type="datetime-local" value={r.v} onChange={(ev) => setRep({ id: x.id, v: ev.target.value })} />
            <button className="fp-btn solid ep-small" disabled={!r.v} onClick={() => patch(x.id, { date_heure: new Date(r.v).toISOString(), fuseau: TZ })}>Valider</button>
            <button className="fp-btn ep-small" onClick={() => setRep(null)}>Annuler</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fp">
      <section className="fp-hero">
        <span className="fp-hero-chip"><Sparkles size={14} />Agenda recruteur</span>
        <h1>Entretiens</h1>
        <p>Planifiez en quelques clics, le candidat est prévenu automatiquement.</p>
        <div className="ep-stats">
          <div><b>{venir.length}</b> à venir</div>
          <div><b>{semaine}</b> cette semaine</div>
          <div><b>{termines}</b> terminés</div>
        </div>
      </section>

      <div className="fp-split">
        <div className="fp-card">
          <header className="fp-card-head"><div><h2>Planifier un entretien</h2><p>Les créneaux déjà occupés sont grisés.</p></div></header>
          <div className="fp-body">
            <Field label="Candidat" required error={E.cand}>
              <select className="fp-input" value={f.candidature_id} onChange={(x) => set("candidature_id")(x.target.value)}>
                <option value="">Choisir un candidat</option>
                {ouvertes.map((c) => <option key={c.id} value={c.id}>{c.candidat_nom} — {c.offre_titre}</option>)}
              </select>
            </Field>
            <Field label="Date" required error={E.date}>
              <input className="fp-input" type="date" min={today} value={f.date} onChange={(x) => { set("date")(x.target.value); set("time")(""); }} />
            </Field>
            <Field label="Durée"><Segmented options={DUREES.map((v) => ({ value: v, label: v + " min" }))} value={f.duree} onChange={(v) => { set("duree")(v); set("time")(""); }} /></Field>
            <Field label="Créneau" required error={E.time} hint={!f.date ? "Choisissez d'abord une date." : undefined}>
              <div className="fp-slots ep-slots">
                {SLOTS.map((t) => (
                  <button key={t} type="button" disabled={!f.date || busySlots.has(t)} className={f.time === t ? "on" : ""} onClick={() => set("time")(t)}>{t}</button>
                ))}
              </div>
            </Field>
            <Field label="Mode">
              <div className="fp-modes">
                {C.modes.map((m) => { const I = MICON[m] || Video; return (
                  <button key={m} type="button" className={f.mode === m ? "on" : ""} onClick={() => set("mode")(m)}><I size={16} />{MODE[m] ?? m}</button>
                ); })}
              </div>
            </Field>
            <Field label={pl}><input className="fp-input" placeholder={ph} value={f.lieu} onChange={(x) => set("lieu")(x.target.value)} /></Field>
            <Field label="Message au candidat" right={f.message.length + " / 500"}>
              <textarea className="fp-input" rows={3} maxLength={500} placeholder="Déroulé, documents à préparer…" value={f.message} onChange={(x) => set("message")(x.target.value)} />
            </Field>
            <Err e={s.error} />
          </div>
          <footer className="fp-actions">
            <button className="fp-btn solid" disabled={busy} onClick={submit}>{busy ? <Loader2 size={16} className="spin" /> : <CalendarPlus size={16} />}Planifier l'entretien</button>
          </footer>
        </div>

        <aside className="fp-preview">
          <span className="fp-prev-lab"><Eye size={14} />Invitation envoyée</span>
          <div className="fp-card fp-offer">
            <div className="fp-offer-top">
              <span className="fp-logo"><CalendarDays size={20} /></span>
              <div><b>{cand?.candidat_nom || "Nom du candidat"}</b><small>{cand?.offre_titre || "Offre concernée"}</small></div>
            </div>
            <div className="fp-chips">
              <span><Clock size={12} />{dateLabel || "Date"}{f.time ? " · " + f.time : ""}</span>
              <span>{f.duree} min</span>
              <span><ModeI size={12} />{MODE[f.mode] ?? f.mode}</span>
            </div>
            <p>{f.message || "Votre message apparaîtra ici."}</p>
            {f.lieu && <div className="fp-offer-foot"><b style={{ wordBreak: "break-all" }}>{f.lieu}</b></div>}
          </div>
        </aside>
      </div>

      {s.data === undefined && !s.error && <p style={{ opacity: 0.6 }}>Chargement…</p>}
      {s.data && (
        <>
          <div className="ep-h"><h2>À venir</h2><em>{venir.length}</em></div>
          {venir.length
            ? <div className="ep-list">{venir.map((x) => card(x, false))}</div>
            : <div className="fp-card ep-empty"><b>Aucun entretien à venir</b><p>Planifiez le premier avec le formulaire ci-dessus.</p></div>}
          {histo.length > 0 && (
            <>
              <div className="ep-h"><h2>Historique</h2><em>{histo.length}</em></div>
              <div className="ep-list">{histo.map((x) => card(x, true))}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}