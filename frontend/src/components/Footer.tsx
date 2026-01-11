import { useLocation } from "wouter";
import { LensFrame } from "./LensFrame";

interface FooterProps {
  variant?: "default" | "minimal";
  logoLink?: string;
}

export function Footer({ variant = "default", logoLink = "/" }: FooterProps) {
  const [, setLocation] = useLocation();

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 flex justify-center"
      style={{
        padding: "0",
        paddingBottom: "4px",
        zIndex: 50,
      }}
    >
      <div 
        style={{
          width: variant === "minimal" ? "25%" : "35%",
          maxWidth: variant === "minimal" ? "280px" : "360px",
          minWidth: variant === "minimal" ? "180px" : "240px",
          overflow: "hidden",
        }}
      >
        <LensFrame 
          className="px-2 rounded-t-lg"
          style={{
            paddingTop: "2px",
            paddingBottom: "2px",
          }}
        >
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setLocation(logoLink)}
              className="text-left hover:opacity-70 transition-opacity"
              style={{ 
                fontFamily: "var(--font-primary)", 
                color: "#000000",
                paddingLeft: "4px",
              }}
            >
              <div style={{ fontSize: variant === "minimal" ? "7px" : "8px", fontWeight: 400 }}>
                ARCHIPEDIA
              </div>
              <div style={{ fontSize: variant === "minimal" ? "5px" : "6px", fontWeight: 300 }}>
                PEAR.DESIGN
              </div>
            </button>

            <button
              onClick={() => setLocation("/enterprise")}
              className="relative hover-underline"
              style={{ 
                fontFamily: "var(--font-primary)",
                fontSize: variant === "minimal" ? "5px" : "6px",
                fontWeight: 300,
                color: "#000000",
                paddingRight: "4px",
              }}
            >
              Curious?
            </button>
          </div>
        </LensFrame>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hover-underline::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0%;
          height: 1px;
          background-color: var(--accent);
          transition: width 200ms ease;
          transform: translateX(-50%);
        }
        .hover-underline:hover::after { width: 100%; }
      `}} />
    </footer>
  );
}
