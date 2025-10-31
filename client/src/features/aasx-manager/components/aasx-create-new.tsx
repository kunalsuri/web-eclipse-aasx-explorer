/**
 * AASX Create New Package Component
 * Allows users to create new AAS packages from scratch
 * Based on C# implementation: File → New (Ctrl+N)
 */

import { useState } from "react";
import { Plus, FileText, Loader2, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// Types
// ============================================================================

interface CreatePackageRequest {
  packageName?: string;
  includeDefaultAAS?: boolean;
  includeDefaultSubmodel?: boolean;
  template?: string;
}

interface CreatePackageResponse {
  success: boolean;
  packageId: string;
  environment: unknown;
  metadata: {
    id: string;
    name: string;
    createdAt: string;
    lastModified: string;
    version: string;
  };
}

// ============================================================================
// API Functions
// ============================================================================

async function createNewPackage(
  request: CreatePackageRequest
): Promise<CreatePackageResponse> {
  const response = await fetch("/api/aasx/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create package");
  }

  return response.json();
}

// ============================================================================
// Template Definitions
// ============================================================================

const TEMPLATES = [
  {
    id: "empty",
    name: "Empty Package",
    description: "Start with a completely empty AAS environment",
    icon: FileText,
  },
  {
    id: "digital-nameplate",
    name: "Digital Nameplate",
    description: "Pre-configured with Digital Nameplate submodel structure",
    icon: Sparkles,
  },
  {
    id: "technical-data",
    name: "Technical Data",
    description: "Pre-configured with Technical Data submodel structure",
    icon: Sparkles,
  },
];

// ============================================================================
// Component
// ============================================================================

export function AasxCreateNew() {
  const [open, setOpen] = useState(false);
  const [packageName, setPackageName] = useState("New Package");
  const [includeDefaultAAS, setIncludeDefaultAAS] = useState(true);
  const [includeDefaultSubmodel, setIncludeDefaultSubmodel] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("empty");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const createMutation = useMutation({
    mutationFn: createNewPackage,
    onSuccess: (data) => {
      // Invalidate file list to show new package
      queryClient.invalidateQueries({ queryKey: ["aasx-files"] });

      toast({
        title: "Package created",
        description: `"${data.metadata.name}" has been created successfully.`,
      });

      // Close dialog
      setOpen(false);

      // Navigate to viewer
      setLocation(`/aas-viewer?fileId=${data.packageId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create package. Please try again.",
        variant: "destructive",
      });
    },
  });

  function handleCreate() {
    const request: CreatePackageRequest = {
      packageName,
    };

    // Only include template if not empty
    if (selectedTemplate !== "empty") {
      request.template = selectedTemplate;
    } else {
      // For empty template, use the checkboxes
      request.includeDefaultAAS = includeDefaultAAS;
      request.includeDefaultSubmodel = includeDefaultSubmodel;
    }

    createMutation.mutate(request);
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setPackageName("New Package");
      setIncludeDefaultAAS(true);
      setIncludeDefaultSubmodel(true);
      setSelectedTemplate("empty");
    }
  }

  const selectedTemplateInfo = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create New Package
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New AAS Package
          </DialogTitle>
          <DialogDescription>
            Create a new Asset Administration Shell package from scratch or from a
            template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="package-name">Package Name</Label>
            <Input
              id="package-name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="Enter package name"
              disabled={createMutation.isPending}
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name for your AAS package
            </p>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
              disabled={createMutation.isPending}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <template.icon className="h-4 w-4" />
                      <span>{template.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateInfo && (
              <p className="text-xs text-muted-foreground">
                {selectedTemplateInfo.description}
              </p>
            )}
          </div>

          {/* Options for Empty Template */}
          {selectedTemplate === "empty" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Initial Structure</CardTitle>
                <CardDescription className="text-xs">
                  Choose what to include in your empty package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-aas"
                    checked={includeDefaultAAS}
                    onCheckedChange={(checked) =>
                      setIncludeDefaultAAS(checked === true)
                    }
                    disabled={createMutation.isPending}
                  />
                  <Label
                    htmlFor="include-aas"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include default Asset Administration Shell
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-submodel"
                    checked={includeDefaultSubmodel}
                    onCheckedChange={(checked) =>
                      setIncludeDefaultSubmodel(checked === true)
                    }
                    disabled={
                      !includeDefaultAAS || createMutation.isPending
                    }
                  />
                  <Label
                    htmlFor="include-submodel"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Include default Submodel
                  </Label>
                </div>
                {!includeDefaultAAS && (
                  <p className="text-xs text-muted-foreground">
                    You can add AAS and Submodels later using the editor
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Template Preview */}
          {selectedTemplate !== "empty" && (
            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle className="text-sm">Template Includes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Default Asset Administration Shell</li>
                  <li>
                    Pre-configured {selectedTemplateInfo?.name} Submodel
                  </li>
                  <li>Standard properties and structure</li>
                  <li>Semantic IDs according to specification</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || !packageName.trim()}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
