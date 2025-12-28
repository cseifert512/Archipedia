import React from 'react';
import { Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { ReferenceBlock, TextBlock } from '../../../stores/boardStore';

// 16:9 slide dimensions (in points, 72 points = 1 inch)
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

const styles = StyleSheet.create({
  page: {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    backgroundColor: '#ffffff',
    padding: 48,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: '#B64424',
    paddingBottom: 16,
  },
  boardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: 'normal',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'flex-start',
  },
  tileWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  tile: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
  },
  tileContent: {
    padding: 12,
  },
  tileTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tileArchitect: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  tileCaption: {
    fontSize: 10,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 6,
  },
  // Text slide styles
  textSlide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 80,
  },
  textH1: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  textH2: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  textBody: {
    fontSize: 24,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  textQuote: {
    fontSize: 28,
    fontStyle: 'italic',
    color: '#666666',
    textAlign: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#B64424',
    paddingLeft: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#999999',
  },
  pageNumber: {
    fontSize: 10,
    color: '#999999',
  },
});

interface ReferenceSlideProps {
  tiles: ReferenceBlock[];
  boardTitle: string;
  sectionTitle?: string;
  pageNumber: number;
  totalPages: number;
}

export function ReferenceSlide({ tiles, boardTitle, sectionTitle, pageNumber, totalPages }: ReferenceSlideProps) {
  return (
    <Page size={[SLIDE_WIDTH, SLIDE_HEIGHT]} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.boardTitle}>{boardTitle}</Text>
        {sectionTitle && <Text style={styles.sectionTitle}>{sectionTitle}</Text>}
      </View>
      
      <View style={styles.grid}>
        {tiles.slice(0, 4).map((tile) => (
          <View key={tile.id} style={styles.tileWrapper}>
            <View style={styles.tile}>
              {tile.data.thumb_url_snapshot && (
                <Image 
                  src={tile.data.thumb_url_snapshot} 
                  style={styles.tileImage}
                />
              )}
              <View style={styles.tileContent}>
                <Text style={styles.tileTitle}>{tile.data.title_snapshot}</Text>
                {tile.data.architect_snapshot && (
                  <Text style={styles.tileArchitect}>{tile.data.architect_snapshot}</Text>
                )}
                {tile.data.caption && (
                  <Text style={styles.tileCaption}>{tile.data.caption}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated with Archipedia</Text>
        <Text style={styles.pageNumber}>{pageNumber} / {totalPages}</Text>
      </View>
    </Page>
  );
}

interface TextSlideProps {
  block: TextBlock;
  boardTitle: string;
  pageNumber: number;
  totalPages: number;
}

export function TextSlide({ block, boardTitle, pageNumber, totalPages }: TextSlideProps) {
  const getTextStyle = () => {
    switch (block.data.style) {
      case 'h1': return styles.textH1;
      case 'h2': return styles.textH2;
      case 'quote': return styles.textQuote;
      default: return styles.textBody;
    }
  };

  return (
    <Page size={[SLIDE_WIDTH, SLIDE_HEIGHT]} style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.boardTitle}>{boardTitle}</Text>
      </View>
      
      <View style={styles.textSlide}>
        <Text style={getTextStyle()}>{block.data.text}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated with Archipedia</Text>
        <Text style={styles.pageNumber}>{pageNumber} / {totalPages}</Text>
      </View>
    </Page>
  );
}

interface CoverSlideProps {
  boardTitle: string;
  subtitle?: string;
  coverImageUrl?: string;
  totalPages: number;
}

export function CoverSlide({ boardTitle, subtitle, coverImageUrl, totalPages }: CoverSlideProps) {
  return (
    <Page size={[SLIDE_WIDTH, SLIDE_HEIGHT]} style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
      {coverImageUrl && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15 }}>
          <Image src={coverImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </View>
      )}
      
      <View style={{ alignItems: 'center', zIndex: 1 }}>
        <Text style={{ fontSize: 56, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16, textAlign: 'center' }}>
          {boardTitle}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 24, color: '#666666', textAlign: 'center' }}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Generated with Archipedia</Text>
        <Text style={styles.pageNumber}>1 / {totalPages}</Text>
      </View>
    </Page>
  );
}

