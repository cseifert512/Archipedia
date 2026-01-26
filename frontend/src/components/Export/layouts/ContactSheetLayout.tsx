import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { ExportProject, ExportOptions, PageSize } from '../types';
import { PAGE_SIZES } from '../types';

const createStyles = (pageSize: PageSize) => StyleSheet.create({
  page: {
    ...PAGE_SIZES[pageSize],
    backgroundColor: '#ffffff',
    padding: 24,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#B64424',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  // 3 columns x 4 rows = 12 items per page
  tileWrapper: {
    width: '31.5%',
    marginBottom: 4,
  },
  tile: {
    backgroundColor: '#fafafa',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  tileImage: {
    width: '100%',
    height: 90,
    objectFit: 'cover',
    backgroundColor: '#f0f0f0',
  },
  tileContent: {
    padding: 6,
  },
  tileTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  tileArchitect: {
    fontSize: 7,
    color: '#666666',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#999999',
  },
  pageNumber: {
    fontSize: 7,
    color: '#999999',
  },
});

interface ContactSheetLayoutProps {
  projects: ExportProject[];
  options: ExportOptions;
  customTitle?: string;
}

// Chunk projects into groups of 12 for 3x4 grid
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function ContactSheetLayout({ projects, options, customTitle }: ContactSheetLayoutProps) {
  const styles = createStyles(options.pageSize);
  const projectChunks = chunkArray(projects, 12);
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
              {customTitle || 'Reference Collection'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {projects.length} projects · Page {pageIndex + 1} of {totalPages}
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
                      <Text style={styles.tileTitle} numberOfLines={1}>
                        {project.title}
                      </Text>
                    )}
                    {options.includeArchitect && project.architect && (
                      <Text style={styles.tileArchitect} numberOfLines={1}>
                        {project.architect}
                      </Text>
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



