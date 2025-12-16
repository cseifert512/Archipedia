import { Route, Switch } from "wouter";
import { Homepage } from "./pages/Homepage";
import { TextSearchPage } from "./pages/TextSearchPage";
import { ImageSearchPage } from "./pages/ImageSearchPage";
import { ResultsPage } from "./pages/ResultsPage";
import { EmptyResultsPage } from "./pages/EmptyResultsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { EnterprisePage } from "./pages/enterprise";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-white">
      <Switch>
        <Route path="/" component={Homepage} />
        <Route path="/enterprise" component={EnterprisePage} />
        <Route path="/canvas" component={ResultsPage} />
        <Route path="/search/text" component={TextSearchPage} />
        <Route path="/search/image" component={ImageSearchPage} />
        <Route path="/results" component={ResultsPage} />
        <Route path="/empty" component={EmptyResultsPage} />
        <Route path="/project/:id" component={ProjectDetailPage} />
        <Route>
          <Homepage />
        </Route>
      </Switch>
      <Toaster />
    </div>
    </ErrorBoundary>
  );
}
