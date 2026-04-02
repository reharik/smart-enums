import {
  isSmartEnumItem
} from "./chunk-NASPJET6.js";

// src/db/prepareForDatabase.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
var prepareForDatabase = (payload) => {
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (v) => {
    if (isSmartEnumItem(v)) {
      return v.value;
    }
    if (typeof v === "object" && v !== null && seen.has(v)) {
      return seen.get(v);
    }
    if (Array.isArray(v)) {
      const arr = [];
      seen.set(v, arr);
      for (const item of v) {
        arr.push(walk(item));
      }
      return arr;
    }
    if (isPlainObject(v)) {
      const out = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(payload);
};

// src/db/enumRevivalError.ts
var EnumRevivalError = class extends Error {
  constructor(message, path, value) {
    super(message);
    this.path = path;
    this.value = value;
    this.name = "EnumRevivalError";
  }
};

// src/db/reviveRowFromDatabase.ts
var reviveRowFromDatabase = (row, options) => {
  const { fieldEnumMapping, strict = false } = options;
  const out = { ...row };
  for (const [field, smartEnum] of Object.entries(fieldEnumMapping)) {
    if (!Object.hasOwn(out, field)) {
      continue;
    }
    const raw = out[field];
    if (typeof raw !== "string") {
      continue;
    }
    const revived = smartEnum.tryFromValue(raw);
    if (revived !== void 0) {
      out[field] = revived;
    } else if (strict) {
      throw new EnumRevivalError(
        `Cannot revive field ${JSON.stringify(field)}: unknown enum value ${JSON.stringify(raw)}`,
        field,
        raw
      );
    }
  }
  return out;
};

// src/db/revivePayloadFromDatabase.ts
var isObjectRecord = (x) => typeof x === "object" && x !== null && !Array.isArray(x);
var parsePath = (pathStr) => {
  const tokens = pathStr.split(".").filter(Boolean);
  const segs = [];
  for (const token of tokens) {
    if (token.endsWith("[]")) {
      const name = token.slice(0, -2);
      if (name.length === 0) {
        throw new Error(
          `Invalid enum revival path "${pathStr}": empty key before []`
        );
      }
      segs.push({ type: "prop", name }, { type: "arrayEach" });
    } else {
      segs.push({ type: "prop", name: token });
    }
  }
  const last = segs[segs.length - 1];
  if (!last || last.type !== "prop") {
    throw new Error(
      `Invalid enum revival path "${pathStr}": must end with a property name (not [])`
    );
  }
  return segs;
};
var reviveLeaf = (host, key, smartEnum, strict, pathLabel) => {
  const raw = host[key];
  if (typeof raw !== "string") {
    return;
  }
  const revived = smartEnum.tryFromValue(raw);
  if (revived !== void 0) {
    host[key] = revived;
  } else if (strict) {
    throw new EnumRevivalError(
      `Cannot revive path "${pathLabel}": unknown enum value ${JSON.stringify(raw)}`,
      pathLabel,
      raw
    );
  }
};
var walkPath = (value, segs, segIndex, smartEnum, strict, pathLabel) => {
  const seg = segs[segIndex];
  if (seg === void 0) {
    return;
  }
  const isLast = segIndex === segs.length - 1;
  if (isLast) {
    if (seg.type !== "prop") {
      return;
    }
    if (!isObjectRecord(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected object at parent of "${seg.name}"`,
          pathLabel,
          value
        );
      }
      return;
    }
    reviveLeaf(value, seg.name, smartEnum, strict, pathLabel);
    return;
  }
  if (seg.type === "prop") {
    if (!isObjectRecord(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected object at "${seg.name}"`,
          pathLabel,
          value
        );
      }
      return;
    }
    walkPath(value[seg.name], segs, segIndex + 1, smartEnum, strict, pathLabel);
    return;
  }
  if (seg.type === "arrayEach") {
    if (!Array.isArray(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected array before nested path`,
          pathLabel,
          value
        );
      }
      return;
    }
    for (const el of value) {
      walkPath(el, segs, segIndex + 1, smartEnum, strict, pathLabel);
    }
  }
};
var revivePayloadFromDatabase = (payload, options) => {
  const { pathEnumMapping, strict = false } = options;
  const root = structuredClone(payload);
  for (const [pathStr, smartEnum] of Object.entries(pathEnumMapping)) {
    const segs = parsePath(pathStr);
    walkPath(root, segs, 0, smartEnum, strict, pathStr);
  }
  return root;
};

export {
  prepareForDatabase,
  EnumRevivalError,
  reviveRowFromDatabase,
  revivePayloadFromDatabase
};
//# sourceMappingURL=chunk-X4ZNSEK7.js.map