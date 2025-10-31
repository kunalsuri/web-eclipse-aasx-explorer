import { useState } from "react";
import { ChevronRight, ChevronDown, Package, Database, FileText, Folder, FolderOpen, AlertCircle, AlertTriangle, Info as InfoIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Environment, Submodel, SubmodelElement } from "../../../../../shared";
import type { ValidationResult, ValidationError } from "../../../../../shared/aas-validation-engine";

interface TreeNode {
  id: string;
  label: string;
  type: "environment" | "aas" | "submodel" | "submodelElement" | "property";
  children?: TreeNode[];
  data?: any;
  icon?: React.ReactNode;
  path?: string; // Path for validation error matching
}

interface ValidationIndicator {
  hasErrors: boolean;
  hasWarnings: boolean;
  hasInfo: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  messages: ValidationError[];
}

interface AasTreeViewProps {
  environment: Environment;
  onNodeSelect?: (node: TreeNode) => void;
  selectedNodeId?: string;
  validationResult?: ValidationResult | null;
}

export function AasTreeView({ environment, onNodeSelect, selectedNodeId, validationResult }: AasTreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));

  // Build validation map for quick lookup
  const validationMap = new Map<string, ValidationIndicator>();
  
  if (validationResult) {
    const allErrors = [...validationResult.errors, ...validationResult.warnings, ...validationResult.infos];
    
    allErrors.forEach((error) => {
      if (!error.path) return;
      
      const existing = validationMap.get(error.path) || {
        hasErrors: false,
        hasWarnings: false,
        hasInfo: false,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        messages: [],
      };
      
      if (error.severity === "error") {
        existing.hasErrors = true;
        existing.errorCount++;
      } else if (error.severity === "warning") {
        existing.hasWarnings = true;
        existing.warningCount++;
      } else {
        existing.hasInfo = true;
        existing.infoCount++;
      }
      
      existing.messages.push(error);
      validationMap.set(error.path, existing);
    });
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const buildTree = (): TreeNode => {
    const rootNode: TreeNode = {
      id: "root",
      label: "AAS Environment",
      type: "environment",
      icon: <Database className="h-4 w-4" />,
      children: [],
      data: environment,
      path: "environment",
    };

    // Add Asset Administration Shells
    environment.assetAdministrationShells?.forEach((aas, aasIndex) => {
      const aasNode: TreeNode = {
        id: `aas-${aasIndex}`,
        label: aas.idShort || `AAS ${aasIndex + 1}`,
        type: "aas",
        icon: <Package className="h-4 w-4" />,
        children: [],
        data: aas,
        path: `environment.assetAdministrationShells[${aasIndex}]`,
      };

      // Add submodels referenced by this AAS
      aas.submodels?.forEach((submodelRef, refIndex) => {
        const submodel = environment.submodels?.find(
          (sm) => sm.id === submodelRef.keys?.[0]?.value
        );

        if (submodel) {
          const submodelNode = buildSubmodelNode(submodel, `aas-${aasIndex}-sm-${refIndex}`);
          aasNode.children?.push(submodelNode);
        }
      });

      rootNode.children?.push(aasNode);
    });

    // Add standalone submodels (not referenced by any AAS)
    environment.submodels?.forEach((submodel, smIndex) => {
      const isReferenced = environment.assetAdministrationShells?.some((aas) =>
        aas.submodels?.some((ref) => ref.keys?.[0]?.value === submodel.id)
      );

      if (!isReferenced) {
        const submodelNode = buildSubmodelNode(submodel, `standalone-sm-${smIndex}`);
        rootNode.children?.push(submodelNode);
      }
    });

    return rootNode;
  };

  const buildSubmodelNode = (submodel: Submodel, nodeId: string, parentPath?: string): TreeNode => {
    const smIndex = environment.submodels?.findIndex(sm => sm.id === submodel.id) ?? -1;
    const path = `environment.submodels[${smIndex}]`;
    
    const submodelNode: TreeNode = {
      id: nodeId,
      label: submodel.idShort || "Unnamed Submodel",
      type: "submodel",
      icon: <Folder className="h-4 w-4" />,
      children: [],
      data: submodel,
      path,
    };

    // Add submodel elements
    submodel.submodelElements?.forEach((element, elemIndex) => {
      const elementNode = buildElementNode(element, `${nodeId}-elem-${elemIndex}`, `${path}.submodelElements[${elemIndex}]`);
      submodelNode.children?.push(elementNode);
    });

    return submodelNode;
  };

  const buildElementNode = (element: SubmodelElement, nodeId: string, path: string): TreeNode => {
    const elementNode: TreeNode = {
      id: nodeId,
      label: element.idShort || "Unnamed Element",
      type: "submodelElement",
      icon: <FileText className="h-4 w-4" />,
      data: element,
      path,
    };

    // Handle collections and lists
    if (element.modelType === "SubmodelElementCollection" && "value" in element) {
      elementNode.children = [];
      (element.value as SubmodelElement[])?.forEach((child, childIndex) => {
        const childNode = buildElementNode(child, `${nodeId}-child-${childIndex}`, `${path}.value[${childIndex}]`);
        elementNode.children?.push(childNode);
      });
    } else if (element.modelType === "SubmodelElementList" && "value" in element) {
      elementNode.children = [];
      (element.value as SubmodelElement[])?.forEach((child, childIndex) => {
        const childNode = buildElementNode(child, `${nodeId}-item-${childIndex}`, `${path}.value[${childIndex}]`);
        elementNode.children?.push(childNode);
      });
    }

    return elementNode;
  };

  const tree = buildTree();

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    
    // Get validation indicators for this node
    const validation = node.path ? validationMap.get(node.path) : undefined;
    const hasValidationIssues = validation && (validation.hasErrors || validation.hasWarnings || validation.hasInfo);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
            isSelected && "bg-accent",
            validation?.hasErrors && "border-l-2 border-red-500"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onNodeSelect?.(node);
          }}
        >
          {hasChildren ? (
            <button
              className="flex-shrink-0 hover:bg-accent rounded p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <span className="flex-shrink-0 text-muted-foreground">
            {hasChildren && isExpanded ? (
              <FolderOpen className="h-4 w-4" />
            ) : (
              node.icon
            )}
          </span>
          <span className="text-sm truncate flex-1">{node.label}</span>
          
          {/* Validation Indicators */}
          {hasValidationIssues && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {validation.hasErrors && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                        <AlertCircle className="h-3 w-3 mr-0.5" />
                        {validation.errorCount}
                      </Badge>
                    )}
                    {validation.hasWarnings && (
                      <Badge variant="outline" className="h-5 px-1.5 text-xs text-yellow-600 border-yellow-600">
                        <AlertTriangle className="h-3 w-3 mr-0.5" />
                        {validation.warningCount}
                      </Badge>
                    )}
                    {validation.hasInfo && !validation.hasErrors && !validation.hasWarnings && (
                      <Badge variant="outline" className="h-5 px-1.5 text-xs text-blue-600 border-blue-600">
                        <InfoIcon className="h-3 w-3 mr-0.5" />
                        {validation.infoCount}
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-md">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Validation Issues:</p>
                    {validation.messages.slice(0, 3).map((msg, idx) => (
                      <div key={idx} className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          {msg.severity === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
                          {msg.severity === "warning" && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                          {msg.severity === "info" && <InfoIcon className="h-3 w-3 text-blue-600" />}
                          <span className="font-medium">{msg.code}</span>
                        </div>
                        <p className="text-muted-foreground">{msg.message}</p>
                      </div>
                    ))}
                    {validation.messages.length > 3 && (
                      <p className="text-xs text-muted-foreground italic">
                        +{validation.messages.length - 3} more issues
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {node.type}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children?.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {renderNode(tree)}
      </div>
    </ScrollArea>
  );
}
