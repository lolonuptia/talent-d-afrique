const BASE: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Valeurs par défaut, remplacées au démarrage par celles du backend (voir initSpec).
export const C = {
  contrats: ["stage", "cdd", "cdi", "mission"],
  statutsOffre: ["active", "expiree", "archivee"],
  statutsCand: ["recue", "en_cours", "entretien", "refusee", "acceptee"],
  modes: ["visio", "presentiel", "telephone"],
};

let SPEC: any = null;
const deref = (o: any): any => {
  if (!o) return o;
  if (o.$ref) return deref(SPEC.components.schemas[o.$ref.split("/").pop()]);
  if (o.anyOf) return o.anyOf.map(deref).find((x: any) => x && x.type !== "null") ?? o;
  if (o.allOf) return deref(o.allOf[0]);
  return o;
};
export const prop = (schema: string, p: string): any => (SPEC ? deref(SPEC.components.schemas[schema]?.properties?.[p]) : undefined);
export const enumOf = (schema: string, p: string, fb: string[]): string[] => prop(schema, p)?.enum ?? fb;
export const hasProp = (schema: string, p: string) => !SPEC || !!SPEC.components.schemas[schema]?.properties?.[p];
/** Convertit la valeur d'un champ de formulaire vers le type réellement attendu par l'API. */
export const coerce = (schema: string, p: string, v: any) => {
  if (v === "" || v == null) return null;
  const t = prop(schema, p)?.type;
  if (t === "integer" || t === "number") return Number(v);
  if (t === "string") return String(v);
  return v;
};
export const queryParams = (path: string): string[] =>
  (SPEC?.paths?.[path]?.get?.parameters || []).filter((p: any) => p.in === "query").map((p: any) => p.name);
export const asList = (d: any): any[] => (Array.isArray(d) ? d : d?.items ?? d?.results ?? []);

/** Lit le schéma du backend au démarrage : les listes de valeurs et les types viennent de l'API, rien n'est codé en dur. */
export async function initSpec() {
  try {
    const r = await fetch(BASE.replace(/\/api\/?$/, "") + "/openapi.json");
    SPEC = await r.json();
    Object.assign(C, {
      contrats: enumOf("OffreCreate", "type_contrat", C.contrats),
      statutsOffre: enumOf("OffreUpdate", "statut", C.statutsOffre),
      statutsCand: enumOf("CandidatureStatutUpdate", "statut", C.statutsCand),
      modes: enumOf("EntretienCreate", "mode", C.modes),
    });
  } catch { console.warn("Schéma de l'API indisponible : valeurs par défaut utilisées."); }
}

export class ApiError extends Error { status = 0; }

export const setTokens = (a: string, r?: string) => { localStorage.setItem("access", a); if (r) localStorage.setItem("refresh", r); };
export const clearTokens = () => { localStorage.removeItem("access"); localStorage.removeItem("refresh"); };

function text(d: any, s: number): string {
  const x = d?.detail;
  if (typeof x === "string") return x;
  if (Array.isArray(x)) return x.map((e: any) => `${(e.loc || []).slice(1).join(".")} : ${e.msg}`).join(" | ");
  return `Erreur ${s}`;
}

function send(path: string, method: string, body?: unknown) {
  const h: Record<string, string> = {};
  const a = localStorage.getItem("access");
  if (a) h.Authorization = "Bearer " + a;
  let b: BodyInit | undefined;
  if (body instanceof FormData) b = body;
  else if (body !== undefined) { h["Content-Type"] = "application/json"; b = JSON.stringify(body); }
  return fetch(BASE + path, { method, headers: h, body: b });
}

export async function api<T = any>(path: string, method = "GET", body?: unknown): Promise<T> {
  let res = await send(path, method, body);
  const r = localStorage.getItem("refresh");
  if (res.status === 401 && r && !path.startsWith("/auth/")) {
    const rr = await send("/auth/refresh", "POST", { refresh_token: r });
    if (rr.ok) { const t = await rr.json(); setTokens(t.access_token, t.refresh_token); res = await send(path, method, body); }
    else clearTokens();
  }
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!res.ok) { const e = new ApiError(text(data, res.status)); e.status = res.status; throw e; }
  return data as T;
}

export const list = (path: string) => api(path).then(asList);

export const qs = (o: Record<string, any>) => {
  const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null) as [string, string][]).toString();
  return s ? "?" + s : "";
};
