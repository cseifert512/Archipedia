import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";
import { Link } from "wouter";

interface ProjectCardProps {
  id: string;
  name: string;
  architect: string;
  location: string;
  year: string;
  matchPercentage?: number;
  imageUrl: string;
  keywords?: string[];
  onCardClick?: (id: string) => void;
}

export function ProjectCard({
  id,
  name,
  architect,
  location,
  year,
  matchPercentage,
  imageUrl,
  keywords = [],
  onCardClick,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/project/${id}`}>
      <button 
        className="w-full group overflow-hidden bg-[var(--bg-neutral)] transition-all duration-250 hover:scale-[1.02]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onCardClick?.(id)}
      >
        <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
          <ImageWithFallback
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
          
          {/* Hover overlay */}
          <div 
            className="absolute inset-0 transition-opacity duration-250"
            style={{
              opacity: isHovered ? 1 : 0,
              background: "rgba(0,0,0,0.1)"
            }}
          />
          
          {matchPercentage && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-[var(--text-primary)] text-white caption">
              {matchPercentage}%
            </div>
          )}
        </div>
        
        <div className="p-4 bg-white text-left">
          <h3 className="body-l mb-1">{name}</h3>
          <p className="caption mb-2">{architect}</p>
          
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {keywords.slice(0, 3).map((keyword, index) => (
                <span key={index} className="caption bg-[var(--bg-neutral)] px-2 py-1">
                  {keyword}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <span className="caption">{location}</span>
            <span className="caption">•</span>
            <span className="caption">{year}</span>
          </div>
        </div>
      </button>
    </Link>
  );
}
