import type { SmartApiHelperConfig } from '../../types.js';

import { getLearnedMapping } from './fieldMappingBuilder.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Revives enum values from database records.
 * Use this when loading data from the database where enums are stored as string values.
 *
 * @param payload - The data loaded from database
 * @param config - Configuration containing enum registry and field mapping
 * @returns The payload with string enum values converted back to enum items
 *
 * @example
 * ```typescript
 * // Basic usage with manual mapping
 * const revivedData = reviveFromDatabase(dbRecord, {
 *   enumRegistry: { UserStatus },
 *   fieldEnumMapping: { 'user.status': 'UserStatus', 'user.profile.priority': 'Priority' }
 * });
 *
 * // Auto-learning from operations
 * const revivedData = reviveFromDatabase(dbRecord, {
 *   enumRegistry: { UserStatus, Priority },
 *   autoLearn: true
 * });
 * ```
 */
export function reviveFromDatabase<T>(
  payload: unknown,
  config: SmartApiHelperConfig,
): T {
  // Use learned mappings from previous operations (if initialized)
  const learnedMapping = getLearnedMapping();

  // Convert manual mappings to array format and merge with learned mappings
  const manualArrayMapping: Record<string, string[]> = {};
  if (config.fieldEnumMapping) {
    for (const [property, enumType] of Object.entries(
      config.fieldEnumMapping,
    )) {
      // Check if enumType is already an array (new format) or a string (old format)
      manualArrayMapping[property] = Array.isArray(enumType)
        ? enumType
        : [enumType];
    }
  }

  // Learned mappings take precedence, manual mappings override
  const fieldEnumMapping = { ...learnedMapping, ...manualArrayMapping };

  if (!fieldEnumMapping) {
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
          if (config.enumRegistry[enumType]) {
            const enumItem = config.enumRegistry[enumType].tryFromValue(v);
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
