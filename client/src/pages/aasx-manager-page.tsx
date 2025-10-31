import { AppLayout } from "@/features/app-shell";
import { AasxFileUpload, AasxFileList, AasxCreateNew } from "@/features/aasx-manager";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react";

export function AasxManagerPage() {
  const queryClient = useQueryClient();

  const handleUploadComplete = (fileId: string) => {
    console.log('File uploaded:', fileId);
    queryClient.invalidateQueries({ queryKey: ["aasx-files"] });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                AASX Package Manager
              </h1>
              <p className="text-muted-foreground">
                Upload, manage, and view Asset Administration Shell packages
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* File Management Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create New Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Create New Package</h2>
              <p className="text-sm text-muted-foreground">
                Start with an empty package or use a template
              </p>
            </div>
            <AasxCreateNew />
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Upload Package</h2>
              <p className="text-sm text-muted-foreground">
                Upload an existing AASX file to your workspace
              </p>
            </div>
            <AasxFileUpload onUploadComplete={handleUploadComplete} />
          </div>
        </div>

        {/* File List Section - Full Width */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Your Packages</h2>
            <p className="text-sm text-muted-foreground">
              View and manage your AASX files
            </p>
          </div>
          <AasxFileList />
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
          <h3 className="text-sm font-semibold mb-2">About AASX Packages</h3>
          <p className="text-sm text-muted-foreground">
            AASX (Asset Administration Shell Exchange) packages contain structured information about assets
            according to the Industry 4.0 standard. These packages include asset metadata, submodels, and
            supplementary files like documentation and images.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
