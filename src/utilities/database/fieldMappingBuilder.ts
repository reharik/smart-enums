import { isSmartEnumItem } from '../../enumeration.js';
import type { AnyEnumLike } from '../../types.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Global state for automatic field mapping learning
 */
let globalEnumRegistry: Record<string, AnyEnumLike> | undefined;
let globalFieldMapping: Record<string, string[]> = {}; // property -> array of enum types

/**
 * Initializes the global smart enum mapping system
 */
export function initializeSmartEnumMappings(config: {
  enumRegistry: Record<string, AnyEnumLike>;
}): void {
  globalEnumRegistry = config.enumRegistry;
  globalFieldMapping = {};
}

/**
 * Learns from data using the global field mapping system
 */
export function learnFromData(data: unknown): void {
  if (!globalEnumRegistry) return;

  const seen = new WeakSet<object>();

  const walk = (v: unknown, propertyName?: string): void => {
    if (isSmartEnumItem(v) && propertyName) {
      // Record this property name as containing this enum type
      const enumTypeName = v.__smart_enum_type;

      if (!enumTypeName) return;

      // Add to the array of enum types for this property
      if (
        !globalFieldMapping[propertyName] ||
        !globalFieldMapping[propertyName].includes(enumTypeName)
      ) {
        globalFieldMapping[propertyName] = [
          ...(globalFieldMapping[propertyName] || []),
          enumTypeName,
        ];
      }
      return;
    }

    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) {
        return;
      }
      seen.add(v);
    }

    if (Array.isArray(v)) {
      for (const item of v) {
        walk(item, propertyName);
      }
    } else if (isPlainObject(v)) {
      for (const [key, value] of Object.entries(v)) {
        walk(value, key);
      }
    }
  };

  walk(data);
}

/**
 * Gets the learned mapping from the global field mapping system
 */
export function getLearnedMapping(): Record<string, string[]> {
  return { ...globalFieldMapping };
}

/**
 * Gets the global enum registry
 */
export function getGlobalEnumRegistry():
  | Record<string, AnyEnumLike>
  | undefined {
  return globalEnumRegistry;
}
