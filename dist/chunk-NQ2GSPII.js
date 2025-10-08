import {
  isSmartEnumItem
} from "./chunk-EA5ZVF26.js";

// src/utilities/database/fieldMappingBuilder.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
var globalEnumRegistry;
var globalFieldMapping = {};
function initializeSmartEnumMappings(config) {
  globalEnumRegistry = config.enumRegistry;
  globalFieldMapping = {};
}
function learnFromData(data) {
  if (!globalEnumRegistry) return;
  const seen = /* @__PURE__ */ new WeakSet();
  const walk = (v, propertyName) => {
    if (isSmartEnumItem(v) && propertyName) {
      const enumTypeName = v.__smart_enum_type;
      if (!enumTypeName) return;
      if (!globalFieldMapping[propertyName] || !globalFieldMapping[propertyName].includes(enumTypeName)) {
        globalFieldMapping[propertyName] = [
          ...globalFieldMapping[propertyName] || [],
          enumTypeName
        ];
      }
      return;
    }
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) {
        return;
      }
      seen.add(v);
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        walk(item, propertyName);
      }
    } else if (isPlainObject(v)) {
      for (const [key, value] of Object.entries(v)) {
        walk(value, key);
      }
    }
  };
  walk(data);
}
function getLearnedMapping() {
  return { ...globalFieldMapping };
}
function getGlobalEnumRegistry() {
  return globalEnumRegistry;
}

export {
  initializeSmartEnumMappings,
  learnFromData,
  getLearnedMapping,
  getGlobalEnumRegistry
};
//# sourceMappingURL=chunk-NQ2GSPII.js.map