// serializeSmartEnums.ts
export { isSmartEnumItem, isSmartEnum } from './typeGuards.js';
import type { SerializedSmartEnums, AnyEnumLike } from '../types.js';

import { debug } from './logger.js';
import { isSerializedSmartEnumItem, isSmartEnumItem } from './typeGuards.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Recursively replaces Smart Enum items with self-describing objects
 * `{ __smart_enum_type, value }` for JSON transport or storage.
 *
 * @param input - Object or array that may contain enum items
 * @returns Same structure with enum items replaced by serialized shape
 *
 * @example
 * ```typescript
 * const dto = { id: '1', status: Status.active, color: Color.red };
 * const wire = serializeSmartEnums(dto);
 * // wire: { id: '1', status: { __smart_enum_type: 'Status', value: 'ACTIVE' }, color: { __smart_enum_type: 'Color', value: 'RED' } }
 * ```
 */
// Overloads:
// 1) Inferred
export function serializeSmartEnums<T>(input: T): SerializedSmartEnums<T>;
// 2) Return-type only (constrained to objects/arrays)
export function serializeSmartEnums<
  S extends Readonly<PlainObject> | readonly unknown[],
>(input: unknown): S;
// Implementation
export function serializeSmartEnums(input: unknown): unknown {
  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown): unknown => {
    if (isSmartEnumItem(v)) {
      return {
        __smart_enum_type: v.__smart_enum_type,
        value: v.value,
      };
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

  return walk(input);
}

/**
 * Recursively revives serialized enum objects back to Smart Enum items
 * using a registry of enum types. Expects payload to contain
 * `{ __smart_enum_type, value }` where the type exists in the registry.
 *
 * @param input - Serialized payload (e.g. from JSON)
 * @param registry - Map of enum type name to enum object (e.g. `{ Status, Color }`)
 * @returns Payload with serialized enums revived to enum items
 *
 * @example
 * ```typescript
 * const wire = { status: { __smart_enum_type: 'Status', value: 'ACTIVE' } };
 * const revived = reviveSmartEnums(wire, { Status, Color });
 * // revived.status === Status.active
 * ```
 */
export function reviveSmartEnums<R>(
  input: unknown,
  registry: Record<string, AnyEnumLike>,
): R {
  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown): unknown => {
    // Handle self-describing enum objects with __smart_enum_type and value
    if (isSerializedSmartEnumItem(v)) {
      debug(`Found serialized smartEnum: ${v.__smart_enum_type}`);
      const enumInstance = registry[v.__smart_enum_type];
      if (enumInstance) {
        debug(`Found enumInstance in registry: ${v.__smart_enum_type}`);
        // Try to find the enum item by value first
        const enumItem = enumInstance.tryFromValue(v.value);
        if (enumItem) {
          debug(`Revived enumItem using value: ${v.value}`);
          return enumItem;
        }
        // If that fails, try to find by key (convert value to key format)
        const key = v.value.toLowerCase();
        const enumItemFromKey = enumInstance.tryFromKey(key);
        if (enumItemFromKey) {
          debug(`Revived enumItem using key: ${key}`);
          return enumItemFromKey;
        }
      }
      // If no matching enum type in registry, return the original serialized object
      return v;
    }

    if (typeof v === 'object' && v !== null && seen.has(v)) {
      return seen.get(v);
    }

    if (Array.isArray(v)) {
      const arr: unknown[] = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
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
  return walk(input) as R;
}
