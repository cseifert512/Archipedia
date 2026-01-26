import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { ExportProject, ExportOptions, PageSize } from '../types';
import { PAGE_SIZES } from '../types';

const createStyles = (pageSize: PageSize) => StyleSheet.create({
  page: {
    ...PAGE_SIZES[pageSize],
    backgroundColor: '#ffffff',
    padding: 48,
    fontFamily: 'Helvetica',
  },
  imageContainer: {
    width: '100%',
    height: pageSize === 'letter' ? 380 : 420,
    marginBottom: 24,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  architect: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 10,
    color: '#999999',
    marginRight: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontSize: 11,
    color: '#333333',
  },
  typologyBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  typologyText: {
    fontSize: 10,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#999999',
  },
  pageNumber: {
    fontSize: 8,
    color: '#999999',
  },
});

interface SinglePageLayoutProps {
  projects: ExportProject[];
  options: ExportOptions;
  customTitle?: string;
}

export function SinglePageLayout({ projects, options, customTitle }: SinglePageLayoutProps) {
  const styles = createStyles(options.pageSize);
  const totalPages = projects.length;

  return (
    <>
      {projects.map((project, index) => (
        <Page 
          key={project.project_id} 
          size={options.pageSize.toUpperCase() as 'LETTER' | 'A4'} 
          style={styles.page}
        >
          {/* Image */}
          <View style={styles.imageContainer}>
            {project.imageUrl && (
              <Image src={project.imageUrl} style={styles.image} />
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            {options.includeTitle && (
              <Text style={styles.title}>{project.title}</Text>
            )}
            
            {options.includeArchitect && project.architect && (
              <Text style={styles.architect}>{project.architect}</Text>
            )}

            <View style={styles.metadataRow}>
              {options.includeLocation && project.location && (
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>Location</Text>
                  <Text style={styles.metadataValue}>
                    {project.location}
                    {project.year && ` · ${project.year}`}
                  </Text>
                </View>
              )}
            </View>

            {options.includeTypology && project.typology && (
              <View style={styles.typologyBadge}>
                <Text style={styles.typologyText}>{project.typology}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {customTitle || 'Archipedia Export'}
            </Text>
            <Text style={styles.pageNumber}>
              {index + 1} / {totalPages}
            </Text>
          </View>
        </Page>
      ))}
    </>
  );
}



