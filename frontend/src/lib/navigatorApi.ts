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

export interface NavigatorTextSearchResult {
  rank?: number;
  score?: number;
  project_id?: string;
  title?: string;
  country?: string;
  typology?: string;
  climate_bin?: string;
  massing_type?: string;
  thumb_url?: string | null;
  [key: string]: any;
}

export interface NavigatorSearchTextResponse {
  query?: string;
  results: NavigatorTextSearchResult[];
  debug?: Record<string, any>;
}

// Structured error from API
export interface ApiErrorDetail {
  error: string;
  message: string;
  suggestion?: string;
}

export class SearchError extends Error {
  code: string;
  suggestion?: string;
  
  constructor(message: string, code: string, suggestion?: string) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    this.suggestion = suggestion;
  }
}

async function parseErrorResponse(res: Response): Promise<SearchError> {
  try {
    const data = await res.json();
    // Check if it's a structured error (FastAPI returns { detail: {...} })
    const detail = data.detail;
    if (detail && typeof detail === 'object' && detail.error) {
      return new SearchError(
        detail.message || 'An error occurred',
        detail.error,
        detail.suggestion
      );
    }
    // Fallback for string errors
    const message = typeof detail === 'string' ? detail : res.statusText;
    return new SearchError(message, 'unknown_error');
  } catch {
    return new SearchError(res.statusText || 'Request failed', 'request_failed');
  }
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
    throw await parseErrorResponse(res);
  }

  return (await res.json()) as NavigatorSearchFileResponse;
}

export async function searchByText(
  query: string,
  options?: { topK?: number; country?: string; typology?: string; climateBin?: string }
): Promise<NavigatorSearchTextResponse> {
  const base = getApiBaseUrl();
  const q = (query || "").trim();
  const topK = options?.topK ?? 25;

  const params = new URLSearchParams();
  params.set("q", q);
  params.set("top_k", String(topK));
  if (options?.country) params.set("country", options.country);
  if (options?.typology) params.set("typology", options.typology);
  if (options?.climateBin) params.set("climate_bin", options.climateBin);

  const res = await fetch(`${base}/search/text?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  return (await res.json()) as NavigatorSearchTextResponse;
}

export interface ProjectDetails {
  project_id: string;
  title: string;
  country: string;
  climate_bin: string;
  typology: string;
  massing_type: string;
  wwr_band: string;
  image_ids: string[];
  plan_ids?: string[];
  tags?: string[];
}

export async function getProjectDetails(projectId: string): Promise<ProjectDetails> {
  const base = getApiBaseUrl();

  const res = await fetch(`${base}/projects/${encodeURIComponent(projectId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Navigator /projects/${projectId} failed (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as ProjectDetails;
}

export function getImageUrl(imageId: string): string {
  // R2 CDN URL for images
  // Structure: {R2_BASE}/{folder}/{filename}.jpg
  // Where folder = project_id with category suffix (e.g., p_xxx_exteriors_p_xxx)
  // And filename = folder + _exterior_N or _interior_N or _diagram_N
  const R2_BASE = "https://pub-12350662edb244568152a5b72ed1dbb8.r2.dev";
  
  // Strip 'i_' prefix if present
  const cleanId = imageId.startsWith('i_') ? imageId.slice(2) : imageId;
  
  // The cleanId format is: {folder}_{folder}_{type}_{N}
  // Example: p_xxx_exteriors_p_xxx_p_xxx_exteriors_p_xxx_exterior_1
  // We need to extract folder and construct: {folder}/{folder}_{type}_{N}.jpg
  
  // Find the type suffix (exterior_N, interior_N, diagram_N) at the end
  const suffixMatch = cleanId.match(/_(exterior|interior|diagram)_(\d+)$/);
  if (suffixMatch) {
    const suffix = suffixMatch[0]; // e.g., "_exterior_1"
    const beforeSuffix = cleanId.slice(0, -suffix.length);
    
    // beforeSuffix is {folder}_{folder} - we split at midpoint
    // The format is: folder + "_" + folder, so length = 2*folder.length + 1
    // midpoint gives us the underscore position
    const midpoint = Math.floor(beforeSuffix.length / 2);
    const firstHalf = beforeSuffix.slice(0, midpoint);
    const secondHalf = beforeSuffix.slice(midpoint);
    
    // Check if they match (secondHalf starts with underscore and rest equals firstHalf)
    if (secondHalf.startsWith('_') && firstHalf === secondHalf.slice(1)) {
      const folder = firstHalf;
      const filename = folder + suffix;
      return `${R2_BASE}/${folder}/${filename}.jpg`;
    }
  }
  
  // Fallback: try to use as-is (won't work but provides a URL)
  return `${R2_BASE}/${cleanId}/${cleanId}.jpg`;
}

export function getThumbnailUrl(imageId: string): string {
  // Thumbnails use the same URL as full images
  return getImageUrl(imageId);
}


