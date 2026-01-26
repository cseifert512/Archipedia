import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { SearchResultData } from '../ClassicSearch';
import type { ExportOptions, ExportProject } from './types';
import { toExportProject } from './types';
import { SinglePageLayout } from './layouts/SinglePageLayout';
import { GridLayout } from './layouts/GridLayout';
import { ContactSheetLayout } from './layouts/ContactSheetLayout';
import type { ImageCache } from './imageUtils';
import { getImageFromCache } from './imageUtils';

interface SearchResultsPDFProps {
  results: SearchResultData[];
  options: ExportOptions;
  title?: string;
  imageCache?: ImageCache;
}

export function SearchResultsPDF({ results, options, title, imageCache = {} }: SearchResultsPDFProps) {
  // Convert search results to export projects, applying image cache
  const projects: ExportProject[] = results.map((result) => {
    const project = toExportProject(result);
    // Use cached base64 image if available
    project.imageUrl = getImageFromCache(project.imageUrl, imageCache) || project.imageUrl;
    return project;
  });

  const renderLayout = () => {
    switch (options.layout) {
      case 'single':
        return (
          <SinglePageLayout 
            projects={projects} 
            options={options} 
            customTitle={title}
          />
        );
      case 'grid':
        return (
          <GridLayout 
            projects={projects} 
            options={options} 
            customTitle={title}
          />
        );
      case 'contact':
        return (
          <ContactSheetLayout 
            projects={projects} 
            options={options} 
            customTitle={title}
          />
        );
      default:
        return (
          <SinglePageLayout 
            projects={projects} 
            options={options} 
            customTitle={title}
          />
        );
    }
  };

  return (
    <Document
      title={title || 'Archipedia Export'}
      author="Archipedia"
      subject="Architectural Precedents"
      keywords="architecture, design, precedent, research"
    >
      {renderLayout()}
    </Document>
  );
}

