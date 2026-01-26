import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { ExportProject, ExportOptions, PageSize } from '../types';
import { PAGE_SIZES } from '../types';

const createStyles = (pageSize: PageSize) => StyleSheet.create({
  page: {
    ...PAGE_SIZES[pageSize],
    backgroundColor: '#ffffff',
    padding: 36,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#B64424',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  tileWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  tile: {
    backgroundColor: '#fafafa',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  tileImage: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
    backgroundColor: '#f0f0f0',
  },
  tileContent: {
    padding: 10,
  },
  tileTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  tileArchitect: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
  },
  tileLocation: {
    fontSize: 8,
    color: '#888888',
  },
  tileBadge: {
    marginTop: 6,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  tileBadgeText: {
    fontSize: 7,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
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

interface GridLayoutProps {
  projects: ExportProject[];
  options: ExportOptions;
  customTitle?: string;
}

// Chunk projects into groups of 4 for 2x2 grid
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function GridLayout({ projects, options, customTitle }: GridLayoutProps) {
  const styles = createStyles(options.pageSize);
  const projectChunks = chunkArray(projects, 4);
  const totalPages = projectChunks.length;

  return (
    <>
      {projectChunks.map((chunk, pageIndex) => (
        <Page 
          key={pageIndex} 
          size={options.pageSize.toUpperCase() as 'LETTER' | 'A4'} 
          style={styles.page}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {customTitle || 'Architectural Precedents'}
            </Text>
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {chunk.map((project) => (
              <View key={project.project_id} style={styles.tileWrapper}>
                <View style={styles.tile}>
                  {project.imageUrl && (
                    <Image src={project.imageUrl} style={styles.tileImage} />
                  )}
                  <View style={styles.tileContent}>
                    {options.includeTitle && (
                      <Text style={styles.tileTitle}>{project.title}</Text>
                    )}
                    {options.includeArchitect && project.architect && (
                      <Text style={styles.tileArchitect}>{project.architect}</Text>
                    )}
                    {options.includeLocation && (
                      <Text style={styles.tileLocation}>
                        {project.location}
                        {project.year && ` · ${project.year}`}
                      </Text>
                    )}
                    {options.includeTypology && project.typology && (
                      <View style={styles.tileBadge}>
                        <Text style={styles.tileBadgeText}>{project.typology}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Generated with Archipedia</Text>
            <Text style={styles.pageNumber}>
              {pageIndex + 1} / {totalPages}
            </Text>
          </View>
        </Page>
      ))}
    </>
  );
}



