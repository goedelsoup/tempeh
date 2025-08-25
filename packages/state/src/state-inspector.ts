import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';
import type { StateInfo, StateResource } from '@tempeh/types';
import { StateError } from '@tempeh/types';
import type { ResourceFilter, StateAnalysis } from './types';

export class StateInspector {
  constructor(private state: Ref.Ref<StateInfo>) {}

  setState(state: StateInfo) {
    return Ref.set(this.state, state)
  }

  analyze(): Effect.Effect<StateAnalysis> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state) {
        throw new StateError({
          operation: 'analyze',
          message: 'No state loaded for analysis',
        });
      }

      const resourceTypes: Record<string, number> = {};
      const modules = new Set<string>();
      const outputs = Object.keys(state.outputs || {});

      for (const resource of state.resources) {
        // Count resource types
        resourceTypes[resource.type] = (resourceTypes[resource.type] || 0) + 1;

        // Collect modules
        if (resource.module) {
          modules.add(resource.module);
        }
      }

      return {
        totalResources: state.resources.length,
        resourceTypes,
        modules: Array.from(modules),
        outputs,
        terraformVersion: state.terraformVersion,
        stateVersion: Number.parseInt(state.version, 10)
      };
    });
  }

  findResources(filter: ResourceFilter): Effect.Effect<StateResource[]> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state) {
        return [];
      }

      return state.resources.filter((resource: StateResource) => {
        if (filter.type && resource.type !== filter.type) return false;
        if (filter.module && resource.module !== filter.module) return false;
        if (filter.name && resource.name !== filter.name) return false;
        return true;
      });
    });
  }

  getResourceDependencies(resource: StateResource): string[] {
    return resource.instances?.[0]?.dependencies || [];
  }

  getResourceAttributes(resource: StateResource): unknown {
    return resource.instances?.[0]?.attributes || {};
  }

  listResourceTypes(): Effect.Effect<string[]> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state) {
        return [];
      }

      const types = new Set<string>();
      for (const resource of state.resources) {
        types.add(resource.type);
      }
      return Array.from(types);
    });
  }

  listModules(): Effect.Effect<string[]> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state) {
        return [];
      }

      const modules = new Set<string>();
      for (const resource of state.resources) {
        if (resource.module) {
          modules.add(resource.module);
        }
      }
      return Array.from(modules);
    });
  }

  listOutputs(): Effect.Effect<string[]> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state?.outputs) {
        return [];
      }

      const outputs: string[] = [];
      for (const [name] of Object.entries(state.outputs)) {
        outputs.push(name);
      }
      return outputs;
    });
  }

  getOutput(name: string): Effect.Effect<unknown> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state?.outputs) {
        return undefined;
      }

      return state.outputs[name];
    });
  }

  validateState(): Effect.Effect<boolean> {
    return Effect.gen(this, function* (_) {
      const state = yield* _(Ref.get(this.state));
      
      if (!state.version) {
        return false;
      }

      if (!state.terraformVersion) {
        return false;
      }

      if (!Array.isArray(state.resources)) {
        return false;
      }

      if (typeof state.outputs !== 'object') {
        return false;
      }

      return true;
    });
  }
}
