import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const imageDatabase = [
  {
    id: "perforated-facade",
    url: "https://images.unsplash.com/photo-1654371404345-845d8aa147f3?w=600",
    description: "Perforated facade with parametric openings"
  },
  {
    id: "museum-courtyard",
    url: "https://images.unsplash.com/photo-1730145268935-34c1d833bb98?w=600",
    description: "Museum courtyard with natural light integration"
  },
  {
    id: "brutalist-concrete",
    url: "https://images.unsplash.com/photo-1677161795040-7cf4d7007312?w=600",
    description: "Brutalist concrete surface texture detail"
  },
  {
    id: "scandinavian-timber",
    url: "https://images.unsplash.com/photo-1606229325385-64ea02124b76?w=600",
    description: "Scandinavian timber construction joinery"
  },
  {
    id: "library-interior",
    url: "https://images.unsplash.com/photo-1649605475592-4ab5956a21c0?w=600",
    description: "Contemporary library interior spatial arrangement"
  },
  {
    id: "modular-facade",
    url: "https://images.unsplash.com/photo-1699791910411-6c9ea7f47b3a?w=600",
    description: "Modular facade system with repetitive elements"
  },
  {
    id: "palace-courtyard",
    url: "https://images.unsplash.com/photo-1565551045797-c0b918d88202?w=600",
    description: "Renaissance palace courtyard symmetry"
  },
  {
    id: "classical-colonnade",
    url: "https://images.unsplash.com/photo-1604067342128-91f5dd062f0f?w=600",
    description: "Classical colonnade with stone capitals"
  },
  {
    id: "art-deco-facade",
    url: "https://images.unsplash.com/photo-1635722784047-8c2c489df874?w=600",
    description: "Art Deco geometric facade ornament"
  },
  {
    id: "gothic-cathedral",
    url: "https://images.unsplash.com/photo-1708388185105-4d83d2dece17?w=600",
    description: "Gothic cathedral vaulted ceiling structure"
  },
  {
    id: "curtain-wall",
    url: "https://images.unsplash.com/photo-1582719478170-2ba9c81b11b6?w=600",
    description: "Modernist glass curtain wall detail"
  },
  {
    id: "brick-warehouse",
    url: "https://images.unsplash.com/photo-1613545326706-0299f91e2d19?w=600",
    description: "Industrial brick warehouse adaptive reuse"
  },
  {
    id: "steel-frame",
    url: "https://images.unsplash.com/photo-1693854037786-912979e653eb?w=600",
    description: "High-rise steel frame construction sequence"
  },
  {
    id: "bauhaus-design",
    url: "https://images.unsplash.com/photo-1558087060-3972a0d08fb4?w=600",
    description: "Bauhaus functionalist design principles"
  },
  {
    id: "terracotta-details",
    url: "https://images.unsplash.com/photo-1677207857573-cf0743756077?w=600",
    description: "Victorian ornamental terracotta details"
  },
];

interface ScrollingImage {
  id: string;
  url: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  speed: number;
}

export function Homepage() {
  const [images, setImages] = useState<ScrollingImage[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, setLocation] = useLocation();
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate initial images with irregular sizes
  useEffect(() => {
    const newImages: ScrollingImage[] = [];
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Create enough images to fill and scroll
    let currentX = -200; // Start off-screen left
    let currentY = 200; // Start below header
    
    for (let i = 0; i < 30; i++) {
      const index = i % imageDatabase.length;
      const baseWidth = 200 + Math.random() * 300; // 200-500px width
      const aspectRatio = 0.7 + Math.random() * 0.6; // 0.7-1.3 aspect ratio
      const height = baseWidth * aspectRatio;
      
      // Random vertical position within viewport
      const maxY = viewportHeight - height - 200; // Leave space for footer
      currentY = 200 + Math.random() * Math.max(0, maxY - 200);
      
      newImages.push({
        ...imageDatabase[index],
        x: currentX,
        y: currentY,
        width: baseWidth,
        height: height,
        rotation: (Math.random() - 0.5) * 8, // -4 to +4 degrees
        opacity: 0.7 + Math.random() * 0.3, // 0.7-1.0
        speed: 0.3 + Math.random() * 0.4, // 0.3-0.7 px per frame
      });
      
      // Space images horizontally with some overlap
      currentX += baseWidth * 0.7 + Math.random() * 100;
    }
    
    setImages(newImages);
  }, [refreshKey]);

  // Animate left-to-right scrolling
  useEffect(() => {
    const animate = () => {
      setImages(prevImages => {
        const viewportWidth = window.innerWidth;
        const marginRight = viewportWidth * 0.125;
        
        return prevImages.map(img => {
          let newX = img.x + img.speed;
          
          // Reset to left side when it goes off-screen right
          if (newX > viewportWidth + marginRight) {
            newX = -img.width - 200;
            // Randomize vertical position on reset
            const viewportHeight = window.innerHeight;
            const maxY = viewportHeight - img.height - 200;
            img.y = 200 + Math.random() * Math.max(0, maxY - 200);
          }
          
          return {
            ...img,
            x: newX,
          };
        });
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSearch = (query: string, image: string | null) => {
    // Landing page behavior: always enter the canvas experience.
    // If the user provided a query/image, preserve it in the URL.
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    if (image) params.set('type', 'image');
    const qs = params.toString();
    setLocation(qs ? `/canvas?${qs}` : "/canvas");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Header with search */}
      <Header onSearch={handleSearch} onRefresh={handleRefresh} showRefresh={true} />

      {/* Main content */}
      <main
        ref={containerRef}
              style={{
          paddingTop: "80px", // Reduced from 140px - lower hero text
          paddingBottom: "140px", // Space for footer
          position: "relative",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Hero Section - Lowered */}
        <div 
          className="text-center"
          style={{
            marginTop: "120px", // Lower placement below search bar
            marginBottom: "60px",
            paddingLeft: "12.5%",
            paddingRight: "12.5%",
            position: "relative",
            zIndex: 5,
          }}
        >
            <h1 
              style={{
                fontFamily: "var(--font-primary)",
              fontSize: "32px", // Reduced from 42px
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              marginBottom: "8px", // Reduced from 12px
                letterSpacing: "-0.02em",
              }}
            >
              Find your next architectural inspiration
            </h1>
            <p
              style={{
                fontFamily: "var(--font-primary)",
              fontSize: "16px", // Reduced from 19px
                fontWeight: 300,
                color: "rgba(0,0,0,0.7)",
                margin: 0,
              }}
            >
              Search by description, upload an image, or both to discover relevant projects.
            </p>
          </div>

        {/* Scrolling Images Container */}
          <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            paddingLeft: "12.5%", // Respect margin
            paddingRight: "12.5%", // Respect margin
            overflow: "hidden",
          }}
        >
          {/* Left blur gradient - blur in (fade from transparent to blurred) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "12.5%",
              width: "200px",
              height: "100%",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              maskImage: "linear-gradient(to right, transparent 0%, transparent 10%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 95%, rgba(0,0,0,1) 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 10%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 95%, rgba(0,0,0,1) 100%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />

          {/* Right blur gradient - blur out (fade from blurred to transparent) */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: "12.5%",
              width: "200px",
              height: "100%",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              maskImage: "linear-gradient(to left, transparent 0%, transparent 10%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 95%, rgba(0,0,0,1) 100%)",
              WebkitMaskImage: "linear-gradient(to left, transparent 0%, transparent 10%, rgba(0,0,0,0.15) 25%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 95%, rgba(0,0,0,1) 100%)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />

          {/* Scrolling images */}
          {images.map((img, index) => (
            <div
              key={`${img.id}-${index}-${refreshKey}`}
              className="group absolute"
              style={{
                left: `${img.x}px`,
                top: `${img.y}px`,
                width: `${img.width}px`,
                height: `${img.height}px`,
                transform: `rotate(${img.rotation}deg)`,
                opacity: img.opacity,
                transition: "opacity 0.3s ease",
                cursor: "pointer",
                zIndex: 1,
              }}
              onClick={() => {
                // Navigate to canvas with the image URL to create an image node
                setLocation(`/canvas?image=${encodeURIComponent(img.url)}`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = `rotate(${img.rotation}deg) scale(1.05)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = `${img.opacity}`;
                e.currentTarget.style.transform = `rotate(${img.rotation}deg) scale(1)`;
              }}
            >
              <img
                src={img.url}
                alt={img.description}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              />

              {/* Hover overlay */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "20px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-primary)",
                    fontSize: "14px",
                    color: "#FFFFFF",
                    margin: 0,
                    fontWeight: 300,
                  }}
                >
                  {img.description}
                </p>
              </div>
          </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
