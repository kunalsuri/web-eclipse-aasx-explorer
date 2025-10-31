import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJWTAuth } from "@/features/auth";
import { useEffect } from "react";
import {
  Code,
  Rocket,
  Github,
  FolderTree,
  ShieldCheck,
  Palette,
  Database,
  Smartphone,
  Zap,
  Folder,
  Globe,
  Server,
  Package,
  User,
  Component,
  Twitter,
  BookOpen,
} from "lucide-react";

export default function LandingPage() {
  const { user, isLoading } = useJWTAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Code className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold">RE-Eclipse AASX Web</span>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#architecture" className="text-muted-foreground hover:text-foreground transition-colors">
                Architecture
              </a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </a>
              <a href="https://github.com/eclipse-esmf/aasx-package-explorer" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm" data-testid="button-dashboard">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="ghost" size="sm" data-testid="button-sign-in">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm" data-testid="button-get-started">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
                <span className="block">Asset Administration Shell</span>
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Package Explorer Web
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                A modern web-based AAS viewer and editor for AASX packages. View, edit, and validate 
                Asset Administration Shell V3 files directly in your browser with full AAS compliance and validation.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="inline-flex items-center gap-2" data-testid="button-start-building">
                  <Rocket className="w-5 h-5" />
                  Open AASX Explorer
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="inline-flex items-center gap-2" data-testid="button-github">
                <Github className="w-5 h-5" />
                View on GitHub
              </Button>
            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap justify-center gap-3 pt-8">
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">AAS V3</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">AASX Packages</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">React</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">TypeScript</span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">Validation Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Complete AAS V3 Support</h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Full-featured web application for Asset Administration Shell package management and editing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">AASX Package Management</h3>
                <p className="text-muted-foreground">
                  Upload, parse, and manage AASX files up to 200MB. Extract AAS environment data and handle supplementary files.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <FolderTree className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">AAS Tree Navigation</h3>
                <p className="text-muted-foreground">
                  Hierarchical tree view of Shells, Submodels, and Elements with expand/collapse, search, and navigation.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">AAS V3 Validation</h3>
                <p className="text-muted-foreground">
                  Complete schema validation, constraint validation, and reference integrity checks with detailed reports.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Property Editing</h3>
                <p className="text-muted-foreground">
                  Edit AAS properties with type-specific editors, multi-language support, and inline validation feedback.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">Multiple Export Formats</h3>
                <p className="text-muted-foreground">
                  Export to JSON, XML, Excel/CSV formats with template-based export and batch operations.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Modern Web Stack</h3>
                <p className="text-muted-foreground">
                  Built with React, TypeScript, and modern web technologies for fast, responsive AAS exploration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div id="architecture" className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Architecture Overview</h2>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Modular web application architecture for AAS package management and editing
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    Application Structure
                  </h3>
                  <div className="space-y-3 text-sm font-mono">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">eclipse-aasx-web/</span>
                    </div>
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span>client/ <span className="text-muted-foreground">(React frontend)</span></span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-4 h-4 text-secondary" />
                          <span>aas-tree/ <span className="text-muted-foreground">(Tree navigation)</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Component className="w-4 h-4 text-accent" />
                          <span>property-editor/ <span className="text-muted-foreground">(AAS editing)</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-primary" />
                        <span>server/ <span className="text-muted-foreground">(Express API)</span></span>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-secondary" />
                          <span>aasx-handler/ <span className="text-muted-foreground">(Package management)</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span>validation/ <span className="text-muted-foreground">(AAS V3 validation)</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span>data/ <span className="text-muted-foreground">(AASX storage)</span></span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-primary">AAS Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• AAS V3 Type System</li>
                      <li>• AASX Package Parsing</li>
                      <li>• Property Editing</li>
                      <li>• Validation Engine</li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2 text-secondary">Technology</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• React + TypeScript</li>
                      <li>• Express REST API</li>
                      <li>• File-based Storage</li>
                      <li>• Modern Web Stack</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                <div className="space-y-3">
                  <div className="bg-muted rounded-md p-3 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Clone and setup</div>
                    <div>git clone eclipse-aasx-web</div>
                    <div>cd eclipse-aasx-web && npm install</div>
                  </div>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Start the application</div>
                    <div>npm run dev</div>
                  </div>
                  <div className="bg-muted rounded-md p-3 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Upload your AASX files</div>
                    <div>Open browser → Login → Upload AASX</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-6">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-2">
                <Code className="w-6 h-6 text-primary" />
                <span className="font-semibold">RE-Eclipse AASX Web</span>
                <span className="text-muted-foreground">- Asset Administration Shell Package Explorer</span>
              </div>
              <div className="flex items-center space-x-6">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <BookOpen className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Project Information */}
            <div className="border-t border-border pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2 text-primary">CEA-List, France</h4>
                  <p className="text-muted-foreground">
                    Developed at CEA-List (Commissariat à l'énergie atomique et aux énergies alternatives), 
                    a leading French research institute in software and systems engineering.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-primary">EU RAASCEMAN Project</h4>
                  <p className="text-muted-foreground">
                    Part of the European RAASCEMAN project focused on advancing Asset Administration Shell 
                    standards and implementations for Industry 4.0 interoperability.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-primary">CIR4FUN Project</h4>
                  <p className="text-muted-foreground">
                    Contributing to CIR4FUN initiative for circular economy and functional integration 
                    using digital twin technologies and AAS frameworks.
                  </p>
                </div>
              </div>
            </div>

            {/* Eclipse AASX Attribution */}
            <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
              Based on Eclipse AASX Package Explorer • Re-engineered for modern web platforms
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
