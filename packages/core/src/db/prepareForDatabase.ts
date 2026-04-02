import { isSmartEnumItem } from '../utilities/typeGuards.js';
import type { DatabaseFormat } from '../types.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Recursively replaces smart enum items with their `.value` strings for persistence.
 * Inbound revival requires explicit mapping (`reviveRowFromDatabase`, etc.).
 */
export const prepareForDatabase = <T>(payload: T): DatabaseFormat<T> => {
  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown): unknown => {
    if (isSmartEnumItem(v)) {
      return v.value;
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
};
