import React, { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "../components/Header";
import { Textarea } from "../components/ui/textarea";

const exampleChips = [
  "Museums with courtyards",
  "Timber construction schools",
  "Waterfront adaptive reuse",
  "Brutalist housing complexes",
  "Contemporary libraries",
];

export function TextSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleChipClick = (chip: string) => {
    setSearchQuery(chip);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header variant="minimal" />
      
      <main className="max-w-[var(--container-max)] mx-auto px-8 py-[var(--space-xl)]">
        <div className="max-w-[800px] mx-auto">
          <h1 className="heading-m text-center mb-[var(--space-l)]">DESCRIBE YOUR PROJECT</h1>
          
          <Textarea
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., Contemporary library with natural ventilation in Southeast Asia…"
            className="w-full min-h-[120px] border border-[var(--border-light)] p-4 body-m resize-none focus:outline-none focus:border-[var(--accent)] bg-transparent"
          />
          
          <div className="mt-6 text-center">
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="px-8 py-3 bg-[var(--text-primary)] text-white caption hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              SEARCH
            </button>
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {exampleChips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleChipClick(chip)}
                className="px-4 py-2 border border-[var(--border-light)] caption hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
