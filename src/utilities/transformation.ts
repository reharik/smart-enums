// serializeSmartEnums.ts
import { isSmartEnumItem } from '../enumeration.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

// use isSmartEnumItem from enumeration.ts

export function serializeSmartEnums<T>(input: T): T {
  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown): unknown => {
    if (isSmartEnumItem(v)) return v.value;
    if (Array.isArray(v)) {
      if (seen.has(v)) return seen.get(v);
      const arr: unknown[] = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
      return arr;
    }
    if (isPlainObject(v)) {
      if (seen.has(v)) return seen.get(v);
      const out: PlainObject = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };

  return walk(input) as T;
}

// Reverse with a simple field->enum map
type EnumLike = {
  tryFromValue: (
    value?: string | null,
  ) => { key: string; value: string } | undefined;
};

export function reviveSmartEnums<T>(
  input: T,
  enumByField: Record<string, EnumLike>,
): T {
  const seen = new WeakMap<object, unknown>();

  const walk = (v: unknown, parentKey?: string): unknown => {
    if (typeof v === 'string' && parentKey && enumByField[parentKey]) {
      return enumByField[parentKey].tryFromValue(v) ?? v;
    }
    if (Array.isArray(v)) {
      if (seen.has(v)) return seen.get(v);
      const arr: unknown[] = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
      return arr;
    }
    if (isPlainObject(v)) {
      if (seen.has(v)) return seen.get(v);
      const out: PlainObject = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val, k);
      }
      return out;
    }
    return v;
  };

  return walk(input) as T;
}
