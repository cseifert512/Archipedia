import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Board, BoardBlock, ReferenceBlock, TextBlock, DividerBlock } from '../../../stores/boardStore';

type PageSize = 'letter' | 'a4';

const PAGE_SIZES = {
  letter: { width: 612, height: 792 }, // 8.5" x 11" in points
  a4: { width: 595, height: 842 },     // 210mm x 297mm in points
};

const createStyles = (pageSize: PageSize) => StyleSheet.create({
  page: {
    ...PAGE_SIZES[pageSize],
    backgroundColor: '#ffffff',
    padding: 48,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  boardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  boardSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tileWrapper: {
    width: '31%',
    marginBottom: 12,
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
    height: 100,
    objectFit: 'cover',
  },
  tileContent: {
    padding: 8,
  },
  tileTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  tileArchitect: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  tileLocation: {
    fontSize: 7,
    color: '#888888',
  },
  tileCaption: {
    fontSize: 7,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  // Text block styles
  textH1: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#B64424',
  },
  textH2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  textBody: {
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
    marginBottom: 12,
  },
  textQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#666666',
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#B64424',
    marginVertical: 12,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  dividerSpaceSm: {
    height: 12,
  },
  dividerSpaceLg: {
    height: 24,
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

interface DocumentPageProps {
  board: Board;
  pageSize: PageSize;
}

// Helper to chunk reference blocks for grid layout
function chunkReferences(blocks: ReferenceBlock[], size: number): ReferenceBlock[][] {
  const chunks: ReferenceBlock[][] = [];
  for (let i = 0; i < blocks.length; i += size) {
    chunks.push(blocks.slice(i, i + size));
  }
  return chunks;
}

// Group blocks by sections (split on h1/h2 text blocks)
interface Section {
  header?: TextBlock;
  blocks: BoardBlock[];
}

function groupBlocksIntoSections(blocks: BoardBlock[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section = { blocks: [] };

  for (const block of blocks) {
    if (block.type === 'text' && (block.data.style === 'h1' || block.data.style === 'h2')) {
      // Start a new section
      if (currentSection.blocks.length > 0 || currentSection.header) {
        sections.push(currentSection);
      }
      currentSection = { header: block, blocks: [] };
    } else {
      currentSection.blocks.push(block);
    }
  }

  // Push the last section
  if (currentSection.blocks.length > 0 || currentSection.header) {
    sections.push(currentSection);
  }

  return sections;
}

function renderBlock(block: BoardBlock, styles: ReturnType<typeof createStyles>, key: string) {
  switch (block.type) {
    case 'reference':
      return (
        <View key={key} style={styles.tileWrapper}>
          <View style={styles.tile}>
            {block.data.thumb_url_snapshot && (
              <Image 
                src={block.data.thumb_url_snapshot} 
                style={styles.tileImage}
              />
            )}
            <View style={styles.tileContent}>
              <Text style={styles.tileTitle}>{block.data.title_snapshot}</Text>
              {block.data.architect_snapshot && (
                <Text style={styles.tileArchitect}>{block.data.architect_snapshot}</Text>
              )}
              {block.data.location_snapshot && (
                <Text style={styles.tileLocation}>
                  {block.data.location_snapshot}
                  {block.data.year_snapshot && ` • ${block.data.year_snapshot}`}
                </Text>
              )}
              {block.data.caption && (
                <Text style={styles.tileCaption}>{block.data.caption}</Text>
              )}
            </View>
          </View>
        </View>
      );

    case 'text':
      const textStyle = {
        h1: styles.textH1,
        h2: styles.textH2,
        body: styles.textBody,
        quote: styles.textQuote,
      }[block.data.style] || styles.textBody;
      return (
        <Text key={key} style={textStyle}>{block.data.text}</Text>
      );

    case 'divider':
      const dividerStyle = {
        line: styles.dividerLine,
        'space-sm': styles.dividerSpaceSm,
        'space-lg': styles.dividerSpaceLg,
      }[block.data.variant] || styles.dividerLine;
      return (
        <View key={key} style={dividerStyle} />
      );

    default:
      return null;
  }
}

export function DocumentPages({ board, pageSize }: DocumentPageProps) {
  const styles = createStyles(pageSize);
  const sections = groupBlocksIntoSections(board.blocks);

  // For now, render all content on pages with natural flow
  // react-pdf handles page breaks automatically
  return (
    <>
      {/* Cover / First Page */}
      <Page size={pageSize.toUpperCase() as 'LETTER' | 'A4'} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.boardTitle}>{board.title}</Text>
          {board.subtitle && <Text style={styles.boardSubtitle}>{board.subtitle}</Text>}
        </View>

        {board.cover_image_url && (
          <View style={{ marginBottom: 24, borderRadius: 8, overflow: 'hidden' }}>
            <Image src={board.cover_image_url} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
          </View>
        )}

        {board.description && (
          <Text style={styles.textBody}>{board.description}</Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated with Archipedia</Text>
          <Text style={styles.footerText}>
            {new Date(board.updated_at).toLocaleDateString()}
          </Text>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size={pageSize.toUpperCase() as 'LETTER' | 'A4'} style={styles.page} wrap>
        <View style={styles.content}>
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex} wrap={false}>
              {/* Section header */}
              {section.header && renderBlock(section.header, styles, `header-${sectionIndex}`)}
              
              {/* Reference blocks in grid */}
              {(() => {
                const refs = section.blocks.filter((b): b is ReferenceBlock => b.type === 'reference');
                const others = section.blocks.filter((b) => b.type !== 'reference');
                
                return (
                  <>
                    {/* Non-reference blocks */}
                    {others.map((block, i) => renderBlock(block, styles, `block-${sectionIndex}-${i}`))}
                    
                    {/* Reference blocks in grid */}
                    {refs.length > 0 && (
                      <View style={styles.grid}>
                        {refs.map((ref, i) => renderBlock(ref, styles, `ref-${sectionIndex}-${i}`))}
                      </View>
                    )}
                  </>
                );
              })()}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated with Archipedia</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </>
  );
}

