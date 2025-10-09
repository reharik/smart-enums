import { debug, warn } from '../logger.js';

import {
  getLearnedMapping,
  getGlobalEnumRegistry,
  mergeFieldMappings,
} from './fieldMappingBuilder.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Revives enum values from database records.
 * Use this when loading data from the database where enums are stored as string values.
 * Uses the global configuration set up with initializeSmartEnumMappings().
 *
 * @param payload - The data loaded from database
 * @param options - Optional configuration for manual field mappings
 * @returns The payload with string enum values converted back to enum items
 *
 * @example
 * ```typescript
 * // First, initialize the global configuration
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 *
 * // Option 1: Pure learning (uses learned mappings only)
 * const revivedData = reviveFromDatabase(dbRecord);
 *
 * // Option 2: Manual fallback when no learning has occurred yet
 * const revivedData = reviveFromDatabase(dbRecord, {
 *   fieldEnumMapping: {
 *     status: ['UserStatus', 'OrderStatus'],
 *     priority: ['Priority'],
 *   }
 * });
 *
 * // Option 3: Hybrid - manual mappings + learning (manual takes precedence)
 * // Manual mappings work immediately, learning improves over time
 * ```
 */
export function reviveFromDatabase<T>(
  payload: unknown,
  options?: {
    fieldEnumMapping?: Record<string, string[]>;
  },
): T {
  debug('Starting database revival', {
    hasOptions: !!options,
    manualMappings: options?.fieldEnumMapping
      ? Object.keys(options.fieldEnumMapping)
      : [],
  });

  // Get global configuration
  const globalEnumRegistry = getGlobalEnumRegistry();
  const learnedMapping = getLearnedMapping();

  if (!globalEnumRegistry) {
    warn('No global enum registry found, returning payload as-is');
    return payload as T;
  }

  // Merge learned mappings with manual mappings (manual takes precedence)
  const fieldEnumMapping = mergeFieldMappings(
    learnedMapping,
    options?.fieldEnumMapping,
  );

  if (!fieldEnumMapping || Object.keys(fieldEnumMapping).length === 0) {
    warn('No field mappings available, returning payload as-is');
    return payload as T;
  }

  debug('Using field mappings for revival', {
    fieldCount: Object.keys(fieldEnumMapping).length,
    fields: Object.keys(fieldEnumMapping),
  });

  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown, propertyName?: string): unknown => {
    if (typeof v === 'object' && v !== null && seen.has(v)) {
      return seen.get(v);
    }

    if (Array.isArray(v)) {
      const arr: unknown[] = [];
      seen.set(v, arr);
      for (const item of v) {
        arr.push(walk(item, propertyName));
      }
      return arr;
    }
    if (isPlainObject(v)) {
      const out: PlainObject = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val, k);
      }
      return out;
    }

    // Check if this string value should be converted to an enum
    if (typeof v === 'string' && propertyName && fieldEnumMapping) {
      const enumTypes = fieldEnumMapping[propertyName];

      if (enumTypes) {
        // Handle both array format (from auto-learning) and single string format (manual)
        const typesToTry = Array.isArray(enumTypes) ? enumTypes : [enumTypes];

        debug('Attempting enum revival', {
          property: propertyName,
          value: v,
          enumTypes: typesToTry,
        });

        for (const enumType of typesToTry) {
          if (globalEnumRegistry[enumType]) {
            const enumItem = globalEnumRegistry[enumType].tryFromValue(v);
            if (enumItem) {
              debug('Successfully revived enum', {
                property: propertyName,
                value: v,
                enumType,
                enumItem: 'revived',
              });
              return enumItem;
            }
          } else {
            debug('Enum type not found in registry', {
              enumType,
              availableTypes: Object.keys(globalEnumRegistry),
            });
          }
        }

        debug('Failed to revive enum', {
          property: propertyName,
          value: v,
          attemptedTypes: typesToTry,
        });
      }
    }

    return v;
  };

  return walk(payload) as T;
}
