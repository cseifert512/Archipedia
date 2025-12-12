//This component is used for the Brick Gallery on the Project Detail Page, 
//which displays the images of the project in a grid of bricks.

import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface BrickImage {
  url: string;
  title?: string;
  caption?: string;
  ratio?: "portrait" | "landscape" | "square";
}

interface BrickGalleryProps {
  images: BrickImage[];
  onImageClick?: (image: BrickImage, index: number) => void;
}

export function BrickGallery({ images, onImageClick }: BrickGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="w-full px-8 pb-40">
      <div 
        className="max-w-[var(--container-max)] mx-auto"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "12px",
          gridAutoFlow: "dense"
        }}
      >
        {images.map((image, index) => {
          const spanClass = image.ratio === "landscape" ? "col-span-2" : "";
          const rowSpan = image.ratio === "portrait" ? "row-span-2" : "";
          
          return (
            <button
              key={index}
              onClick={() => onImageClick?.(image, index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`relative overflow-hidden bg-[var(--bg-neutral)] transition-all duration-250 ${spanClass} ${rowSpan}`}
              style={{
                aspectRatio: 
                  image.ratio === "landscape" ? "16/9" : 
                  image.ratio === "portrait" ? "3/4" : 
                  "1/1",
                transform: hoveredIndex === index ? "scale(1.03)" : "scale(1)",
                minHeight: "180px"
              }}
            >
              <ImageWithFallback
                src={image.url}
                alt={image.title || ""}
                className="w-full h-full object-cover"
                style={{
                  opacity: hoveredIndex === index ? 0.9 : 1,
                  transition: "opacity 250ms ease-out"
                }}
              />
              
              {/* Hover overlay with caption */}
              {hoveredIndex === index && (image.title || image.caption) && (
                <div 
                  className="absolute inset-0 flex items-end p-4 pointer-events-none animate-fadeIn"
                  style={{
                    background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%)",
                  }}
                >
                  <div>
                    {image.title && (
                      <p className="body-l text-white">{image.title}</p>
                    )}
                    {image.caption && (
                      <p className="caption text-white/80 mt-1">{image.caption}</p>
                    )}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 250ms ease-out;
        }
      `}} />
    </div>
  );
}