/**
 * Generate API Client
 * 
 * Frontend client for the AI image generation endpoints.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============ Types ============

export interface GenerateOptions {
  prompt: string;
  style: 'photorealistic' | 'render' | 'sketch';
  styleReferenceUrl?: string;
  styleReferenceDescription?: string;
  variations: number;
}

export interface GeneratedImage {
  id: string;
  url: string | null;
  prompt: string;
  style: string;
  variation: number;
  description?: string;
  embedding?: number[];
}

export interface GenerateResponse {
  images: GeneratedImage[];
  search_ready: boolean;
  latency_ms: number;
  message?: string;
}

export interface ValidatedProject {
  project_id: string;
  title?: string;
  similarity: number;
  thumb_url?: string;
  typology?: string;
  country?: string;
}

export interface ValidateResponse {
  query_image?: string;
  similar_projects: ValidatedProject[];
  validation_score: number;
  latency_ms: number;
}

export interface StyleDescription {
  description: string;
  materials?: string[];
  palette?: string[];
  massing_description?: string;
  success: boolean;
  latency_ms: number;
}

export interface GenerationStatus {
  available: boolean;
  message: string;
}

// ============ API Functions ============

/**
 * Check if the generation service is available.
 */
export async function checkGenerationStatus(): Promise<GenerationStatus> {
  const response = await fetch(`${API_BASE}/generate/status`);
  if (!response.ok) {
    return {
      available: false,
      message: 'Generation service unavailable'
    };
  }
  return response.json();
}

/**
 * Generate architectural concept images from a text prompt.
 * 
 * @param options - Generation options including prompt, style, and variation count
 * @returns Array of generated image data
 */
export async function generateConcept(
  options: GenerateOptions
): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE}/generate/concept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: options.prompt,
      style: options.style,
      style_reference_url: options.styleReferenceUrl,
      style_reference_description: options.styleReferenceDescription,
      variations: options.variations,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail?.message || error.message || 'Generation failed');
  }

  return response.json();
}

/**
 * Find real built projects similar to a generated/uploaded concept.
 * 
 * @param imageUrl - URL of the image to validate
 * @param topK - Number of similar projects to return
 * @param minSimilarity - Minimum similarity threshold (0-1)
 * @returns Validation results with similar projects
 */
export async function validateConcept(
  imageUrl: string,
  topK: number = 10,
  minSimilarity: number = 0.5
): Promise<ValidateResponse> {
  const response = await fetch(`${API_BASE}/generate/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      top_k: topK,
      min_similarity: minSimilarity,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail?.message || error.message || 'Validation failed');
  }

  return response.json();
}

/**
 * Validate a concept image using a pre-computed embedding.
 * 
 * @param embedding - Embedding vector
 * @param topK - Number of similar projects to return
 * @param minSimilarity - Minimum similarity threshold
 * @returns Validation results with similar projects
 */
export async function validateConceptByEmbedding(
  embedding: number[],
  topK: number = 10,
  minSimilarity: number = 0.5
): Promise<ValidateResponse> {
  const response = await fetch(`${API_BASE}/generate/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      embedding,
      top_k: topK,
      min_similarity: minSimilarity,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail?.message || error.message || 'Validation failed');
  }

  return response.json();
}

/**
 * Validate a concept by uploading an image file directly.
 * 
 * @param file - Image file to validate
 * @param topK - Number of similar projects to return
 * @param minSimilarity - Minimum similarity threshold
 * @returns Validation results with similar projects
 */
export async function validateConceptFile(
  file: File,
  topK: number = 10,
  minSimilarity: number = 0.5
): Promise<ValidateResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams({
    top_k: topK.toString(),
    min_similarity: minSimilarity.toString(),
  });

  const response = await fetch(`${API_BASE}/generate/validate-file?${params}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail?.message || error.message || 'Validation failed');
  }

  return response.json();
}

/**
 * Extract style description from a reference image.
 * 
 * @param imageUrl - URL of the reference image
 * @returns Extracted style description
 */
export async function extractStyle(imageUrl: string): Promise<StyleDescription> {
  const response = await fetch(`${API_BASE}/generate/style-extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail?.message || error.message || 'Style extraction failed');
  }

  return response.json();
}

