import React from 'react';
import { Document } from '@react-pdf/renderer';
import type { Board, ReferenceBlock, TextBlock } from '../../../stores/boardStore';
import { CoverSlide, ReferenceSlide, TextSlide } from './SlidePage';
import { DocumentPages } from './DocumentPage';

export type ExportMode = 'slides' | 'document';
export type PageSize = 'letter' | 'a4';

interface BoardPDFDocumentProps {
  board: Board;
  mode: ExportMode;
  pageSize?: PageSize;
}

// For slides mode: chunk reference blocks and handle text blocks as full slides
interface SlideContent {
  type: 'references' | 'text';
  references?: ReferenceBlock[];
  textBlock?: TextBlock;
  sectionTitle?: string;
}

function generateSlideContent(board: Board): SlideContent[] {
  const slides: SlideContent[] = [];
  let currentReferences: ReferenceBlock[] = [];
  let currentSectionTitle: string | undefined;

  for (const block of board.blocks) {
    if (block.type === 'text') {
      // Flush any pending references as a slide
      if (currentReferences.length > 0) {
        // Chunk into groups of 4 for 2x2 grid
        while (currentReferences.length > 0) {
          slides.push({
            type: 'references',
            references: currentReferences.splice(0, 4),
            sectionTitle: currentSectionTitle,
          });
          currentSectionTitle = undefined; // Only show on first slide of section
        }
      }

      // Text blocks become their own slides
      slides.push({
        type: 'text',
        textBlock: block,
      });

      // H1/H2 become section titles for following reference slides
      if (block.data.style === 'h1' || block.data.style === 'h2') {
        currentSectionTitle = block.data.text;
      }
    } else if (block.type === 'reference') {
      currentReferences.push(block);
    }
    // Dividers are ignored in slides mode
  }

  // Flush remaining references
  while (currentReferences.length > 0) {
    slides.push({
      type: 'references',
      references: currentReferences.splice(0, 4),
      sectionTitle: currentSectionTitle,
    });
    currentSectionTitle = undefined;
  }

  return slides;
}

export function BoardPDFDocument({ board, mode, pageSize = 'letter' }: BoardPDFDocumentProps) {
  if (mode === 'slides') {
    const slideContent = generateSlideContent(board);
    const totalPages = slideContent.length + 1; // +1 for cover

    return (
      <Document
        title={board.title}
        author="Archipedia"
        subject={board.subtitle || 'Architecture Research Board'}
        keywords="architecture, design, research"
      >
        {/* Cover slide */}
        <CoverSlide
          boardTitle={board.title}
          subtitle={board.subtitle}
          coverImageUrl={board.cover_image_url}
          totalPages={totalPages}
        />

        {/* Content slides */}
        {slideContent.map((slide, index) => {
          const pageNumber = index + 2; // +2 because cover is page 1

          if (slide.type === 'text' && slide.textBlock) {
            return (
              <TextSlide
                key={index}
                block={slide.textBlock}
                boardTitle={board.title}
                pageNumber={pageNumber}
                totalPages={totalPages}
              />
            );
          }

          if (slide.type === 'references' && slide.references) {
            return (
              <ReferenceSlide
                key={index}
                tiles={slide.references}
                boardTitle={board.title}
                sectionTitle={slide.sectionTitle}
                pageNumber={pageNumber}
                totalPages={totalPages}
              />
            );
          }

          return null;
        })}
      </Document>
    );
  }

  // Document mode - flowing A4/Letter layout
  return (
    <Document
      title={board.title}
      author="Archipedia"
      subject={board.subtitle || 'Architecture Research Board'}
      keywords="architecture, design, research"
    >
      <DocumentPages board={board} pageSize={pageSize} />
    </Document>
  );
}

