import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";
import { initAnalytics } from "./lib/analytics";

// Initialize PostHog analytics
initAnalytics();

// Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Render app with or without Clerk based on key availability
if (CLERK_PUBLISHABLE_KEY) {
  createRoot(document.getElementById("root")!).render(
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  );
} else {
  // Development fallback: render without auth
  console.warn("VITE_CLERK_PUBLISHABLE_KEY not set. Auth features disabled.");
  createRoot(document.getElementById("root")!).render(<App />);
}