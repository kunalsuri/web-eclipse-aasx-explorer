/**
 * Plugin Settings Dialog Component
 * 
 * Displays and allows editing of plugin configuration settings.
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface PluginSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  pluginId: string;
  pluginName: string;
  config: Record<string, any>;
  configSchema?: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
}

export const PluginSettingsDialog: React.FC<PluginSettingsDialogProps> = ({
  open,
  onClose,
  pluginId,
  pluginName,
  config,
  configSchema,
  onSave,
}) => {
  const [editedConfig, setEditedConfig] = useState(config);

  const handleSave = () => {
    onSave(editedConfig);
    onClose();
  };

  const renderField = (key: string, value: any, schema?: any) => {
    const fieldSchema = schema?.properties?.[key];
    const fieldType = fieldSchema?.type || typeof value;

    switch (fieldType) {
      case "boolean":
        return (
          <div key={key} className="flex items-center justify-between space-x-2">
            <Label htmlFor={key} className="flex-1">
              {fieldSchema?.title || key}
              {fieldSchema?.description && (
                <span className="block text-sm text-muted-foreground font-normal">
                  {fieldSchema.description}
                </span>
              )}
            </Label>
            <Switch
              id={key}
              checked={editedConfig[key] || false}
              onCheckedChange={(checked) =>
                setEditedConfig({ ...editedConfig, [key]: checked })
              }
            />
          </div>
        );

      case "number":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {fieldSchema?.title || key}
              {fieldSchema?.description && (
                <span className="block text-sm text-muted-foreground font-normal">
                  {fieldSchema.description}
                </span>
              )}
            </Label>
            <Input
              id={key}
              type="number"
              value={editedConfig[key] || ""}
              onChange={(e) =>
                setEditedConfig({
                  ...editedConfig,
                  [key]: parseFloat(e.target.value),
                })
              }
              min={fieldSchema?.minimum}
              max={fieldSchema?.maximum}
            />
          </div>
        );

      case "string":
        if (fieldSchema?.enum) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {fieldSchema?.title || key}
                {fieldSchema?.description && (
                  <span className="block text-sm text-muted-foreground font-normal">
                    {fieldSchema.description}
                  </span>
                )}
              </Label>
              <select
                id={key}
                value={editedConfig[key] || ""}
                onChange={(e) =>
                  setEditedConfig({ ...editedConfig, [key]: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                {fieldSchema.enum.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (fieldSchema?.format === "textarea") {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {fieldSchema?.title || key}
                {fieldSchema?.description && (
                  <span className="block text-sm text-muted-foreground font-normal">
                    {fieldSchema.description}
                  </span>
                )}
              </Label>
              <Textarea
                id={key}
                value={editedConfig[key] || ""}
                onChange={(e) =>
                  setEditedConfig({ ...editedConfig, [key]: e.target.value })
                }
                rows={4}
              />
            </div>
          );
        }

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>
              {fieldSchema?.title || key}
              {fieldSchema?.description && (
                <span className="block text-sm text-muted-foreground font-normal">
                  {fieldSchema.description}
                </span>
              )}
            </Label>
            <Input
              id={key}
              type="text"
              value={editedConfig[key] || ""}
              onChange={(e) =>
                setEditedConfig({ ...editedConfig, [key]: e.target.value })
              }
              maxLength={fieldSchema?.maxLength}
            />
          </div>
        );

      default:
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key}</Label>
            <Input
              id={key}
              type="text"
              value={JSON.stringify(editedConfig[key] || "")}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditedConfig({ ...editedConfig, [key]: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {pluginName}</DialogTitle>
          <DialogDescription>
            Adjust plugin settings. Changes will be applied immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.keys(editedConfig).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              This plugin has no configuration options.
            </p>
          ) : (
            Object.keys(editedConfig).map((key) =>
              renderField(key, editedConfig[key], configSchema)
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
