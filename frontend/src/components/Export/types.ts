import type { SearchResultData } from '../ClassicSearch';

export type ExportFormat = 'pdf' | 'zip';
export type ExportLayout = 'single' | 'grid' | 'contact';
export type PageSize = 'letter' | 'a4';

export interface ExportOptions {
  format: ExportFormat;
  layout: ExportLayout;
  pageSize: PageSize;
  includeTitle: boolean;
  includeArchitect: boolean;
  includeLocation: boolean;
  includeTypology: boolean;
  includeSourceUrl: boolean;
  customTitle?: string;
}

export interface ExportProject {
  project_id: string;
  title: string;
  architect?: string;
  location?: string;
  year?: number;
  typology?: string;
  imageUrl: string;
  sourceUrl?: string;
}

// Convert SearchResultData to ExportProject
export function toExportProject(result: SearchResultData): ExportProject {
  return {
    project_id: result.project_id,
    title: result.project_title,
    architect: result.architect,
    location: result.location_display,
    year: result.year,
    typology: result.badges?.typology?.[0],
    imageUrl: result.thumb_url || result.image_url,
    sourceUrl: undefined, // Not available in SearchResultData
  };
}

// Default export options
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  layout: 'single',
  pageSize: 'letter',
  includeTitle: true,
  includeArchitect: true,
  includeLocation: true,
  includeTypology: true,
  includeSourceUrl: false,
};

// Page dimensions in points (72 points = 1 inch)
export const PAGE_SIZES = {
  letter: { width: 612, height: 792 },  // 8.5" x 11"
  a4: { width: 595, height: 842 },      // 210mm x 297mm
} as const;



