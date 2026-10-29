// @ts-nocheck
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, Flag, MapPin, Phone, Plus, RotateCcw, Sparkles, Video, ClipboardList } from "lucide-react";
import { api, list } from "../api";
import { Err, useLoad } from "../ui";
import "../forms-pro/forms-pro.css";
import "./calendrier.css";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
const MODE = { visio: "Visio", presentiel: "Présentiel", telephone: "Téléphone" };
const MICON = { visio: Video, presentiel: MapPin, telephone: Phone };
const STAT = { planifie: "Planifié", termine: "Terminé", annule: "Annulé" };
const COLOR = { planifie: "#0f9d73", termine: "#3b82f6", annule: "#94a3b8", fin: "#e3b023", debut: "#a855f7" };
const WD = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const toDate = (d) => new Date(!d ? 0 : /(Z|[+-]\d\d:?\d\d)$/i.test(d) ? d : d + "Z");
const ymd = (d) => d.toLocaleDateString("en-CA");
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const hhmm = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const longDay = (d) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function CalendrierPro() {
  const nav = useNavigate();
  const [view, setView] = useState(() => localStorage.getItem("calview") || "month");
  const [cur, setCur] = useState(() => new Date());
  const [day, setDay] = useState(ymd(new Date()));
  const [showM, setShowM] = useState(true);
  const [showX, setShowX] = useState(false);
  const [rep, setRep] = useState(null);
  const s = useLoad(async () => {
    const [entretiens, cands, missions] = await Promise.all([
      list("/entretiens"), list("/candidatures/recues").catch(() => []), list("/missions").catch(() => []),
    ]);
    return { entretiens, cands, missions };
  }, [], 60000);

  const todayKey = ymd(new Date());
  const events = useMemo(() => {
    if (!s.data) return [];
    const byId = new Map(s.data.cands.map((c) => [c.id, c]));
    const out = [];
    s.data.entretiens.forEach((x) => {
      if (x.statut === "annule" && !showX) return;
      const d = toDate(x.date_heure), c = byId.get(x.candidature_id);
      out.push({ key: "i" + x.id, kind: "iv", d, color: COLOR[x.statut] || COLOR.planifie, label: hhmm(d) + " " + (c?.candidat_nom || "Entretien"), raw: x, cand: c });
    });
    if (showM) s.data.missions.forEach((m) => {
      if (m.statut === "annulee") return;
      if (m.date_debut) out.push({ key: "d" + m.id, kind: "debut", d: new Date(m.date_debut + "T08:00"), color: COLOR.debut, label: "Début · " + m.titre, raw: m });
      if (m.date_fin && (m.statut === "en_cours" || m.statut === "en_pause")) out.push({ key: "f" + m.id, kind: "fin", d: new Date(m.date_fin + "T18:00"), color: COLOR.fin, label: "Fin · " + m.titre, raw: m });
    });
    return out.sort((a, b) => +a.d - +b.d);
  }, [s.data, showM, showX]);

  const byDay = useMemo(() => {
    const m = new Map();
    events.forEach((e) => { const k = ymd(e.d); if (!m.has(k)) m.set(k, []); m.get(k).push(e); });
    return m;
  }, [events]);

  const planned = events.filter((e) => e.kind === "iv" && e.raw.statut === "planifie");
  const now = new Date();
  const nToday = planned.filter((e) => ymd(e.d) === todayKey).length;
  const n7 = planned.filter((e) => e.d >= now && +e.d - +now < 7 * 864e5).length;
  const nMonth = planned.filter((e) => e.d.getMonth() === now.getMonth() && e.d.getFullYear() === now.getFullYear()).length;
  const nMis = s.data ? s.data.missions.filter((m) => m.statut === "en_cours").length : 0;

  const y = cur.getFullYear(), mo = cur.getMonth();
  const monthDays = useMemo(() => {
    const start = monday(new Date(y, mo, 1));
    const all = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    return all[35].getMonth() !== mo ? all.slice(0, 35) : all;
  }, [y, mo]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday(cur), i)), [cur]);

  const title = view === "month" ? cur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : view === "week" ? weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " – " + weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "Événements à venir";
  const step = (n) => setCur(view === "month" ? new Date(y, mo + n, 1) : addDays(cur, 7 * n));
  const toToday = () => { setCur(new Date()); setDay(todayKey); };
  const setV = (v) => { setView(v); localStorage.setItem("calview", v); };

  const patch = async (id, body) => {
    try { await api("/entretiens/" + id, "PATCH", body); toast.success("Entretien mis à jour"); setRep(null); s.reload(); }
    catch (x) { toast.error(x.message); }
  };

  const card = (e) => {
    if (e.kind !== "iv") {
      const m = e.raw, I = e.kind === "fin" ? Flag : ClipboardList;
      return (
        <div className="cal-card" key={e.key} style={{ "--c": e.color }}>
          <span className="cal-card-ico"><I size={16} /></span>
          <div className="cal-card-b">
            <b>{e.kind === "fin" ? "Fin prévue de la mission" : "Début de la mission"}</b>
            <p>{m.titre} · {m.candidat_nom}</p>
            <small>Avancement : {m.avancement} %</small>
          </div>
          <Link className="cal-a" to="/missions">Ouvrir</Link>
        </div>
      );
    }
    const x = e.raw, c = e.cand, I = MICON[x.mode] || Video, lien = String(x.lieu_ou_lien || "");
    const r = rep && rep.id === x.id ? rep : null;
    return (
      <div className="cal-card" key={e.key} style={{ "--c": e.color }}>
        <span className="cal-time"><b>{hhmm(e.d)}</b><small>{x.duree_minutes} min</small></span>
        <div className="cal-card-b">
          <b>{c?.candidat_nom || "Candidat"}</b>
          <p>{c?.offre_titre || ""}</p>
          <div className="cal-meta">
            <span><I size={13} />{MODE[x.mode] || x.mode}</span>
            {lien && (/^https?:/i.test(lien) ? <a href={lien} target="_blank" rel="noreferrer"><ExternalLink size={13} />Rejoindre</a> : <span><MapPin size={13} />{lien}</span>)}
          </div>
          <div className="cal-acts">
            <select className="fp-input" value={x.statut} onChange={(ev) => patch(x.id, { statut: ev.target.value })}>
              {Object.entries(STAT).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {x.statut === "planifie" && !r && <button className="cal-a" onClick={() => setRep({ id: x.id, v: "" })}><RotateCcw size={13} />Reporter</button>}
          </div>
          {r && (
            <div className="cal-acts">
              <input className="fp-input" type="datetime-local" value={r.v} onChange={(ev) => setRep({ id: x.id, v: ev.target.value })} />
              <button className="cal-a on" disabled={!r.v} onClick={() => patch(x.id, { date_heure: new Date(r.v).toISOString(), fuseau: TZ })}>Valider</button>
              <button className="cal-a" onClick={() => setRep(null)}>Annuler</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const dayEvents = byDay.get(day) || [];
  const dayDate = new Date(day + "T12:00");
  const dayPanel = (
    <section className="fp-card cal-day">
      <header>
        <div><h2 style={{ textTransform: "capitalize" }}>{longDay(dayDate)}</h2><p>{dayEvents.length ? dayEvents.length + " événement" + (dayEvents.length > 1 ? "s" : "") : "Rien de prévu ce jour."}</p></div>
        {day >= todayKey && <button className="fp-btn solid ep-small" style={{ margin: 0 }} onClick={() => nav("/entretiens?date=" + day)}><Plus size={15} />Planifier</button>}
      </header>
      {dayEvents.length > 0 && <div className="cal-cards">{dayEvents.map(card)}</div>}
    </section>
  );

  const chip = (e) => (
    <span className="cal-chip" key={e.key} style={{ "--c": e.color }} title={e.label}><i /><span className="txt">{e.label}</span></span>
  );

  const upcoming = events.filter((e) => ymd(e.d) >= todayKey);
  const groups = [];
  upcoming.forEach((e) => { const k = ymd(e.d); const g = groups[groups.length - 1]; if (g && g.k === k) g.list.push(e); else groups.push({ k, list: [e] }); });

  return (
    <div className="fp">
      <section className="fp-hero">
        <div className="cp-hero-top">
          <div>
            <span className="fp-hero-chip"><Sparkles size={14} />Agenda</span>
            <h1>Calendrier</h1>
            <p>Tous vos entretiens et échéances de missions, d'un seul coup d'œil.</p>
          </div>
          <button className="fp-btn gold" style={{ margin: 0 }} onClick={() => nav("/entretiens")}><Plus size={16} />Planifier un entretien</button>
        </div>
        <div className="ep-stats">
          <div><b>{nToday}</b> aujourd'hui</div>
          <div><b>{n7}</b> sous 7 jours</div>
          <div><b>{nMonth}</b> ce mois-ci</div>
          <div><b>{nMis}</b> missions en cours</div>
        </div>
      </section>

      <section className="fp-card cal-bar">
        <div className="cal-nav">
          {view !== "agenda" && <button className="cal-sq" onClick={() => step(-1)} aria-label="Précédent"><ChevronLeft size={18} /></button>}
          <h2>{title}</h2>
          {view !== "agenda" && <button className="cal-sq" onClick={() => step(1)} aria-label="Suivant"><ChevronRight size={18} /></button>}
          <button className="cal-a" onClick={toToday}>Aujourd'hui</button>
        </div>
        <div className="fp-seg" style={{ flexWrap: "nowrap" }}>
          {[["month", "Mois"], ["week", "Semaine"], ["agenda", "Agenda"]].map(([v, l]) => <button key={v} className={view === v ? "on" : ""} onClick={() => setV(v)}>{l}</button>)}
        </div>
        <div className="cal-legend">
          <span style={{ "--c": COLOR.planifie }}><i />Planifié</span>
          <span style={{ "--c": COLOR.termine }}><i />Terminé</span>
          <label className="cal-tg"><input type="checkbox" checked={showX} onChange={(e) => setShowX(e.target.checked)} /><span style={{ "--c": COLOR.annule }}><i />Annulés</span></label>
          <label className="cal-tg"><input type="checkbox" checked={showM} onChange={(e) => setShowM(e.target.checked)} /><span style={{ "--c": COLOR.fin }}><i />Missions</span></label>
        </div>
      </section>

      <Err e={s.error} />
      {s.data === undefined && !s.error && <div className="fp-card cal-skel" />}

      {s.data !== undefined && view === "month" && (
        <>
          <section className="fp-card cal-month">
            <div className="cal-wd">{WD.map((w) => <span key={w}>{w}</span>)}</div>
            <div className="cal-grid">
              {monthDays.map((d) => {
                const k = ymd(d), ev = byDay.get(k) || [];
                return (
                  <button key={k} className={"cal-cell" + (d.getMonth() !== mo ? " out" : "") + (k === todayKey ? " today" : "") + (k === day ? " sel" : "")} onClick={() => setDay(k)}>
                    <b>{d.getDate()}</b>
                    <span className="cal-chips">{ev.slice(0, 3).map(chip)}{ev.length > 3 && <em>+{ev.length - 3}</em>}</span>
                  </button>
                );
              })}
            </div>
          </section>
          {dayPanel}
        </>
      )}

      {s.data !== undefined && view === "week" && (
        <>
          <section className="cal-week">
            {weekDays.map((d, i) => {
              const k = ymd(d), ev = byDay.get(k) || [];
              return (
                <button key={k} className={"fp-card cal-wcol" + (k === todayKey ? " today" : "") + (k === day ? " sel" : "")} onClick={() => setDay(k)}>
                  <header><small>{WD[i]}</small><b>{d.getDate()}</b></header>
                  <div>{ev.length ? ev.map((e) => <span className="cal-wev" key={e.key} style={{ "--c": e.color }}>{e.label}</span>) : <small className="cal-free">Libre</small>}</div>
                </button>
              );
            })}
          </section>
          {dayPanel}
        </>
      )}

      {s.data !== undefined && view === "agenda" && (
        groups.length ? groups.map((g) => (
          <section className="fp-card cal-day" key={g.k}>
            <header><div><h2 style={{ textTransform: "capitalize" }}>{g.k === todayKey ? "Aujourd'hui" : longDay(new Date(g.k + "T12:00"))}</h2><p>{g.list.length} événement{g.list.length > 1 ? "s" : ""}</p></div></header>
            <div className="cal-cards">{g.list.map(card)}</div>
          </section>
        )) : (
          <div className="fp-card ep-empty">
            <CalendarDays size={32} style={{ margin: "0 auto 8px", display: "block" }} />
            <b>Rien à venir</b>
            <p>Planifiez un entretien pour qu'il apparaisse ici.</p>
          </div>
        )
      )}
    </div>
  );
}