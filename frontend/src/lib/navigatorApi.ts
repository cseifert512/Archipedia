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
  // Pagination
  page?: number;
  page_size?: number;
  has_more?: boolean;
  total_count?: number;
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
  // Pagination
  page?: number;
  page_size?: number;
  has_more?: boolean;
  total_count?: number;
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
    page?: number;
    pageSize?: number;
    wVisual?: number;
    wAttr?: number;
    wSpatial?: number;
    mode?: string;
  }
): Promise<NavigatorSearchFileResponse> {
  const base = getApiBaseUrl();
  const topK = options?.topK ?? 12;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 12;
  const wVisual = options?.wVisual ?? 1.0;
  const wAttr = options?.wAttr ?? 0.0;
  const wSpatial = options?.wSpatial ?? 0.0;
  const mode = options?.mode;

  const params = new URLSearchParams();
  params.set("top_k", String(topK));
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
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
  options?: { 
    topK?: number; 
    page?: number;
    pageSize?: number;
    country?: string; 
    typology?: string; 
    climateBin?: string 
  }
): Promise<NavigatorSearchTextResponse> {
  const base = getApiBaseUrl();
  const q = (query || "").trim();
  const topK = options?.topK ?? 25;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 12;

  const params = new URLSearchParams();
  params.set("q", q);
  params.set("top_k", String(topK));
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
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

// Hybrid search response interface
export interface NavigatorHybridSearchResult extends NavigatorSearchResult {
  combined_score?: number;
  visual_score?: number;
  text_score?: number;
  match_reason?: string;
}

export interface NavigatorHybridSearchResponse {
  query_id?: string;
  latency_ms?: number;
  weights?: {
    visual: number;
    text: number;
    visual_normalized: number;
    text_normalized: number;
  };
  has_visual?: boolean;
  has_text?: boolean;
  results: NavigatorHybridSearchResult[];
  // Pagination
  page?: number;
  page_size?: number;
  has_more?: boolean;
  total_count?: number;
}

/**
 * Hybrid search combining visual (image) and semantic (text) search.
 * 
 * @param options Search options
 * @param options.file - Image file for visual search
 * @param options.imageId - Alternative to file: use existing image embedding
 * @param options.query - Text query for semantic search
 * @param options.topK - Number of results to return (default: 12)
 * @param options.page - Page number (1-indexed, default: 1)
 * @param options.pageSize - Results per page (default: 12)
 * @param options.wVisual - Weight for visual results (0-1, default: 0.5)
 * @param options.wText - Weight for text results (0-1, default: 0.5)
 * @returns Promise with search results
 */
export async function searchHybrid(options: {
  file?: File;
  imageId?: string;
  query?: string;
  topK?: number;
  page?: number;
  pageSize?: number;
  wVisual?: number;
  wText?: number;
}): Promise<NavigatorHybridSearchResponse> {
  const base = getApiBaseUrl();
  
  const params = new URLSearchParams();
  params.set("top_k", String(options.topK ?? 12));
  params.set("page", String(options.page ?? 1));
  params.set("page_size", String(options.pageSize ?? 12));
  params.set("w_visual", String(options.wVisual ?? 0.5));
  params.set("w_text", String(options.wText ?? 0.5));
  
  if (options.imageId) {
    params.set("image_id", options.imageId);
  }
  if (options.query) {
    params.set("query", options.query);
  }
  
  const form = new FormData();
  if (options.file) {
    form.append("file", options.file);
  }
  
  const res = await fetch(`${base}/search/hybrid?${params.toString()}`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: options.file ? form : undefined,
  });
  
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  
  return (await res.json()) as NavigatorHybridSearchResponse;
}

// ---- Multi-Image Search ----

export type FusionMode = 'average' | 'weighted' | 'max_pool';

export interface MultiImageSearchOptions {
  /** Fusion strategy for combining image embeddings */
  fusionMode?: FusionMode;
  /** Weights for each image (for 'weighted' mode, must match files.length) */
  imageWeights?: number[];
  /** Negative reference images to avoid (0-3) */
  negativeFiles?: File[];
  /** Weight for negative image influence (0-1) */
  negWeight?: number;
  /** Number of results to return */
  topK?: number;
  /** Page number (1-indexed) */
  page?: number;
  /** Results per page */
  pageSize?: number;
  /** Visual weight */
  wVisual?: number;
  /** Attribute weight */
  wAttr?: number;
  /** Spatial weight */
  wSpatial?: number;
  /** Typologies to exclude */
  excludeTypology?: string[];
  /** Climate bins to exclude */
  excludeClimateBin?: string[];
  /** Project IDs to exclude */
  excludeProjectIds?: string[];
}

export interface MultiImageSearchResponse extends NavigatorSearchFileResponse {
  debug?: {
    positive_images?: number;
    negative_images?: number;
    fusion_mode?: string;
    exclusions?: {
      typology?: string[];
      climate_bin?: string[];
      project_ids?: string[];
    };
    [key: string]: any;
  };
}

/**
 * Search using multiple reference images with embedding fusion.
 * 
 * @param files - 1-5 positive reference images
 * @param options - Search options including fusion mode, negative images, exclusions
 * @returns Promise with search results
 * 
 * @example
 * // Find projects similar to ALL uploaded images
 * const results = await searchByMultipleImages(files, { fusionMode: 'average' });
 * 
 * @example
 * // Find projects similar to images but NOT museums
 * const results = await searchByMultipleImages(files, {
 *   excludeTypology: ['Museum', 'Gallery']
 * });
 * 
 * @example
 * // Find projects similar to these images but NOT like this other image
 * const results = await searchByMultipleImages(positiveFiles, {
 *   negativeFiles: [unwantedImage],
 *   negWeight: 0.4
 * });
 */
export async function searchByMultipleImages(
  files: File[],
  options?: MultiImageSearchOptions
): Promise<MultiImageSearchResponse> {
  const base = getApiBaseUrl();
  
  if (files.length < 1 || files.length > 5) {
    throw new SearchError(
      `Expected 1-5 images, got ${files.length}`,
      'invalid_image_count',
      'Upload between 1 and 5 reference images'
    );
  }
  
  const params = new URLSearchParams();
  params.set("fusion_mode", options?.fusionMode ?? "average");
  params.set("top_k", String(options?.topK ?? 50));
  params.set("page", String(options?.page ?? 1));
  params.set("page_size", String(options?.pageSize ?? 12));
  params.set("w_visual", String(options?.wVisual ?? 1.0));
  params.set("w_attr", String(options?.wAttr ?? 0.0));
  params.set("w_spatial", String(options?.wSpatial ?? 0.0));
  
  if (options?.negWeight !== undefined) {
    params.set("neg_weight", String(options.negWeight));
  }
  
  if (options?.imageWeights && options.imageWeights.length === files.length) {
    params.set("image_weights", options.imageWeights.join(","));
  }
  
  // Exclusion filters
  if (options?.excludeTypology && options.excludeTypology.length > 0) {
    params.set("exclude_typology", options.excludeTypology.join(","));
  }
  if (options?.excludeClimateBin && options.excludeClimateBin.length > 0) {
    params.set("exclude_climate_bin", options.excludeClimateBin.join(","));
  }
  if (options?.excludeProjectIds && options.excludeProjectIds.length > 0) {
    params.set("exclude_project_ids", options.excludeProjectIds.join(","));
  }
  
  const form = new FormData();
  
  // Append positive files
  files.forEach((file) => {
    form.append("files", file);
  });
  
  // Append negative files if provided
  if (options?.negativeFiles && options.negativeFiles.length > 0) {
    options.negativeFiles.forEach((file) => {
      form.append("negative_files", file);
    });
  }
  
  const res = await fetch(`${base}/search/multi-image?${params.toString()}`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: form,
  });
  
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  
  return (await res.json()) as MultiImageSearchResponse;
}

// ---- Search by Image ID ("More like this") ----

export interface SearchByImageIdOptions {
  /** Number of results to return */
  topK?: number;
  /** Page number (1-indexed) */
  page?: number;
  /** Results per page */
  pageSize?: number;
  /** Visual weight (0-1) */
  wVisual?: number;
  /** Attribute weight (0-1) */
  wAttr?: number;
  /** Spatial weight (0-1) */
  wSpatial?: number;
}

/**
 * Search for similar images using an existing image's embedding.
 * Used by "Search like this" / "More like this" feature.
 * 
 * @param imageId - The ID of an existing image to use as the search query
 * @param options - Search options including pagination and weights
 * @returns Promise with search results
 * 
 * @example
 * // Find projects similar to a specific image
 * const results = await searchByImageId("i_p_xxx_exteriors_p_xxx_exterior_1");
 */
export async function searchByImageId(
  imageId: string,
  options?: SearchByImageIdOptions
): Promise<NavigatorSearchFileResponse> {
  const base = getApiBaseUrl();
  
  const body = {
    image_id: imageId,
    top_k: options?.topK ?? 50,
    page: options?.page ?? 1,
    page_size: options?.pageSize ?? 12,
    weights: {
      visual: options?.wVisual ?? 1.0,
      spatial: options?.wSpatial ?? 0.0,
      attr: options?.wAttr ?? 0.25,
    },
    filters: {},
    strict: false,
  };
  
  const res = await fetch(`${base}/search/id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw await parseErrorResponse(res);
  }
  
  return (await res.json()) as NavigatorSearchFileResponse;
}

// ---- Autocomplete ----

export interface AutocompleteSuggestion {
  type: 'title' | 'typology' | 'architect' | 'city' | 'tag';
  value: string;
}

export interface AutocompleteResponse {
  query: string;
  suggestions: AutocompleteSuggestion[];
}

/**
 * Get autocomplete suggestions for search queries.
 * 
 * @param query - The search query prefix
 * @param limit - Maximum number of suggestions (default: 8)
 * @returns Promise with autocomplete suggestions
 */
export async function getAutocomplete(
  query: string,
  limit: number = 8
): Promise<AutocompleteSuggestion[]> {
  const base = getApiBaseUrl();
  const q = (query || "").trim();
  
  if (q.length < 1) {
    return [];
  }
  
  const params = new URLSearchParams();
  params.set("q", q);
  params.set("limit", String(limit));
  
  const res = await fetch(`${base}/autocomplete?${params.toString()}`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });
  
  if (!res.ok) {
    console.error("Autocomplete failed:", res.statusText);
    return [];
  }
  
  const data = (await res.json()) as AutocompleteResponse;
  return data.suggestions || [];
}


