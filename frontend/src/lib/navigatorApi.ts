export interface NavigatorSearchResult {
  rank?: number;
  distance?: number;
  faiss_id?: number;
  image_id?: string;
  project_id?: string;
  thumb_url?: string;
  title?: string;
  country?: string;
  typology?: string;
  climate_bin?: string;
  massing_type?: string;
  [key: string]: any;
}

export interface NavigatorSearchFileResponse {
  query_id?: string;
  embed_latency_ms?: number;
  latency_ms?: number;
  fusion_latency_ms?: number;
  weights?: Record<string, any>;
  weights_effective?: Record<string, any>;
  filters?: Record<string, any>;
  results: NavigatorSearchResult[];
  debug?: Record<string, any>;
}

function getApiBaseUrl(): string {
  const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  return (raw && raw.trim()) ? raw.trim().replace(/\/+$/, "") : "http://localhost:8000";
}

function getAuthHeader(): Record<string, string> {
  const token = ((import.meta as any).env?.VITE_API_TOKEN as string | undefined)?.trim();
  if (!token) return {};
  return { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` };
}

export function toAbsoluteUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getApiBaseUrl();
  if (pathOrUrl.startsWith("/")) return `${base}${pathOrUrl}`;
  return `${base}/${pathOrUrl}`;
}

export async function searchByImageFile(
  file: File,
  options?: {
    topK?: number;
    wVisual?: number;
    wAttr?: number;
    wSpatial?: number;
    mode?: string;
  }
): Promise<NavigatorSearchFileResponse> {
  const base = getApiBaseUrl();
  const topK = options?.topK ?? 12;
  const wVisual = options?.wVisual ?? 1.0;
  const wAttr = options?.wAttr ?? 0.0;
  const wSpatial = options?.wSpatial ?? 0.0;
  const mode = options?.mode;

  const params = new URLSearchParams();
  params.set("top_k", String(topK));
  params.set("w_visual", String(wVisual));
  params.set("w_attr", String(wAttr));
  params.set("w_spatial", String(wSpatial));
  if (mode) params.set("mode", mode);

  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${base}/search/file?${params.toString()}`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Navigator /search/file failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as NavigatorSearchFileResponse;
}


