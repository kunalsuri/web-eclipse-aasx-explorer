/**
 * Plugin Manager Feature
 * 
 * Main component for managing plugins - listing, enabling/disabling,
 * and configuring plugins.
 */

import React, { useState, useEffect } from "react";
import { PluginList, type Plugin } from "./components/PluginList";
import { PluginSettingsDialog } from "./components/PluginSettingsDialog";
import { useToast } from "@/hooks/use-toast";

export const PluginManager: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const response = await fetch("/api/plugins");
      if (!response.ok) throw new Error("Failed to load plugins");
      
      const data = await response.json();
      setPlugins(data.plugins || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load plugins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? "enable" : "disable";
      const response = await fetch(`/api/plugins/${pluginId}/${endpoint}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(`Failed to ${endpoint} plugin`);

      // Reload plugins to get updated state
      await loadPlugins();

      toast({
        title: "Success",
        description: `Plugin ${enabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${enabled ? "enable" : "disable"} plugin`,
        variant: "destructive",
      });
    }
  };

  const handleConfigure = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin) {
      setSelectedPlugin(plugin);
      setSettingsOpen(true);
    }
  };

  const handleShowInfo = (pluginId: string) => {
    const plugin = plugins.find((p) => p.id === pluginId);
    if (plugin) {
      toast({
        title: plugin.name,
        description: `Version: ${plugin.version}\nAuthor: ${plugin.author.name}\n${plugin.description}`,
      });
    }
  };

  const handleSaveSettings = async (config: Record<string, any>) => {
    if (!selectedPlugin) return;

    try {
      const response = await fetch(`/api/plugins/${selectedPlugin.id}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) throw new Error("Failed to save settings");

      // Reload plugins to get updated config
      await loadPlugins();

      toast({
        title: "Success",
        description: "Plugin settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save plugin settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading plugins...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plugin Manager</h1>
        <p className="text-muted-foreground mt-2">
          Manage and configure application plugins
        </p>
      </div>

      <PluginList
        plugins={plugins}
        onToggle={handleToggle}
        onConfigure={handleConfigure}
        onShowInfo={handleShowInfo}
      />

      {selectedPlugin && (
        <PluginSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          pluginId={selectedPlugin.id}
          pluginName={selectedPlugin.name}
          config={selectedPlugin.config || {}}
          configSchema={selectedPlugin.configSchema}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
};
