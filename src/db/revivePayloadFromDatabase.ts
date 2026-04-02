import type { RevivePayloadOptions, SmartEnumLike } from '../types.js';

import { EnumRevivalError } from './enumRevivalError.js';

type PlainObject = Record<string, unknown>;

/** Plain data objects (including `structuredClone` output where prototype may not be Object.prototype). */
const isObjectRecord = (x: unknown): x is PlainObject =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

type PathSeg =
  | { type: 'prop'; name: string }
  | { type: 'arrayEach' };

const parsePath = (pathStr: string): PathSeg[] => {
  const tokens = pathStr.split('.').filter(Boolean);
  const segs: PathSeg[] = [];

  for (const token of tokens) {
    if (token.endsWith('[]')) {
      const name = token.slice(0, -2);
      if (name.length === 0) {
        throw new Error(
          `Invalid enum revival path "${pathStr}": empty key before []`,
        );
      }
      segs.push({ type: 'prop', name }, { type: 'arrayEach' });
    } else {
      segs.push({ type: 'prop', name: token });
    }
  }

  const last = segs[segs.length - 1];
  if (!last || last.type !== 'prop') {
    throw new Error(
      `Invalid enum revival path "${pathStr}": must end with a property name (not [])`,
    );
  }

  return segs;
};

const reviveLeaf = (
  host: PlainObject,
  key: string,
  smartEnum: SmartEnumLike,
  strict: boolean,
  pathLabel: string,
): void => {
  const raw = host[key];
  if (typeof raw !== 'string') {
    return;
  }
  const revived = smartEnum.tryFromValue(raw);
  if (revived !== undefined) {
    host[key] = revived as unknown;
  } else if (strict) {
    throw new EnumRevivalError(
      `Cannot revive path "${pathLabel}": unknown enum value ${JSON.stringify(raw)}`,
      pathLabel,
      raw,
    );
  }
};

const walkPath = (
  value: unknown,
  segs: PathSeg[],
  segIndex: number,
  smartEnum: SmartEnumLike,
  strict: boolean,
  pathLabel: string,
): void => {
  const seg = segs[segIndex];
  if (seg === undefined) {
    return;
  }

  const isLast = segIndex === segs.length - 1;

  if (isLast) {
    if (seg.type !== 'prop') {
      return;
    }
    if (!isObjectRecord(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected object at parent of "${seg.name}"`,
          pathLabel,
          value,
        );
      }
      return;
    }
    reviveLeaf(value, seg.name, smartEnum, strict, pathLabel);
    return;
  }

  if (seg.type === 'prop') {
    if (!isObjectRecord(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected object at "${seg.name}"`,
          pathLabel,
          value,
        );
      }
      return;
    }
    walkPath(value[seg.name], segs, segIndex + 1, smartEnum, strict, pathLabel);
    return;
  }

  if (seg.type === 'arrayEach') {
    if (!Array.isArray(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected array before nested path`,
          pathLabel,
          value,
        );
      }
      return;
    }
    for (const el of value) {
      walkPath(el, segs, segIndex + 1, smartEnum, strict, pathLabel);
    }
  }
};

export const revivePayloadFromDatabase = <T>(
  payload: T,
  options: RevivePayloadOptions,
): T => {
  const { pathEnumMapping, strict = false } = options;
  const root = structuredClone(payload) as T;

  for (const [pathStr, smartEnum] of Object.entries(pathEnumMapping)) {
    const segs = parsePath(pathStr);
    walkPath(root as unknown, segs, 0, smartEnum, strict, pathStr);
  }

  return root;
};
