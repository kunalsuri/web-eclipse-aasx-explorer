import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/features/app-shell";
import { AasExplorerIntegrated } from "@/features/aas-explorer/components/aas-explorer-integrated";
import { extractTechnicalProperties } from "@/features/aas-explorer/utils/extract-technical-properties";
import { DocumentShelfPanel, type DocumentEntity } from "@/components/DocumentShelfPanel";
import { TechnicalDataPanel } from "@/components/TechnicalDataPanel";
import { ResponsiveBreadcrumb } from "@/features/aas-explorer/components/breadcrumb-navigation";
import { useBreadcrumbNavigation } from "@/features/aas-explorer/hooks/use-breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileJson,
  CheckCircle2,
  AlertCircle,
  Info,
  Package,
  Database,
  FileText,
  Upload,
  Network,
  Table
} from "lucide-react";
import {
  createSampleEnvironment,
  createMinimalEnvironment,
  serializeEnvironment,
  validateEnvironmentAdvanced,
} from "../../../shared";
import type { Environment } from "../../../shared";
import type { ValidationResult } from "../../../shared/aas-validation-engine";
import { ValidationPanel } from "@/features/aas-explorer/components/validation-panel";

interface AasxFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
}

async function fetchFiles(): Promise<AasxFile[]> {
  const response = await fetch("/api/aasx/files");
  if (!response.ok) {
    throw new Error("Failed to fetch files");
  }
  const data = await response.json();
  return data.files;
}

async function fetchEnvironment(fileId: string): Promise<Environment> {
  const response = await fetch(`/api/aasx/environment/${fileId}`);
  if (!response.ok) {
    throw new Error("Environment not found. Parse the file first.");
  }
  const data = await response.json();
  return data.environment;
}

async function fetchDocuments(fileId: string): Promise<DocumentEntity[]> {
  const response = await fetch(`/api/aasx/${fileId}/documents`);
  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }
  const data = await response.json();
  return data.documents ?? [];
}

export function AasViewerPage() {
  const [location] = useLocation();
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<string>("sample-aas");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [activeView, setActiveView] = useState<
    "tree" | "overview" | "validation" | "documents" | "technical"
  >("overview");

  const queryClient = useQueryClient();

  const { data: files } = useQuery({
    queryKey: ["aasx-files"],
    queryFn: fetchFiles,
  });

  // VDI 2770 documents are derived server-side from the parsed environment.
  const { data: documents = [] } = useQuery({
    queryKey: ["aasx-documents", selectedFileId],
    queryFn: () => fetchDocuments(selectedFileId),
    enabled: Boolean(environment) && Boolean(selectedFileId),
  });

  // Technical properties are derived client-side from the in-memory environment.
  const technicalProperties = useMemo(
    () => extractTechnicalProperties(environment),
    [environment]
  );

  // Auto-load file from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get('fileId');
    if (fileId) {
      handleLoadFromFile(fileId);
    }
  }, [location]);

  const handleLoadSample = async () => {
    // Try to load from file first
    try {
      const response = await fetch('/api/aasx/environment/sample-aas');
      if (response.ok) {
        const data = await response.json();
        setEnvironment(data.environment);
        setJsonOutput(serializeEnvironment(data.environment));
        const validation = validateEnvironmentAdvanced(data.environment);
        setValidationResult(validation);
        setSelectedFileId("sample-aas");
        return;
      }
    } catch (error) {
      console.log('Could not load from file, using generated sample');
    }
    
    // Fallback to generated sample
    const env = createSampleEnvironment();
    setEnvironment(env);
    setJsonOutput(serializeEnvironment(env));
    const validation = validateEnvironmentAdvanced(env);
    setValidationResult(validation);
    setSelectedFileId("sample-aas");
  };

  const handleLoadMinimal = () => {
    const env = createMinimalEnvironment();
    setEnvironment(env);
    setJsonOutput(serializeEnvironment(env));
    const validation = validateEnvironmentAdvanced(env);
    setValidationResult(validation);
    setSelectedFileId("");
  };

  const handleLoadFromFile = async (fileId: string) => {
    try {
      const env = await fetchEnvironment(fileId);
      setEnvironment(env);
      setJsonOutput(serializeEnvironment(env));
      const validation = validateEnvironmentAdvanced(env);
      setValidationResult(validation);
      setSelectedFileId(fileId);
    } catch (error) {
      console.error("Failed to load environment:", error);
      alert(error instanceof Error ? error.message : "Failed to load environment");
    }
  };

  const handleRevalidate = () => {
    if (environment) {
      const validation = validateEnvironmentAdvanced(environment);
      setValidationResult(validation);
    }
  };

  const handleExportReport = () => {
    // Export is now handled by the ValidationReportDialog
    // This function is kept for backward compatibility but not used
  };

  const handleClear = () => {
    setEnvironment(null);
    setValidationResult(null);
    setJsonOutput("");
    setSelectedFileId("");
    setSelectedNode(null);
    setActiveView("overview");
  };

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  // Edits from the integrated explorer (property edits, clipboard paste,
  // undo/redo, delete, duplicate) persist server-side. Re-fetch the saved
  // environment so the tree, JSON, validation, and derived panels reflect them.
  const handleEnvironmentChange = async (updatedEnvironment?: Environment) => {
    if (selectedFileId) {
      try {
        const fresh = await fetchEnvironment(selectedFileId);
        setEnvironment(fresh);
        setJsonOutput(serializeEnvironment(fresh));
        setValidationResult(validateEnvironmentAdvanced(fresh));
        queryClient.invalidateQueries({ queryKey: ["aasx-documents", selectedFileId] });
        return;
      } catch (error) {
        console.error("Failed to refresh environment after edit:", error);
      }
    }

    // Fallback for in-memory-only environments (no persisted file to re-read).
    if (updatedEnvironment) {
      setEnvironment(updatedEnvironment);
      setJsonOutput(serializeEnvironment(updatedEnvironment));
      setValidationResult(validateEnvironmentAdvanced(updatedEnvironment));
    }
  };

  // Breadcrumb navigation
  const { items: breadcrumbItems, navigate: navigateBreadcrumb } = useBreadcrumbNavigation(
    selectedNode,
    {
      onNavigate: (item) => {
        // Navigate to the breadcrumb item
        // This would require finding the node by path and selecting it
        console.log('Navigate to:', item);
      },
    }
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AAS V3 Viewer
              </h1>
              <p className="text-muted-foreground">
                View and validate Asset Administration Shell V3.0 data structures
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={handleLoadSample} variant="default">
            <Package className="h-4 w-4 mr-2" />
            Load Sample AAS
          </Button>
          <Button onClick={handleLoadMinimal} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Load Minimal AAS
          </Button>
          {files && files.length > 0 && (
            <div className="flex items-center gap-2">
              <Select value={selectedFileId} onValueChange={handleLoadFromFile}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Load from uploaded file..." />
                </SelectTrigger>
                <SelectContent>
                  {files.map((file) => (
                    <SelectItem key={file.id} value={file.id}>
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {environment && (
            <Button onClick={handleClear} variant="ghost">
              Clear
            </Button>
          )}
        </div>

        {/* Content */}
        {!environment ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No AAS Loaded</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Load a sample AAS to view its structure and validate it
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleLoadSample}>
                    Load Sample AAS
                  </Button>
                  <Button onClick={handleLoadMinimal} variant="outline">
                    Load Minimal AAS
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "tree" | "overview" | "validation" | "documents" | "technical")} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">
                <Info className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="tree">
                <Network className="h-4 w-4 mr-2" />
                Explorer
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="technical">
                <Table className="h-4 w-4 mr-2" />
                Technical Data
              </TabsTrigger>
              <TabsTrigger value="validation">
                {validationResult?.isValid ? (
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                )}
                Validation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-0">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Overview & Validation */}
            <div className="space-y-6">
              {/* Overview Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Environment Overview
                  </CardTitle>
                  <CardDescription>
                    Summary of the AAS Environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Asset Administration Shells</p>
                      <p className="text-2xl font-bold">
                        {environment.assetAdministrationShells?.length || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Submodels</p>
                      <p className="text-2xl font-bold">
                        {environment.submodels?.length || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Concept Descriptions</p>
                      <p className="text-2xl font-bold">
                        {environment.conceptDescriptions?.length || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Elements</p>
                      <p className="text-2xl font-bold">
                        {environment.submodels?.reduce(
                          (sum, sm) => sum + (sm.submodelElements?.length || 0),
                          0
                        ) || 0}
                      </p>
                    </div>
                  </div>

                  {environment.assetAdministrationShells && environment.assetAdministrationShells.length > 0 && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Asset Administration Shells:</p>
                      <div className="space-y-2">
                        {environment.assetAdministrationShells.map((aas, index) => (
                          <div key={index} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium">{aas.idShort || "Unnamed AAS"}</p>
                            <p className="text-xs text-muted-foreground truncate">{aas.id}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {aas.assetInformation.assetKind}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {aas.submodels?.length || 0} Submodels
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation Card */}
              {validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      Validation Results
                    </CardTitle>
                    <CardDescription>
                      AAS V3.0 compliance validation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={validationResult.isValid ? "default" : "destructive"}
                            className="text-sm"
                          >
                            {validationResult.isValid ? "Valid" : "Invalid"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-destructive">
                            {validationResult.errors.length} Errors
                          </span>
                          <span className="text-yellow-600">
                            {validationResult.warnings.length} Warnings
                          </span>
                        </div>
                      </div>

                      {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          <div className="text-xs space-y-2">
                            {validationResult.errors.map((error, idx) => (
                              <div key={idx} className="text-red-600">
                                <strong>{error.code}:</strong> {error.message}
                                {error.path && <div className="text-muted-foreground ml-4">{error.path}</div>}
                              </div>
                            ))}
                            {validationResult.warnings.map((warning, idx) => (
                              <div key={idx} className="text-yellow-600">
                                <strong>{warning.code}:</strong> {warning.message}
                                {warning.path && <div className="text-muted-foreground ml-4">{warning.path}</div>}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - JSON View */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    JSON Representation
                  </CardTitle>
                  <CardDescription>
                    Serialized AAS Environment in JSON format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="formatted" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="formatted">Formatted</TabsTrigger>
                      <TabsTrigger value="compact">Compact</TabsTrigger>
                    </TabsList>
                    <TabsContent value="formatted" className="mt-4">
                      <ScrollArea className="h-[600px] w-full rounded-md border">
                        <pre className="p-4 text-xs">
                          <code>{jsonOutput}</code>
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="compact" className="mt-4">
                      <ScrollArea className="h-[600px] w-full rounded-md border">
                        <pre className="p-4 text-xs">
                          <code>{JSON.stringify(environment)}</code>
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
            </TabsContent>

            <TabsContent value="tree" className="space-y-0">
              {/* Breadcrumb Navigation */}
              {selectedNode && breadcrumbItems.length > 0 && (
                <div className="mb-4">
                  <ResponsiveBreadcrumb
                    items={breadcrumbItems}
                    onNavigate={navigateBreadcrumb}
                  />
                </div>
              )}

              {/* Integrated explorer: tree + property editor + clipboard/undo/redo */}
              <div className="h-[720px] rounded-lg border overflow-hidden">
                <AasExplorerIntegrated
                  environment={environment}
                  fileId={selectedFileId}
                  validationResult={validationResult}
                  onNodeSelect={handleNodeSelect}
                  onEnvironmentChange={handleEnvironmentChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-0">
              <div className="h-[720px] rounded-lg border overflow-hidden">
                <DocumentShelfPanel documents={documents} />
              </div>
            </TabsContent>

            <TabsContent value="technical" className="space-y-0">
              <div className="h-[720px] rounded-lg border overflow-hidden">
                <TechnicalDataPanel properties={technicalProperties} />
              </div>
            </TabsContent>

            <TabsContent value="validation" className="space-y-0">
              <ValidationPanel
                result={validationResult}
                onRevalidate={handleRevalidate}
                onExportReport={handleExportReport}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Info Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">About AAS V3.0 Types</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This page demonstrates the AAS V3.0 type system implemented in TypeScript.
              The types are based on the official AAS V3.0 specification and mirror the
              structure from the Eclipse AASX Package Explorer C# implementation.
            </p>
            <p>
              <strong>Features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Complete TypeScript interfaces for all AAS V3.0 types</li>
              <li>JSON serialization and deserialization</li>
              <li>Basic validation with error and warning reporting</li>
              <li>Type guards for runtime type checking</li>
              <li>Helper functions for common operations</li>
              <li>Sample data generators for testing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
