/**
 * Guepex (formerly Yalidine) API client — server only.
 *
 * Adapted from the integration skill, with the env var names this project uses.
 *
 * NEVER import this into a component. The API token has no RLS, no rate limit
 * and no scope: it can create, edit and delete any parcel on the account. It
 * must not reach the browser bundle. Everything that calls it lives behind a
 * server function or a server route.
 */

const DEFAULT_BASE_URL = "https://api.guepex.app/v1/";

export type GuepexConfig = {
  apiId: string;
  apiToken: string;
  baseUrl?: string;
};

export type ListResponse<T> = {
  has_more: boolean;
  total_data: number;
  data: T[];
};

type RateLimitStatus = {
  secondLeft: number | null;
  minuteLeft: number | null;
  hourLeft: number | null;
  dayLeft: number | null;
};

export type ParcelInput = {
  order_id: string;
  firstname: string;
  familyname: string;
  contact_phone: string;
  address: string;
  to_wilaya_name: string;
  to_commune_name: string;
  product_list: string;
  price: number;
  do_insurance: boolean;
  declared_value: number;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  freeshipping?: boolean;
  is_stopdesk?: boolean;
  /** Required by the carrier when `is_stopdesk` is true. */
  stopdesk_id?: number;
  has_exchange?: boolean;
};

export type CreateResult = {
  success: boolean;
  tracking: string | null;
  message: string;
};

class GuepexError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "GuepexError";
  }
}

/** Config from the environment, or null when the carrier is not connected yet. */
export function readGuepexConfig(): GuepexConfig | null {
  const apiId = process.env.GUEPEX_API_ID;
  const apiToken = process.env.GUEPEX_API_TOKEN;
  if (!apiId || !apiToken) return null;
  return {
    apiId,
    apiToken,
    baseUrl: process.env.GUEPEX_BASE_URL || DEFAULT_BASE_URL,
  };
}

export function createGuepexClient(config: GuepexConfig) {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  let lastRateLimit: RateLimitStatus = {
    secondLeft: null,
    minuteLeft: null,
    hourLeft: null,
    dayLeft: null,
  };

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
      secondLeft: headerInt(res, "x-second-quota-left"),
      minuteLeft: headerInt(res, "x-minute-quota-left"),
      hourLeft: headerInt(res, "x-hour-quota-left"),
      dayLeft: headerInt(res, "x-day-quota-left"),
    };

    if (res.status === 429) {
      throw new GuepexError(
        `Carrier rate limit hit. Retry after ${res.headers.get("Retry-After") ?? "?"}s.`,
        429,
        await safeJson(res),
      );
    }
    if (!res.ok) {
      throw new GuepexError(`Carrier API error ${res.status}`, res.status, await safeJson(res));
    }
    return (await res.json()) as T;
  }

  return {
    getLastRateLimit: () => lastRateLimit,
    listWilayas: () => request<ListResponse<Record<string, unknown>>>("wilayas/"),
    listCommunes: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`communes/${qs(params)}`),
    listCenters: (params: Record<string, unknown> = {}) =>
      request<ListResponse<Record<string, unknown>>>(`centers/${qs(params)}`),
    getFees: (fromWilayaId: number, toWilayaId: number) =>
      request<Record<string, unknown>>(
        `fees/?from_wilaya_id=${fromWilayaId}&to_wilaya_id=${toWilayaId}`,
      ),
    /** Always an array. Per-parcel failure is normal, so read each result. */
    createParcels: (parcels: ParcelInput[]) =>
      request<Record<string, CreateResult>>("parcels/", {
        method: "POST",
        body: JSON.stringify(parcels),
      }),
    getParcel: (tracking: string) => request<Record<string, unknown>>(`parcels/${tracking}`),
  };
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return "";
  const search = new URLSearchParams();
  for (const [key, value] of entries) search.set(key, String(value));
  return `?${search.toString()}`;
}

function headerInt(res: Response, name: string): number | null {
  const raw = res.headers.get(name);
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
