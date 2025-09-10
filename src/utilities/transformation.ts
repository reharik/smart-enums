// serializeSmartEnums.ts
import { isSmartEnumItem } from '../enumeration.js';
import type {
  SerializedSmartEnums,
  RevivedSmartEnums,
  AnyEnumLike,
} from '../types.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

// use isSmartEnumItem from enumeration.ts

// Overloads:
// 1) Inferred
export function serializeSmartEnums<T>(input: T): SerializedSmartEnums<T>;
// 2) Return-type only (constrained to objects/arrays)
export function serializeSmartEnums<
  S extends Readonly<Record<string, unknown>> | readonly unknown[],
>(input: unknown): S;
// Implementation
export function serializeSmartEnums(input: unknown): unknown {
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

  return walk(input);
}

// Reverse with a simple field->enum map
// Overloads:
// 1) Inferred
export function reviveSmartEnums<
  T,
  const M extends Record<string, AnyEnumLike>,
>(input: T, enumByField: M): RevivedSmartEnums<T, M>;
// 2) Return-type only (constrained to objects/arrays)
export function reviveSmartEnums<
  R extends Readonly<Record<string, unknown>> | readonly unknown[],
>(input: unknown, enumByField: Record<string, AnyEnumLike>): R;
// Implementation
export function reviveSmartEnums(
  input: unknown,
  enumByField: Record<string, AnyEnumLike>,
): unknown {
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

  return walk(input);
}
