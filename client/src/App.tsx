import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JWTAuthProvider, useJWTAuth } from "./features/auth";
import { ThemeProvider } from "./hooks/use-theme";
import { ProtectedRoute } from "./lib/protected-route";
import { ErrorBoundary, RouteErrorBoundary } from "@/components/error-boundary";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { AasxManagerPage } from "@/pages/aasx-manager-page";
import { AasViewerPage } from "@/pages/aas-viewer-page";
import { DictionaryBrowserPage } from "@/pages/dictionary-browser-page";
import ProfilePage from "@/pages/profile-page";
import PreferencesPage from "@/pages/preferences-page";
import WorkspacesPage from "@/pages/workspaces-page";
import HelpPage from "@/pages/help-page";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { usePageObservability } from "@/hooks/use-observability";
import { initializeObservability } from "@/features/observability";
import { useEffect } from "react";
import { HelpDialog } from "@/features/aas-explorer/components/help-dialog";
import { useHelpSystem } from "@/features/aas-explorer/hooks/use-help-system";

function HomePage() {
  const { isLoading } = useJWTAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="max-w-2xl w-full px-8 space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              RE-Eclipse AASX Web
            </h1>
            <p className="text-lg text-muted-foreground">
              Asset Administration Shell Package Explorer
            </p>
          </div>
          
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 border rounded-lg bg-card">
              <div className="font-semibold text-primary mb-2">🇫🇷 CEA-List, France</div>
              <p className="text-muted-foreground text-xs">
                Developed at CEA-List, a leading French research institute in 
                digital technologies, including software and systems engineering for Industry 4.0 / 5.0.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <div className="font-semibold text-primary mb-2">🏭 Eclipse AASX Project</div>
              <p className="text-muted-foreground text-xs">
                Based on Eclipse AASX Package Explorer, re-engineered for 
                modern web platforms with full AAS V3 compliance.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <div className="font-semibold text-primary mb-2">🇪🇺 RAASCEMAN Project</div>
              <p className="text-muted-foreground text-xs">
                Part of the European RAASCEMAN initiative advancing 
                Asset Administration Shell standards for interoperability.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-card">
              <div className="font-semibold text-primary mb-2">♻️ CIR4FUN Project</div>
              <p className="text-muted-foreground text-xs">
                Supporting circular economy and functional integration 
                through digital twin technologies and AAS frameworks.
              </p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Initializing application...
          </p>
        </div>
      </div>
    );
  }

  // Always show landing page first - users can navigate from there
  return <LandingPage />;
}

function Router() {
  return (
    <RouteErrorBoundary>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/landing" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/aasx-manager" component={AasxManagerPage} />
        <ProtectedRoute path="/aas-viewer" component={AasViewerPage} />
        <ProtectedRoute path="/dictionary" component={DictionaryBrowserPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/profile/preferences" component={PreferencesPage} />
        <ProtectedRoute path="/workspaces" component={WorkspacesPage} />
        <ProtectedRoute path="/help" component={HelpPage} />
        <Route component={NotFound} />
      </Switch>
    </RouteErrorBoundary>
  );
}

function App() {
  const pageObservability = usePageObservability('App');
  const { isOpen, closeHelp } = useHelpSystem({ enableF1: true });

  useEffect(() => {
    // Initialize observability system with file logging enabled for testing
    initializeObservability({
      logLevel: 'debug',
      enableConsoleLogging: true,
      features: {
        enableFileLogging: true, // 🔥 Force enable file logging
        enablePerformanceMonitoring: true,
        enableGlobalErrorHandling: true,
        enableTracing: true,
        enableMetrics: true,
      },
      fileLogging: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      },
    });
    
    // Track app initialization
    pageObservability.trackPageInteraction('app_initialization');
  }, [pageObservability]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <JWTAuthProvider>
              <Router />
              <Toaster />
              <HelpDialog isOpen={isOpen} onClose={closeHelp} />
            </JWTAuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
