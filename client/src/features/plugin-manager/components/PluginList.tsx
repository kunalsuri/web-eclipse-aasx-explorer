/**
 * Plugin List Component
 * 
 * Displays a list of all available plugins with their status,
 * enable/disable toggles, and configuration options.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Info, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
  };
  enabled: boolean;
  state: "unloaded" | "loading" | "loaded" | "initializing" | "initialized" | "activating" | "active" | "deactivating" | "deactivated" | "error";
  error?: string;
  config?: Record<string, any>;
  configSchema?: Record<string, any>;
}

interface PluginListProps {
  plugins: Plugin[];
  onToggle: (pluginId: string, enabled: boolean) => void;
  onConfigure: (pluginId: string) => void;
  onShowInfo: (pluginId: string) => void;
}

export const PluginList: React.FC<PluginListProps> = ({
  plugins,
  onToggle,
  onConfigure,
  onShowInfo,
}) => {
  const getStateIcon = (state: Plugin["state"]) => {
    switch (state) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "loading":
      case "initializing":
      case "activating":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStateBadge = (state: Plugin["state"]) => {
    const variants: Record<Plugin["state"], "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      error: "destructive",
      loading: "secondary",
      initializing: "secondary",
      activating: "secondary",
      deactivating: "secondary",
      loaded: "outline",
      initialized: "outline",
      deactivated: "outline",
      unloaded: "outline",
    };

    return (
      <Badge variant={variants[state]} className="capitalize">
        {state}
      </Badge>
    );
  };

  if (plugins.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>No plugins available</p>
            <p className="text-sm mt-2">
              Add plugins to the <code className="bg-muted px-1 py-0.5 rounded">plugins/</code> directory
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {plugins.map((plugin) => (
        <Card key={plugin.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getStateIcon(plugin.state)}
                  <CardTitle className="text-lg">{plugin.name}</CardTitle>
                  {getStateBadge(plugin.state)}
                </div>
                <CardDescription className="mt-1">
                  {plugin.description}
                </CardDescription>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>v{plugin.version}</span>
                  <span>•</span>
                  <span>{plugin.author.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onShowInfo(plugin.id)}
                  title="Plugin information"
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onConfigure(plugin.id)}
                  disabled={!plugin.enabled}
                  title="Configure plugin"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Switch
                  checked={plugin.enabled}
                  onCheckedChange={(checked) => onToggle(plugin.id, checked)}
                  disabled={plugin.state === "loading" || plugin.state === "initializing"}
                />
              </div>
            </div>
          </CardHeader>
          {plugin.error && (
            <CardContent>
              <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
                <strong>Error:</strong> {plugin.error}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
