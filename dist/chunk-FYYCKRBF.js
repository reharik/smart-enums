import {
  getGlobalEnumRegistry,
  getLearnedMapping,
  learnFromData
} from "./chunk-NQ2GSPII.js";
import {
  isSmartEnumItem
} from "./chunk-EA5ZVF26.js";

// src/utilities/database/prepareForDatabase.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
function prepareForDatabase(payload) {
  learnFromData(payload);
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
}

// src/utilities/database/reviveFromDatabase.ts
var isPlainObject2 = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
function reviveFromDatabase(payload) {
  const globalEnumRegistry = getGlobalEnumRegistry();
  const learnedMapping = getLearnedMapping();
  if (!globalEnumRegistry) {
    return payload;
  }
  const fieldEnumMapping = learnedMapping;
  if (!fieldEnumMapping || Object.keys(fieldEnumMapping).length === 0) {
    return payload;
  }
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (v, propertyName) => {
    if (typeof v === "object" && v !== null && seen.has(v)) {
      return seen.get(v);
    }
    if (Array.isArray(v)) {
      const arr = [];
      seen.set(v, arr);
      for (const item of v) {
        arr.push(walk(item, propertyName));
      }
      return arr;
    }
    if (isPlainObject2(v)) {
      const out = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val, k);
      }
      return out;
    }
    if (typeof v === "string" && propertyName && fieldEnumMapping) {
      const enumTypes = fieldEnumMapping[propertyName];
      if (enumTypes) {
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
  return walk(payload);
}

export {
  prepareForDatabase,
  reviveFromDatabase
};
//# sourceMappingURL=chunk-FYYCKRBF.js.map