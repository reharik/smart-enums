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
  getGlobalEnumRegistry: () => getGlobalEnumRegistry,
  getLearnedMapping: () => getLearnedMapping,
  initializeSmartEnumMappings: () => initializeSmartEnumMappings,
  isSmartEnum: () => isSmartEnum,
  isSmartEnumItem: () => isSmartEnumItem,
  mergeFieldMappings: () => mergeFieldMappings,
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
var SMART_ENUM = Symbol("smart-enum");

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
var isSmartEnum = (x) => {
  return !!x && typeof x === "object" && Reflect.get(x, SMART_ENUM) === true;
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
  const enumObject = {
    ...rawEnumItems,
    // All enum items as properties
    ...addExtensionMethods(Object.values(rawEnumItems), extraExtensionMethods)
    // All methods
  };
  Object.defineProperty(enumObject, SMART_ENUM, {
    value: true,
    enumerable: false
  });
  return enumObject;
}

// src/utilities/logger.ts
var consoleLogger = {
  debug(message, ...args) {
    console.debug(`[smart-enums:debug] ${message}`, ...args);
  },
  info(message, ...args) {
    console.info(`[smart-enums:info] ${message}`, ...args);
  },
  warn(message, ...args) {
    console.warn(`[smart-enums:warn] ${message}`, ...args);
  },
  error(message, ...args) {
    console.error(`[smart-enums:error] ${message}`, ...args);
  }
};
var globalLogger = consoleLogger;
function setLogger(logger) {
  globalLogger = logger;
}
function getLogger() {
  return globalLogger;
}
function debug(message, ...args) {
  globalLogger.debug(message, ...args);
}
function info(message, ...args) {
  globalLogger.info(message, ...args);
}
function warn(message, ...args) {
  globalLogger.warn(message, ...args);
}

// src/utilities/database/fieldMappingBuilder.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
var globalEnumRegistry;
var globalFieldMapping = {};
function createLevelFilteredLogger(logger, level) {
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  const currentLevel = levels[level];
  return {
    debug: (message, ...args) => {
      if (currentLevel <= levels.debug) {
        logger.debug(message, ...args);
      }
    },
    info: (message, ...args) => {
      if (currentLevel <= levels.info) {
        logger.info(message, ...args);
      }
    },
    warn: (message, ...args) => {
      if (currentLevel <= levels.warn) {
        logger.warn(message, ...args);
      }
    },
    error: (message, ...args) => {
      if (currentLevel <= levels.error) {
        logger.error(message, ...args);
      }
    }
  };
}
function initializeSmartEnumMappings(config) {
  globalEnumRegistry = config.enumRegistry;
  globalFieldMapping = {};
  const logLevel = config.logLevel ?? "error";
  const logger = config.logger ?? getLogger();
  const filteredLogger = createLevelFilteredLogger(logger, logLevel);
  setLogger(filteredLogger);
  info("Initialized smart enum mappings", {
    enumCount: Object.keys(config.enumRegistry).length,
    enumTypes: Object.keys(config.enumRegistry),
    logLevel
  });
}
function learnFromData(data) {
  if (!globalEnumRegistry) {
    warn("learnFromData called but no global enum registry initialized");
    return;
  }
  const seen = /* @__PURE__ */ new WeakSet();
  let learnedCount = 0;
  const walk = (v, propertyName) => {
    if (isSmartEnumItem(v) && propertyName) {
      const enumTypeName = v.__smart_enum_type;
      if (!enumTypeName) {
        warn("Smart enum item missing __smart_enum_type", {
          propertyName,
          item: v
        });
        return;
      }
      if (!globalFieldMapping[propertyName] || !globalFieldMapping[propertyName].includes(enumTypeName)) {
        globalFieldMapping[propertyName] = [
          ...globalFieldMapping[propertyName] || [],
          enumTypeName
        ];
        learnedCount++;
        debug("Learned field mapping", {
          property: propertyName,
          enumType: enumTypeName,
          allMappings: globalFieldMapping[propertyName]
        });
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
  if (learnedCount > 0) {
    info("Field mapping learning completed", {
      learnedCount,
      totalMappings: Object.keys(globalFieldMapping).length
    });
  }
}
function getLearnedMapping() {
  return { ...globalFieldMapping };
}
function getGlobalEnumRegistry() {
  return globalEnumRegistry;
}
function mergeFieldMappings(learnedMapping, manualMapping) {
  if (!manualMapping) {
    debug("No manual mappings provided, returning learned mappings", {
      learnedCount: Object.keys(learnedMapping).length
    });
    return learnedMapping;
  }
  debug("Merging manual and learned mappings", {
    manualFields: Object.keys(manualMapping),
    learnedFields: Object.keys(learnedMapping)
  });
  for (const [field, manualEnumTypes] of Object.entries(manualMapping)) {
    const existingEnumTypes = globalFieldMapping[field] || [];
    const combinedEnumTypes = [...manualEnumTypes];
    for (const existingEnumType of existingEnumTypes) {
      if (!combinedEnumTypes.includes(existingEnumType)) {
        combinedEnumTypes.push(existingEnumType);
      }
    }
    globalFieldMapping[field] = combinedEnumTypes;
    debug("Updated field mapping", {
      field,
      manualTypes: manualEnumTypes,
      existingTypes: existingEnumTypes,
      combinedTypes: combinedEnumTypes
    });
  }
  info("Field mapping merge completed", {
    totalFields: Object.keys(globalFieldMapping).length,
    manualFieldsAdded: Object.keys(manualMapping).length
  });
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
function reviveFromDatabase(payload, options) {
  debug("Starting database revival", {
    hasOptions: !!options,
    manualMappings: options?.fieldEnumMapping ? Object.keys(options.fieldEnumMapping) : []
  });
  const globalEnumRegistry2 = getGlobalEnumRegistry();
  const learnedMapping = getLearnedMapping();
  if (!globalEnumRegistry2) {
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
        debug("Attempting enum revival", {
          property: propertyName,
          value: v,
          enumTypes: typesToTry
        });
        for (const enumType of typesToTry) {
          if (globalEnumRegistry2[enumType]) {
            const enumItem = globalEnumRegistry2[enumType].tryFromValue(v);
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
              availableTypes: Object.keys(globalEnumRegistry2)
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enumeration,
  getGlobalEnumRegistry,
  getLearnedMapping,
  initializeSmartEnumMappings,
  isSmartEnum,
  isSmartEnumItem,
  mergeFieldMappings,
  prepareForDatabase,
  reviveFromDatabase
});
//# sourceMappingURL=database.cjs.map