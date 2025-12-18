import { Route, Switch } from "wouter";
import { LandingPage } from "./pages/LandingPage";
import { DemoPage } from "./pages/DemoPage";
import { TextSearchPage } from "./pages/TextSearchPage";
import { ImageSearchPage } from "./pages/ImageSearchPage";
import { ResultsPage } from "./pages/ResultsPage";
import { EmptyResultsPage } from "./pages/EmptyResultsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { EnterprisePage } from "./pages/enterprise";
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
        <Route>
          <LandingPage />
        </Route>
      </Switch>
      <Toaster />
    </div>
    </ErrorBoundary>
  );
}
