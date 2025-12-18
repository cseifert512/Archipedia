import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";
import { initAnalytics } from "./lib/analytics";

// Initialize PostHog analytics
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);