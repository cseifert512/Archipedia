import { useLocation } from "wouter";
import { LensFrame } from "./LensFrame";

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 flex justify-center"
      style={{
        padding: "0",
        paddingBottom: "0",
        zIndex: 50,
      }}
    >
      <div 
        style={{
          width: "75%",
          maxWidth: "75%",
          overflow: "hidden",
        }}
      >
        <LensFrame 
          className="px-14 rounded-t-lg"
          style={{
            paddingTop: "12px",
            paddingBottom: "12px",
          }}
        >
          <div className="flex justify-between items-end">
            <button 
              onClick={() => setLocation("/")}
              className="text-left hover:opacity-70 transition-opacity"
              style={{ 
                fontFamily: "var(--font-primary)", 
                color: "#000000",
                paddingLeft: "24px",
              }}
            >
              <div style={{ fontSize: "26px", fontWeight: 400 }}>
                ARCHIPEDIA
              </div>
              <div style={{ fontSize: "13px", fontWeight: 300 }}>
                by <span className="pear-shimmer" style={{ fontWeight: 600 }}>Pear.Design</span>
              </div>
            </button>

            <button
              onClick={() => setLocation("/enterprise")}
              className="relative hover-underline"
              style={{ 
                fontFamily: "var(--font-primary)",
                fontSize: "18px",
                fontWeight: 300,
                color: "#000000",
                paddingRight: "24px",
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
        
        @keyframes pear-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -100% 0;
          }
        }
        
        .pear-shimmer {
          background: linear-gradient(
            90deg,
            #000000 0%,
            #000000 40%,
            #8BC34A 50%,
            #000000 60%,
            #000000 100%
          );
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: pear-shimmer 5s ease-in-out infinite;
        }
      `}} />
    </footer>
  );
}
