/**
 * Utility functions for handling images in PDF export.
 * 
 * @react-pdf/renderer has CORS restrictions when fetching external images.
 * We need to pre-fetch images and convert them to base64 data URLs.
 */

export interface ImageCache {
  [url: string]: string; // url -> base64 data URL
}

/**
 * Fetch an image and convert it to a base64 data URL.
 * Returns null if the fetch fails.
 */
export async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // Fetch the image
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${url} (${response.status})`);
      return null;
    }
    
    // Get the blob
    const blob = await response.blob();
    
    // Convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.warn(`Failed to read image as base64: ${url}`);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`Error fetching image: ${url}`, error);
    return null;
  }
}

/**
 * Pre-fetch multiple images and return a cache mapping URLs to base64 data URLs.
 * Failed fetches will be omitted from the cache.
 */
export async function prefetchImages(urls: string[]): Promise<ImageCache> {
  const cache: ImageCache = {};
  
  // Deduplicate URLs
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  
  // Fetch all images in parallel
  const results = await Promise.all(
    uniqueUrls.map(async (url) => {
      const base64 = await fetchImageAsBase64(url);
      return { url, base64 };
    })
  );
  
  // Build cache
  for (const { url, base64 } of results) {
    if (base64) {
      cache[url] = base64;
    }
  }
  
  return cache;
}

/**
 * Get the base64 version of an image URL from the cache,
 * or return the original URL if not cached.
 */
export function getImageFromCache(url: string | undefined, cache: ImageCache): string | undefined {
  if (!url) return undefined;
  return cache[url] || url;
}

/**
 * Create a placeholder data URL for failed images.
 * Returns a gray placeholder image.
 */
export function getPlaceholderImage(): string {
  // 1x1 gray pixel PNG
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}



