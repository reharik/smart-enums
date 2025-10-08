import {
  getLearnedMapping,
  learnFromData
} from "./chunk-P7T3KURX.js";
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
function reviveFromDatabase(payload, config) {
  const learnedMapping = getLearnedMapping();
  const manualArrayMapping = {};
  if (config.fieldEnumMapping) {
    for (const [property, enumType] of Object.entries(
      config.fieldEnumMapping
    )) {
      manualArrayMapping[property] = Array.isArray(enumType) ? enumType : [enumType];
    }
  }
  const fieldEnumMapping = { ...learnedMapping, ...manualArrayMapping };
  if (!fieldEnumMapping) {
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
  return walk(payload);
}

export {
  prepareForDatabase,
  reviveFromDatabase
};
//# sourceMappingURL=chunk-ZBW5YJOG.js.map