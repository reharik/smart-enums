import {
  getGlobalEnumRegistry,
  learnFromData
} from "./chunk-NQ2GSPII.js";
import {
  isSerializedSmartEnumItem,
  isSmartEnumItem
} from "./chunk-EA5ZVF26.js";

// src/utilities/transformation.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
function serializeSmartEnums(input) {
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (v) => {
    if (isSmartEnumItem(v)) {
      return {
        __smart_enum_type: v.__smart_enum_type,
        value: v.value
      };
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
  return walk(input);
}
function reviveSmartEnums(input, registry) {
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (v) => {
    if (isSerializedSmartEnumItem(v)) {
      const enumInstance = registry[v.__smart_enum_type];
      if (enumInstance) {
        const enumItem = enumInstance.tryFromValue(v.value);
        if (enumItem) {
          return enumItem;
        }
        const key = v.value.toLowerCase();
        const enumItemFromKey = enumInstance.tryFromKey(key);
        if (enumItemFromKey) {
          return enumItemFromKey;
        }
      }
      return v;
    }
    if (typeof v === "object" && v !== null && seen.has(v)) {
      return seen.get(v);
    }
    if (Array.isArray(v)) {
      const arr = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
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
  return walk(input);
}

// src/utilities/transport/reviveAfterTransport.ts
function reviveAfterTransport(payload) {
  const globalEnumRegistry = getGlobalEnumRegistry();
  if (!globalEnumRegistry) {
    return payload;
  }
  return reviveSmartEnums(payload, globalEnumRegistry);
}

// src/utilities/transport/serializeForTransport.ts
function serializeForTransport(payload) {
  learnFromData(payload);
  return serializeSmartEnums(payload);
}

export {
  serializeSmartEnums,
  reviveSmartEnums,
  reviveAfterTransport,
  serializeForTransport
};
//# sourceMappingURL=chunk-3BU3UIKP.js.map