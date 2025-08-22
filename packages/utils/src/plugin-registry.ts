import type { Plugin, PluginRegistry } from '@tempeh/types';

// ============================================================================
// Plugin Registry Implementation
// ============================================================================

export class PluginRegistryImpl implements PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private capabilities: Map<string, Set<string>> = new Map();
  private keywords: Map<string, Set<string>> = new Map();

  register(plugin: Plugin): void {
    // Validate plugin ID uniqueness
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with ID '${plugin.id}' is already registered`);
    }

    // Register the plugin
    this.plugins.set(plugin.id, plugin);

    // Index capabilities
    for (const capability of plugin.capabilities) {
      const capabilityKey = `${capability.type}:${capability.name}`;
      if (!this.capabilities.has(capabilityKey)) {
        this.capabilities.set(capabilityKey, new Set());
      }
      const capabilitySet = this.capabilities.get(capabilityKey);
      if (capabilitySet) {
        capabilitySet.add(plugin.id);
      }
    }

    // Index keywords
    if (plugin.keywords) {
      for (const keyword of plugin.keywords) {
        if (!this.keywords.has(keyword)) {
          this.keywords.set(keyword, new Set());
        }
        const keywordSet = this.keywords.get(keyword);
        if (keywordSet) {
          keywordSet.add(plugin.id);
        }
      }
    }
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID '${pluginId}' is not registered`);
    }

    // Remove from plugins map
    this.plugins.delete(pluginId);

    // Remove from capabilities index
    for (const capability of plugin.capabilities) {
      const capabilityKey = `${capability.type}:${capability.name}`;
      const pluginSet = this.capabilities.get(capabilityKey);
      if (pluginSet) {
        pluginSet.delete(pluginId);
        if (pluginSet.size === 0) {
          this.capabilities.delete(capabilityKey);
        }
      }
    }

    // Remove from keywords index
    if (plugin.keywords) {
      for (const keyword of plugin.keywords) {
        const pluginSet = this.keywords.get(keyword);
        if (pluginSet) {
          pluginSet.delete(pluginId);
          if (pluginSet.size === 0) {
            this.keywords.delete(keyword);
          }
        }
      }
    }
  }

  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  findByCapability(capability: string): Plugin[] {
    const pluginIds = this.capabilities.get(capability);
    if (!pluginIds) {
      return [];
    }

    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is Plugin => plugin !== undefined);
  }

  findByKeyword(keyword: string): Plugin[] {
    const pluginIds = this.keywords.get(keyword);
    if (!pluginIds) {
      return [];
    }

    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is Plugin => plugin !== undefined);
  }

  // Additional utility methods
  findByType(type: string): Plugin[] {
    return this.list().filter(plugin => 
      plugin.capabilities.some(cap => cap.type === type)
    );
  }

  findByAuthor(author: string): Plugin[] {
    return this.list().filter(plugin => plugin.author === author);
  }

  findByVersion(version: string): Plugin[] {
    return this.list().filter(plugin => plugin.version === version);
  }

  getCapabilities(): string[] {
    return Array.from(this.capabilities.keys());
  }

  getKeywords(): string[] {
    return Array.from(this.keywords.keys());
  }

  getPluginCount(): number {
    return this.plugins.size;
  }

  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  clear(): void {
    this.plugins.clear();
    this.capabilities.clear();
    this.keywords.clear();
  }
}
