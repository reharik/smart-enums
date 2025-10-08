"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/database.ts
var database_exports = {};
__export(database_exports, {
  enumeration: () => enumeration,
  initializeSmartEnumMappings: () => initializeSmartEnumMappings,
  isSmartEnumItem: () => isSmartEnumItem,
  prepareForDatabase: () => prepareForDatabase,
  reviveFromDatabase: () => reviveFromDatabase
});
module.exports = __toCommonJS(database_exports);

// src/enumeration.ts
var import_case_anything = require("case-anything");

// src/types.ts
var notEmpty = (value) => {
  return value != null;
};
var SMART_ENUM_ITEM = Symbol("smart-enum-item");
var SMART_ENUM_ID = Symbol("smart-enum-id");

// src/extensionMethods.ts
var addExtensionMethods = (enumItems, extraExtensionMethods) => {
  const extensionMethods = buildExtensionMethods(
    enumItems
  );
  let extra = {};
  if (extraExtensionMethods) {
    extra = extraExtensionMethods(enumItems);
  }
  return { ...extensionMethods, ...extra };
};
var buildExtensionMethods = (rawEnum) => {
  return {
    // Lookup methods - these find enum items by different properties
    fromValue: (target) => {
      const item = Object.values(rawEnum).find(
        (value) => value.value === target
      );
      if (!item) {
        throw new Error(`No enum value found for '${target}'`);
      }
      return item;
    },
    tryFromValue: (target) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).find(
        (value) => value.value === target
      );
    },
    fromKey: (target) => {
      const item = Object.values(rawEnum).find(
        (value) => value.key === target
      );
      if (!item) {
        throw new Error(`No enum key found for '${target}'`);
      }
      return item;
    },
    tryFromKey: (target) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).find(
        (value) => value.key === target
      );
    },
    /**
     * Flexible lookup by any custom field.
     * Useful when enum items have additional properties beyond the standard ones.
     */
    tryFromCustomField: (field, target, filter) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).filter(filter || (() => true)).find(
        (value) => value[field] === target
      );
    },
    fromDisplay: (target) => {
      const item = Object.values(rawEnum).find(
        (value) => value.display === target
      );
      if (!item) {
        throw new Error(`No enum display found for '${target}'`);
      }
      return item;
    },
    tryFromDisplay: (target) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).find(
        (value) => value.display === target
      );
    },
    // Transformation methods - these convert enum items to different formats
    /**
     * Extract values from a specific custom field across all items.
     * Respects filter options for empty and deprecated items.
     */
    toCustomFieldValues: (field, filter, filterOptions) => {
      return Object.values(rawEnum).filter(
        (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x[field])) && (filterOptions?.showDeprecated ? true : !x.deprecated)
      ).map((x) => x[field]);
    },
    /**
     * Convert to dropdown options, automatically sorted by index.
     * Includes optional iconText if present in the enum item.
     */
    toOptions: (filter, filterOptions) => {
      return [
        ...rawEnum || []
      ].sort(
        (a, b) => a?.index && b?.index ? (a?.index || 0) - (b?.index || 0) : 0
      ).filter(
        (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x)) && (filterOptions?.showDeprecated ? true : !x.deprecated)
      ).map((item) => ({
        label: item.display || item.key,
        value: item.value,
        ...item.iconText ? { iconText: item.iconText } : {}
      }));
    },
    // Array extraction methods - these get arrays of specific properties
    toValues: (filter, filterOptions) => Object.values(rawEnum).filter(
      (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x)) && (filterOptions?.showDeprecated ? true : !x.deprecated)
    ).map((item) => item.value),
    toKeys: (filter, filterOptions) => Object.values(rawEnum).filter(
      (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x)) && (filterOptions?.showDeprecated ? true : !x.deprecated)
    ).map((item) => item.key),
    toDisplays: (filter, filterOptions) => Object.values(rawEnum).filter(
      (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x)) && (filterOptions?.showDeprecated ? true : !x.deprecated)
    ).map(
      (item) => item.display
    ),
    toEnumItems: (filter, filterOptions) => Object.values(rawEnum).filter(
      (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x)) && (filterOptions?.showDeprecated ? true : !x.deprecated)
    ),
    /**
     * Creates a new object with filtered enum items.
     * Useful for creating subset enums or when you need an object format.
     */
    toExtendableObject: (filter, filterOptions) => {
      return Object.values(rawEnum).filter(
        (x) => (filter ? filter(x) : true) && (filterOptions?.showEmpty ? true : notEmpty(x)) && (filterOptions?.showDeprecated ? true : !x.deprecated)
      ).reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});
    }
  };
};

// src/enumeration.ts
var isSmartEnumItem = (x) => {
  return !!x && typeof x === "object" && Reflect.get(x, SMART_ENUM_ITEM) === true;
};
function enumeration(enumType, {
  input,
  extraExtensionMethods,
  propertyAutoFormatters
}) {
  const normalizedInput = Array.isArray(input) ? input.reduce(
    (acc, k) => ({ ...acc, [k]: {} }),
    {}
  ) : input;
  const formattersWithDefaults = [
    { key: "value", format: import_case_anything.constantCase },
    { key: "display", format: import_case_anything.capitalCase },
    ...propertyAutoFormatters || []
  ];
  const formatProperties = (k, formatters) => formatters.reduce((acc, formatter) => {
    acc[formatter.key] = formatter.format(k);
    return acc;
  }, {});
  const rawEnumItems = {};
  const enumInstanceId = Symbol("smart-enum-instance");
  let index = 0;
  for (const key in normalizedInput) {
    if (Object.prototype.hasOwnProperty.call(normalizedInput, key)) {
      const value = normalizedInput[key];
      const enumItem = {
        index,
        key,
        ...formatProperties(key, formattersWithDefaults),
        // Auto-generated props
        ...value
        // User overrides
      };
      Object.defineProperty(enumItem, SMART_ENUM_ITEM, {
        value: true,
        enumerable: false
      });
      Object.defineProperty(enumItem, SMART_ENUM_ID, {
        value: enumInstanceId,
        enumerable: false
      });
      Object.defineProperty(enumItem, "__smart_enum_brand", {
        value: true,
        enumerable: false
      });
      Object.defineProperty(enumItem, "__smart_enum_type", {
        value: enumType,
        enumerable: false
      });
      Object.defineProperty(enumItem, "toJSON", {
        value: () => ({ __smart_enum_type: enumType, value: enumItem.value })
      });
      rawEnumItems[key] = enumItem;
      index++;
    }
  }
  return {
    ...rawEnumItems,
    // All enum items as properties
    ...addExtensionMethods(Object.values(rawEnumItems), extraExtensionMethods)
    // All methods
  };
}

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

// src/utilities/database/prepareForDatabase.ts
var isPlainObject2 = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
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
    if (isPlainObject2(v)) {
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
var isPlainObject3 = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
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
    if (isPlainObject3(v)) {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enumeration,
  initializeSmartEnumMappings,
  isSmartEnumItem,
  prepareForDatabase,
  reviveFromDatabase
});
//# sourceMappingURL=database.cjs.map