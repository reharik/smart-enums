import {
  debug,
  getGlobalEnumRegistry,
  getLearnedMapping,
  learnFromData,
  mergeFieldMappings,
  warn
} from "./chunk-QK3LQONE.js";
import {
  isSmartEnumItem
} from "./chunk-D33CA6PE.js";

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
function reviveFromDatabase(payload, options) {
  debug("Starting database revival", {
    hasOptions: !!options,
    manualMappings: options?.fieldEnumMapping ? Object.keys(options.fieldEnumMapping) : []
  });
  const globalEnumRegistry = getGlobalEnumRegistry();
  const learnedMapping = getLearnedMapping();
  if (!globalEnumRegistry) {
    warn("No global enum registry found, returning payload as-is");
    return payload;
  }
  const fieldEnumMapping = mergeFieldMappings(
    learnedMapping,
    options?.fieldEnumMapping
  );
  if (!fieldEnumMapping || Object.keys(fieldEnumMapping).length === 0) {
    warn("No field mappings available, returning payload as-is");
    return payload;
  }
  debug("Using field mappings for revival", {
    fieldCount: Object.keys(fieldEnumMapping).length,
    fields: Object.keys(fieldEnumMapping)
  });
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
        debug("Attempting enum revival", {
          property: propertyName,
          value: v,
          enumTypes: typesToTry
        });
        for (const enumType of typesToTry) {
          if (globalEnumRegistry[enumType]) {
            const enumItem = globalEnumRegistry[enumType].tryFromValue(v);
            if (enumItem) {
              debug("Successfully revived enum", {
                property: propertyName,
                value: v,
                enumType,
                enumItem: "revived"
              });
              return enumItem;
            }
          } else {
            debug("Enum type not found in registry", {
              enumType,
              availableTypes: Object.keys(globalEnumRegistry)
            });
          }
        }
        debug("Failed to revive enum", {
          property: propertyName,
          value: v,
          attemptedTypes: typesToTry
        });
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
//# sourceMappingURL=chunk-HA26V3IN.js.map