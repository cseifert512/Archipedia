import React from "react";
import { Header } from "../components/Header";
import { Link } from "wouter";

export function EmptyResultsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header variant="minimal" />
      
      <main className="max-w-[var(--container-max)] mx-auto px-8 py-[var(--space-xl)]">
        <div className="text-center">
          <h1 className="heading-m mb-4">NO RESULTS FOUND</h1>
          <p className="body-l text-[var(--text-secondary)] mb-8">
            Try adjusting your search terms
          </p>
          
          <Link href="/">
            <span className="inline-block px-8 py-3 border border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-white transition-colors caption cursor-pointer">
              Return to search
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}