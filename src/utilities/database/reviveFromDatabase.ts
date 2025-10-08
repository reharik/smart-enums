import {
  getLearnedMapping,
  getGlobalEnumRegistry,
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
 * @returns The payload with string enum values converted back to enum items
 *
 * @example
 * ```typescript
 * // First, initialize the global configuration
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 *
 * // Then revive using global config
 * const revivedData = reviveFromDatabase(dbRecord);
 * ```
 */
export function reviveFromDatabase<T>(payload: unknown): T {
  // Get global configuration
  const globalEnumRegistry = getGlobalEnumRegistry();
  const learnedMapping = getLearnedMapping();

  if (!globalEnumRegistry) {
    // If no global configuration, return as-is
    return payload as T;
  }

  // Use learned mappings
  const fieldEnumMapping = learnedMapping;

  if (!fieldEnumMapping || Object.keys(fieldEnumMapping).length === 0) {
    // If no field mapping provided, return as-is
    return payload as T;
  }

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

        for (const enumType of typesToTry) {
          if (globalEnumRegistry[enumType]) {
            const enumItem = globalEnumRegistry[enumType].tryFromValue(v);
            if (enumItem) {
              return enumItem;
            }
          }
        }
      }
    }

    return v;
  };

  return walk(payload) as T;
}
