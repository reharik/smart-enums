import { isSmartEnumItem } from '../typeGuards.js';
import type { DatabaseFormat } from '../../types.js';

import { learnFromData } from './fieldMappingBuilder.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Converts enum items to their string values for database storage.
 * Use this when saving data to the database where only enum values are stored.
 * Automatically learns field mappings for future database operations.
 *
 * @param payload - The data to save to database
 * @returns The payload with enum items converted to their string values
 *
 * @example
 * ```typescript
 * // API has: { user: { status: UserStatus.ACTIVE } }
 * const dbData = prepareForDatabase(userData);
 * // Result: { user: { status: 'ACTIVE' } }
 * // Also learns: { status: ['UserStatus'] } for future database operations
 * ```
 */
export function prepareForDatabase<T>(payload: T): DatabaseFormat<T> {
  // Learn from the data before converting
  learnFromData(payload);

  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown): unknown => {
    if (isSmartEnumItem(v)) {
      return v.value; // Return just the string value
    }

    if (typeof v === 'object' && v !== null && seen.has(v)) {
      return seen.get(v);
    }

    if (Array.isArray(v)) {
      const arr: unknown[] = [];
      seen.set(v, arr);
      for (const item of v) {
        arr.push(walk(item));
      }
      return arr;
    }
    if (isPlainObject(v)) {
      const out: PlainObject = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };

  return walk(payload) as DatabaseFormat<T>;
}
