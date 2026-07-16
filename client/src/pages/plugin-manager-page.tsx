/**
 * Plugin Manager Page
 *
 * Main page for listing, enabling/disabling, and configuring plugins.
 */

import { AppLayout } from '@/features/app-shell';
import { PluginManager } from '@/features/plugin-manager';

export function PluginManagerPage() {
  return (
    <AppLayout>
      <PluginManager />
    </AppLayout>
  );
}
