import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Info,
  FileText,
  Hash,
  Type,
  Link2,
  Image as ImageIcon,
  File as FileIcon,
  Globe,
  Calendar,
  CheckCircle2,
  XCircle,
  List,
  Layers
} from "lucide-react";
import { PropertyEditor } from "./property-editor";
import { updatePropertyValue, findPropertyPath } from "../api/aasx-api";
import type {
  SubmodelElement,
  Property,
  MultiLanguageProperty,
  Range,
  ReferenceElement,
  Blob,
  File,
  SubmodelElementCollection,
  SubmodelElementList,
  RelationshipElement,
  AnnotatedRelationshipElement,
  Entity,
  Operation,
  Capability,
  BasicEventElement,
  Reference,
  LangStringTextType,
  AssetAdministrationShell,
  Submodel,
} from "../../../../../shared";

interface PropertyPanelProps {
  readonly node: any;
  readonly fileId?: string;
  readonly environment?: any;
}

export function PropertyPanel({ node, fileId, environment }: PropertyPanelProps) {
  if (!node) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Select a node from the tree to view its properties
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          {node.icon}
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{node.label}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{node.type}</Badge>
              {node.data?.modelType && (
                <Badge variant="outline">{node.data.modelType}</Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <ScrollArea className="h-[calc(100vh-300px)] scroll-smooth">
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>
            <TabsContent value="properties" className="space-y-4 mt-4">
              {renderNodeContent(node, fileId, environment)}
            </TabsContent>
            <TabsContent value="metadata" className="space-y-4 mt-4">
              {renderMetadata(node.data)}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Render node content based on type
function renderNodeContent(node: any, fileId?: string, environment?: any) {
  const data = node.data;

  if (!data) {
    return <EmptyState message="No data available" />;
  }

  // Handle different node types
  switch (node.type) {
    case "environment":
      return <EnvironmentView data={data} />;
    case "aas":
      return <AasView data={data} />;
    case "submodel":
      return <SubmodelView data={data} />;
    case "submodelElement":
      return <SubmodelElementView data={data} fileId={fileId} environment={environment} />;
    default:
      return <GenericView data={data} />;
  }
}

// Environment View
function EnvironmentView({ data }: { readonly data: any }) {
  return (
    <div className="space-y-4">
      <PropertyRow
        label="Asset Administration Shells"
        value={data.assetAdministrationShells?.length || 0}
        icon={<Hash className="h-4 w-4" />}
      />
      <PropertyRow
        label="Submodels"
        value={data.submodels?.length || 0}
        icon={<Hash className="h-4 w-4" />}
      />
      <PropertyRow
        label="Concept Descriptions"
        value={data.conceptDescriptions?.length || 0}
        icon={<Hash className="h-4 w-4" />}
      />
    </div>
  );
}

// AAS View
function AasView({ data }: { readonly data: AssetAdministrationShell }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID" value={data.id} icon={<Hash className="h-4 w-4" />} />
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />

      {data.assetInformation && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Asset Information" />
          <PropertyRow
            label="Asset Kind"
            value={data.assetInformation.assetKind}
            icon={<FileText className="h-4 w-4" />}
          />
          <PropertyRow
            label="Global Asset ID"
            value={data.assetInformation.globalAssetId}
            icon={<Globe className="h-4 w-4" />}
          />
        </>
      )}

      {data.submodels && data.submodels.length > 0 && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Submodel References" />
          <PropertyRow
            label="Count"
            value={data.submodels.length}
            icon={<Hash className="h-4 w-4" />}
          />
        </>
      )}
    </div>
  );
}

// Submodel View
function SubmodelView({ data }: { readonly data: Submodel }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID" value={data.id} icon={<Hash className="h-4 w-4" />} />
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Kind" value={data.kind} icon={<FileText className="h-4 w-4" />} />

      {data.semanticId && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Semantic ID" />
          <ReferenceView reference={data.semanticId} />
        </>
      )}

      {data.submodelElements && data.submodelElements.length > 0 && (
        <>
          <Separator className="my-4" />
          <PropertyRow
            label="Elements"
            value={data.submodelElements.length}
            icon={<Hash className="h-4 w-4" />}
          />
        </>
      )}
    </div>
  );
}

// SubmodelElement View - Type-specific rendering
function SubmodelElementView({ data, fileId, environment }: { readonly data: SubmodelElement; readonly fileId?: string; readonly environment?: any }) {
  const modelType = data.modelType;

  switch (modelType) {
    case "Property":
      return <PropertyView data={data as Property} fileId={fileId} environment={environment} />;
    case "MultiLanguageProperty":
      return <MultiLanguagePropertyView data={data as MultiLanguageProperty} fileId={fileId} environment={environment} />;
    case "Range":
      return <RangeView data={data as Range} />;
    case "ReferenceElement":
      return <ReferenceElementView data={data as ReferenceElement} fileId={fileId} environment={environment} />;
    case "Blob":
      return <BlobView data={data as Blob} />;
    case "File":
      return <FileView data={data as File} />;
    case "SubmodelElementCollection":
      return <CollectionView data={data as SubmodelElementCollection} />;
    case "SubmodelElementList":
      return <ListElementView data={data as SubmodelElementList} />;
    case "RelationshipElement":
      return <RelationshipView data={data as RelationshipElement} />;
    case "AnnotatedRelationshipElement":
      return <AnnotatedRelationshipView data={data as AnnotatedRelationshipElement} />;
    case "Entity":
      return <EntityView data={data as Entity} />;
    case "Operation":
      return <OperationView data={data as Operation} />;
    case "Capability":
      return <CapabilityView data={data as Capability} />;
    case "BasicEventElement":
      return <BasicEventView data={data as BasicEventElement} />;
    default:
      return <GenericView data={data} />;
  }
}

// Type-specific views
function PropertyView({ data, fileId, environment }: { readonly data: Property; readonly fileId?: string; readonly environment?: any }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Value Type" value={data.valueType} icon={<FileText className="h-4 w-4" />} />
      <PropertyRow
        label="Value"
        value={data.value}
        icon={<Hash className="h-4 w-4" />}
        highlight
      />
      {data.semanticId && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Semantic ID" />
          <ReferenceView reference={data.semanticId} />
        </>
      )}
      
      {/* Property Editor - Phase 1 Implementation */}
      <Separator className="my-4" />
      <PropertyEditor
        element={data}
        onSave={async (element, newValue) => {
          if (!fileId || !environment) {
            console.warn('No fileId or environment available');
            alert(`Property "${element.idShort}" updated to: ${newValue} (not saved - no file loaded)`);
            return;
          }

          try {
            const propertyPath = findPropertyPath(environment, element);
            if (!propertyPath) {
              throw new Error('Could not find property path');
            }

            await updatePropertyValue(fileId, propertyPath, newValue);
            console.log('✅ Property saved to file:', element.idShort, '=', newValue);
            alert(`Property "${element.idShort}" saved to file!`);
          } catch (error) {
            console.error('❌ Save failed:', error);
            alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }}
        onCancel={() => {
          console.log('❌ Edit cancelled');
        }}
      />
    </div>
  );
}

function MultiLanguagePropertyView({ data, fileId, environment }: { readonly data: MultiLanguageProperty; readonly fileId?: string; readonly environment?: any }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      {data.value && data.value.length > 0 && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Values" />
          {data.value.map((langString: LangStringTextType) => (
            <PropertyRow
              key={`${langString.language}-${langString.text}`}
              label={langString.language}
              value={langString.text}
              icon={<Globe className="h-4 w-4" />}
            />
          ))}
        </>
      )}
      
      {/* Multi-Language Property Editor - Phase 1 Implementation */}
      <Separator className="my-4" />
      <PropertyEditor
        element={data}
        onSave={async (element, newValue) => {
          console.log('✅ Multi-language property saved:', element.idShort, newValue);
          alert(`Multi-language property "${element.idShort}" updated!`);
        }}
      />
    </div>
  );
}

function RangeView({ data }: { readonly data: Range }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Value Type" value={data.valueType} icon={<FileText className="h-4 w-4" />} />
      <PropertyRow label="Min" value={data.min} icon={<Hash className="h-4 w-4" />} />
      <PropertyRow label="Max" value={data.max} icon={<Hash className="h-4 w-4" />} />
    </div>
  );
}

function ReferenceElementView({ data, fileId, environment }: { readonly data: ReferenceElement; readonly fileId?: string; readonly environment?: any }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      {data.value && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Reference" />
          <ReferenceView reference={data.value} />
        </>
      )}
      
      {/* Reference Editor - Phase 1 Implementation */}
      <Separator className="my-4" />
      <PropertyEditor
        element={data}
        onSave={async (element, newValue) => {
          console.log('✅ Reference saved:', element.idShort, newValue);
          alert(`Reference "${element.idShort}" updated!`);
        }}
      />
    </div>
  );
}

function BlobView({ data }: { readonly data: Blob }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Content Type" value={data.contentType} icon={<FileIcon className="h-4 w-4" />} />
      <PropertyRow
        label="Value"
        value={data.value ? `${data.value.substring(0, 50)}...` : "—"}
        icon={<ImageIcon className="h-4 w-4" />}
      />
    </div>
  );
}

function FileView({ data }: { readonly data: File }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Content Type" value={data.contentType} icon={<FileIcon className="h-4 w-4" />} />
      <PropertyRow label="Path" value={data.value} icon={<Link2 className="h-4 w-4" />} />
    </div>
  );
}

function CollectionView({ data }: { readonly data: SubmodelElementCollection }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow
        label="Elements"
        value={data.value?.length || 0}
        icon={<Layers className="h-4 w-4" />}
      />
    </div>
  );
}

function ListElementView({ data }: { readonly data: SubmodelElementList }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow
        label="Order Relevant"
        value={data.orderRelevant ? "Yes" : "No"}
        icon={data.orderRelevant ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      />
      <PropertyRow
        label="Type"
        value={data.typeValueListElement}
        icon={<FileText className="h-4 w-4" />}
      />
      <PropertyRow
        label="Elements"
        value={data.value?.length || 0}
        icon={<List className="h-4 w-4" />}
      />
    </div>
  );
}

function RelationshipView({ data }: { readonly data: RelationshipElement }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <Separator className="my-4" />
      <SectionHeader title="First Reference" />
      <ReferenceView reference={data.first} />
      <Separator className="my-4" />
      <SectionHeader title="Second Reference" />
      <ReferenceView reference={data.second} />
    </div>
  );
}

function AnnotatedRelationshipView({ data }: { readonly data: AnnotatedRelationshipElement }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <Separator className="my-4" />
      <SectionHeader title="First Reference" />
      <ReferenceView reference={data.first} />
      <Separator className="my-4" />
      <SectionHeader title="Second Reference" />
      <ReferenceView reference={data.second} />
      {data.annotations && data.annotations.length > 0 && (
        <>
          <Separator className="my-4" />
          <PropertyRow
            label="Annotations"
            value={data.annotations.length}
            icon={<FileText className="h-4 w-4" />}
          />
        </>
      )}
    </div>
  );
}

function EntityView({ data }: { readonly data: Entity }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Entity Type" value={data.entityType} icon={<FileText className="h-4 w-4" />} />
      <PropertyRow label="Global Asset ID" value={data.globalAssetId} icon={<Globe className="h-4 w-4" />} />
      {data.statements && data.statements.length > 0 && (
        <PropertyRow
          label="Statements"
          value={data.statements.length}
          icon={<List className="h-4 w-4" />}
        />
      )}
    </div>
  );
}

function OperationView({ data }: { readonly data: Operation }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow
        label="Input Variables"
        value={data.inputVariables?.length || 0}
        icon={<Hash className="h-4 w-4" />}
      />
      <PropertyRow
        label="Output Variables"
        value={data.outputVariables?.length || 0}
        icon={<Hash className="h-4 w-4" />}
      />
      <PropertyRow
        label="InOutput Variables"
        value={data.inoutputVariables?.length || 0}
        icon={<Hash className="h-4 w-4" />}
      />
    </div>
  );
}

function CapabilityView({ data }: { readonly data: Capability }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <EmptyState message="Capability element (no additional properties)" />
    </div>
  );
}

function BasicEventView({ data }: { readonly data: BasicEventElement }) {
  return (
    <div className="space-y-4">
      <PropertyRow label="ID Short" value={data.idShort} icon={<Type className="h-4 w-4" />} />
      <PropertyRow label="Direction" value={data.direction} icon={<FileText className="h-4 w-4" />} />
      <PropertyRow label="State" value={data.state} icon={<FileText className="h-4 w-4" />} />
      <PropertyRow label="Message Topic" value={data.messageTopic} icon={<FileText className="h-4 w-4" />} />
      <PropertyRow label="Last Update" value={data.lastUpdate} icon={<Calendar className="h-4 w-4" />} />
      <Separator className="my-4" />
      <SectionHeader title="Observed Reference" />
      <ReferenceView reference={data.observed} />
    </div>
  );
}

// Helper components
function ReferenceView({ reference }: { readonly reference: Reference }) {
  return (
    <div className="space-y-2">
      <PropertyRow label="Type" value={reference.type} icon={<Link2 className="h-4 w-4" />} />
      {reference.keys && reference.keys.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Keys</div>
          {reference.keys.map((key) => (
            <div key={`${key.type}-${key.value}`} className="ml-4 space-y-1">
              <PropertyRow label="Type" value={key.type} icon={<Type className="h-4 w-4" />} />
              <PropertyRow label="Value" value={key.value} icon={<Hash className="h-4 w-4" />} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyRow({
  label,
  value,
  icon,
  highlight = false,
}: {
  readonly label: string;
  readonly value?: string | number | null;
  readonly icon: React.ReactNode;
  readonly highlight?: boolean;
}) {
  const displayValue = value !== null && value !== undefined ? String(value) : "—";

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div
          className={`text-sm break-words ${highlight ? "font-semibold text-foreground" : "text-foreground"
            }`}
        >
          {displayValue}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { readonly title: string }) {
  return <div className="text-sm font-semibold text-foreground mb-2">{title}</div>;
}

function EmptyState({ message }: { readonly message: string }) {
  return (
    <div className="text-center py-8">
      <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Metadata view
function renderMetadata(data: any) {
  if (!data) {
    return <EmptyState message="No metadata available" />;
  }

  return (
    <div className="space-y-4">
      {data.category && (
        <PropertyRow label="Category" value={data.category} icon={<FileText className="h-4 w-4" />} />
      )}
      {data.description && Array.isArray(data.description) && data.description.length > 0 && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Description" />
          {data.description.map((desc: LangStringTextType) => (
            <PropertyRow
              key={`desc-${desc.language}-${desc.text}`}
              label={desc.language}
              value={desc.text}
              icon={<Globe className="h-4 w-4" />}
            />
          ))}
        </>
      )}
      {data.displayName && Array.isArray(data.displayName) && data.displayName.length > 0 && (
        <>
          <Separator className="my-4" />
          <SectionHeader title="Display Name" />
          {data.displayName.map((name: LangStringTextType) => (
            <PropertyRow
              key={`name-${name.language}-${name.text}`}
              label={name.language}
              value={name.text}
              icon={<Globe className="h-4 w-4" />}
            />
          ))}
        </>
      )}
      {data.extensions && Array.isArray(data.extensions) && data.extensions.length > 0 && (
        <>
          <Separator className="my-4" />
          <PropertyRow
            label="Extensions"
            value={data.extensions.length}
            icon={<Layers className="h-4 w-4" />}
          />
        </>
      )}
      {data.qualifiers && Array.isArray(data.qualifiers) && data.qualifiers.length > 0 && (
        <>
          <Separator className="my-4" />
          <PropertyRow
            label="Qualifiers"
            value={data.qualifiers.length}
            icon={<Layers className="h-4 w-4" />}
          />
        </>
      )}
    </div>
  );
}

// Generic fallback view
function GenericView({ data }: { readonly data: any }) {
  if (!data || typeof data !== "object") {
    return <EmptyState message="No properties available" />;
  }

  const entries = Object.entries(data).filter(
    ([key]) => !key.startsWith("_") && key !== "children"
  );

  return (
    <div className="space-y-3">
      {entries.map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{key}</span>
            <Badge variant="outline" className="text-xs">
              {typeof value}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2 font-mono">
            {typeof value === "object" && value !== null ? (
              <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <span>{value === null || value === undefined ? "—" : String(value)}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
