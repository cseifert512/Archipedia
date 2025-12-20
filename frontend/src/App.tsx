import React from "react";
import { Route, Switch } from "wouter";
import { LandingPage } from "./pages/LandingPage";
import { DemoPage } from "./pages/DemoPage";
import { TextSearchPage } from "./pages/TextSearchPage";
import { ImageSearchPage } from "./pages/ImageSearchPage";
import { ResultsPage } from "./pages/ResultsPage";
import { EmptyResultsPage } from "./pages/EmptyResultsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { EnterprisePage } from "./pages/enterprise";
import { ClassicSearchPage } from "./pages/ClassicSearchPage";
import { SearchLandingPage } from "./pages/SearchLandingPage";
import { BoardViewPage } from "./pages/BoardViewPage";
import { BoardEditPage } from "./pages/BoardEditPage";
import { BoardSharePage } from "./pages/BoardSharePage";
import { BoardPrintPage } from "./pages/BoardPrintPage";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PasswordGate } from "./components/PasswordGate";

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white">
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/demo" component={DemoPage} />
        <Route path="/enterprise" component={EnterprisePage} />
        <Route path="/search" component={SearchLandingPage} />
        <Route path="/search/classic" component={ClassicSearchPage} />
        <Route path="/canvas">
          <PasswordGate>
            <ResultsPage />
          </PasswordGate>
        </Route>
        <Route path="/search/text" component={TextSearchPage} />
        <Route path="/search/image" component={ImageSearchPage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/empty" component={EmptyResultsPage} />
        <Route path="/project/:id" component={ProjectDetailPage} />
        {/* Board Routes */}
        <Route path="/boards/:id/edit" component={BoardEditPage} />
        <Route path="/boards/:id/print" component={BoardPrintPage} />
        <Route path="/boards/:id" component={BoardViewPage} />
        <Route path="/b/:token" component={BoardSharePage} />
        <Route>
          <LandingPage />
        </Route>
      </Switch>
      <Toaster />
    </div>
    </ErrorBoundary>
  );
}
