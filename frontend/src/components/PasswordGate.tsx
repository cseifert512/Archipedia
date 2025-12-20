import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Lock, Unlock, ArrowRight } from "lucide-react";
import { Input } from "./ui/input";

const CORRECT_PASSWORD = "Pear";
const STORAGE_KEY = "demo-unlocked";

type PasswordGateProps = React.PropsWithChildren<{}>;

export function PasswordGate({ children }: PasswordGateProps) {
  const [, setLocation] = useLocation();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleRequestAccess = () => {
    // Navigate to homepage and scroll to contact after a short delay
    setLocation("/");
    setTimeout(() => {
      const contactSection = document.querySelector("#contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Check if already unlocked
  useEffect(() => {
    const unlocked = sessionStorage.getItem(STORAGE_KEY) === "true";
    if (unlocked) {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === CORRECT_PASSWORD) {
      setError(false);
      setIsAnimating(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      
      // Animation duration before showing content
      setTimeout(() => {
        setIsUnlocked(true);
      }, 1200);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Blurred background */}
      <div
        className="absolute inset-0"
        style={{
          background: "var(--bg-primary)",
          backgroundImage: "radial-gradient(circle, #D0D0D0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Animated unlock overlay */}
      {isAnimating && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "var(--accent)",
            animation: "unlockReveal 1.2s ease-out forwards",
          }}
        >
          <Unlock
            size={64}
            style={{
              color: "var(--text-primary)",
              animation: "unlockIcon 0.6s ease-out forwards",
            }}
          />
        </div>
      )}

      {/* Glass overlay card */}
      {!isAnimating && (
        <div
          className={`relative z-10 ${shake ? "animate-shake" : ""}`}
          style={{
            background: "rgba(255, 255, 255, 0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
            maxWidth: "420px",
            width: "90%",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: "rgba(0, 0, 0, 0.05)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <Lock size={28} style={{ color: "var(--text-primary)" }} />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "24px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                marginBottom: "12px",
              }}
            >
              Demo Access
            </h2>
            <p
              style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "15px",
                color: "var(--text-secondary)",
              }}
            >
              Enter the password to access the live demo.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password"
                className="text-center"
                style={{
                  background: "rgba(255, 255, 255, 0.6)",
                  border: error ? "2px solid #e53935" : "1px solid rgba(0, 0, 0, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontSize: "16px",
                  fontFamily: "var(--font-secondary)",
                }}
                autoFocus
              />
              {error && (
                <p
                  style={{
                    fontFamily: "var(--font-secondary)",
                    fontSize: "13px",
                    color: "#e53935",
                    marginTop: "8px",
                    textAlign: "center",
                  }}
                >
                  Incorrect password. Try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full hover:opacity-90 transition-all flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "14px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "12px",
                background: "var(--accent)",
                padding: "16px 24px",
                color: "var(--text-primary)",
              }}
            >
              Unlock Demo
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-secondary)",
                fontSize: "13px",
                color: "var(--text-tertiary)",
                marginBottom: "12px",
              }}
            >
              Don't have access yet?
            </p>
            <button
              onClick={handleRequestAccess}
              className="inline-block hover:opacity-90 transition-all"
              style={{
                fontFamily: "var(--font-primary)",
                fontSize: "12px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                borderRadius: "10px",
                border: "1px solid var(--border-light)",
                background: "transparent",
                padding: "12px 20px",
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              Request Access
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes unlockReveal {
            0% {
              clip-path: circle(0% at 50% 50%);
              opacity: 1;
            }
            50% {
              clip-path: circle(15% at 50% 50%);
              opacity: 1;
            }
            100% {
              clip-path: circle(150% at 50% 50%);
              opacity: 0;
            }
          }
          
          @keyframes unlockIcon {
            0% {
              transform: scale(0.5) rotate(-20deg);
              opacity: 0;
            }
            50% {
              transform: scale(1.2) rotate(5deg);
              opacity: 1;
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }
          
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-10px); }
            80% { transform: translateX(10px); }
          }
        `
      }} />
    </div>
  );
}

