/**
 * Yalidine (Guepex) API client — no external dependencies, works in
 * Node.js, Deno/Supabase Edge Functions, and any modern JS runtime with
 * global `fetch`.
 *
 * Usage:
 *   const client = createYalidineClient({
 *     apiId: process.env.YALIDINE_API_ID!,
 *     apiToken: process.env.YALIDINE_API_TOKEN!,
 *   });
 *   const wilayas = await client.listWilayas();
 *   const created = await client.createParcels([{ ... }]);
 *
 * IMPORTANT: this client is backend-only. Never import/instantiate it in
 * client-side (browser) code — the API token must never leave your server.
 */

const DEFAULT_BASE_URL = "https://api.guepex.app/v1/";

export interface YalidineClientConfig {
  apiId: string;
  apiToken: string;
  baseUrl?: string;
}

export interface ListResponse<T> {
  has_more: boolean;
  total_data: number;
  data: T[];
  links: { self: string; before?: string; next?: string };
}

export interface RateLimitStatus {
  secondLeft: number | null;
  minuteLeft: number | null;
  hourLeft: number | null;
  dayLeft: number | null;
}

export class YalidineApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "YalidineApiError";
  }
}

export function createYalidineClient(config: YalidineClientConfig) {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;

  let lastRateLimit: RateLimitStatus = {
    secondLeft: null,
    minuteLeft: null,
    hourLeft: null,
    dayLeft: null,
  };

  async function request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "X-API-ID": config.apiId,
        "X-API-TOKEN": config.apiToken,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    lastRateLimit = {
      secondLeft: parseIntHeader(res.headers.get("x-second-quota-left")),
      minuteLeft: parseIntHeader(res.headers.get("x-minute-quota-left")),
      hourLeft: parseIntHeader(res.headers.get("x-hour-quota-left")),
      dayLeft: parseIntHeader(res.headers.get("x-day-quota-left")),
    };

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      throw new YalidineApiError(
        `Rate limited. Retry after ${retryAfter ?? "unknown"}s.`,
        429,
        await safeJson(res)
      );
    }

    if (!res.ok) {
      throw new YalidineApiError(
        `Yalidine API error: ${res.status}`,
        res.status,
        await safeJson(res)
      );
    }

    return (await res.json()) as T;
  }

  function qs(params: Record<string, unknown>): string {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== null
    );
    if (entries.length === 0) return "";
    const search = new URLSearchParams();
    for (const [key, value] of entries) {
      search.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    return `?${search.toString()}`;
  }

  return {
    /** Rate-limit quota left as of the most recent request. */
    getLastRateLimit: () => lastRateLimit,

    // ---- Wilayas ----
    listWilayas: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`wilayas/${qs(params)}`),

    // ---- Communes ----
    listCommunes: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`communes/${qs(params)}`),

    // ---- Centers (stop-desks) ----
    listCenters: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`centers/${qs(params)}`),

    // ---- Fees ----
    getFees: (fromWilayaId: number, toWilayaId: number) =>
      request<Record<string, unknown>>(
        `fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`
      ),

    // ---- Parcels ----
    listParcels: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`parcels/${qs(params)}`),

    getParcel: (tracking: string) =>
      request<Record<string, unknown>>(`parcels/${tracking}`),

    /** Always send an array, even for a single parcel. Partial failure is normal. */
    createParcels: (parcels: Record<string, unknown>[]) =>
      request<Record<string, { success: boolean; tracking: string | null; message: string }>>(
        "parcels/",
        { method: "POST", body: JSON.stringify(parcels) }
      ),

    /** Only works while the parcel's last_status is "En préparation". */
    editParcel: (tracking: string, fields: Record<string, unknown>) =>
      request<Record<string, unknown>>(`parcels/${tracking}`, {
        method: "PATCH",
        body: JSON.stringify(fields),
      }),

    /** Only works while the parcel's last_status is "En préparation". */
    deleteParcels: (trackings: string[]) =>
      request<{ tracking: string; deleted: boolean }[]>(
        `parcels/?tracking=${trackings.join(",")}`,
        { method: "DELETE" }
      ),

    // ---- Histories ----
    listHistories: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`histories/${qs(params)}`),
  };
}

function parseIntHeader(value: string | null): number | null {
  if (value === null) return null;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
