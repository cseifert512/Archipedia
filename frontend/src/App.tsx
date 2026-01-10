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
import { StudySearchPage } from "./pages/StudySearchPage";
import { StudyResultsPage } from "./pages/StudyResultsPage";
import { ContactPage } from "./pages/ContactPage";
import { SignInPage } from "./pages/SignInPage";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white">
      <Switch>
        {/* Simple search landing page is now the default homepage */}
        <Route path="/" component={SearchLandingPage} />
        {/* Enterprise page shows the full marketing/landing content */}
        <Route path="/enterprise" component={LandingPage} />
        <Route path="/demo" component={DemoPage} />
        {/* Original enterprise page still accessible at /enterprise-details */}
        <Route path="/enterprise-details" component={EnterprisePage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/signin" component={SignInPage} />
        <Route path="/search" component={SearchLandingPage} />
        <Route path="/search/classic" component={ClassicSearchPage} />
        <Route path="/canvas" component={ResultsPage} />
        <Route path="/search/text" component={TextSearchPage} />
        <Route path="/search/image" component={ImageSearchPage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/empty" component={EmptyResultsPage} />
        <Route path="/project/:id" component={ProjectDetailPage} />
        {/* Anonymous Study Routes - No branding for academic research */}
        <Route path="/study" component={StudySearchPage} />
        <Route path="/study/results" component={StudyResultsPage} />
        {/* Board Routes */}
        <Route path="/boards/:id/edit" component={BoardEditPage} />
        <Route path="/boards/:id/print" component={BoardPrintPage} />
        <Route path="/boards/:id" component={BoardViewPage} />
        <Route path="/b/:token" component={BoardSharePage} />
        <Route>
          <SearchLandingPage />
        </Route>
      </Switch>
      <Toaster />
    </div>
    </ErrorBoundary>
  );
}
