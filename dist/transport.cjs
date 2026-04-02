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

// src/transport.ts
var transport_exports = {};
__export(transport_exports, {
  enumeration: () => enumeration,
  getGlobalEnumRegistry: () => getGlobalEnumRegistry,
  initializeSmartEnumMappings: () => initializeSmartEnumMappings,
  isSmartEnum: () => isSmartEnum,
  isSmartEnumItem: () => isSmartEnumItem,
  reviveAfterTransport: () => reviveAfterTransport,
  reviveSmartEnums: () => reviveSmartEnums,
  serializeForTransport: () => serializeForTransport,
  serializeSmartEnums: () => serializeSmartEnums
});
module.exports = __toCommonJS(transport_exports);

// src/enumerations.ts
var import_case_anything = require("case-anything");

// src/extensionMethods.ts
var addExtensionMethods = (enumItems) => {
  const findBy = (field, target) => enumItems.find((item) => item[field] === target);
  const requireBy = (field, target, label) => {
    const item = findBy(field, target);
    if (!item) {
      throw new Error(`No enum ${label} found for '${String(target)}'`);
    }
    return item;
  };
  return {
    fromValue: (value) => requireBy("value", value, "value"),
    tryFromValue: (value) => value ? findBy("value", value) : void 0,
    fromKey: (key) => requireBy("key", key, "key"),
    tryFromKey: (key) => key ? findBy("key", key) : void 0,
    items: () => [...enumItems],
    values: () => enumItems.map((item) => item.value),
    keys: () => enumItems.map((item) => item.key)
  };
};

// src/types.ts
var SMART_ENUM_ITEM = Symbol("smart-enum-item");
var SMART_ENUM_ID = Symbol("smart-enum-id");
var SMART_ENUM = Symbol("smart-enum");

// src/enumerations.ts
function normalizeInput(input) {
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input.map((k) => [k, {}])
    );
  }
  return input;
}
var finalizeEnumItem = (item, enumType, enumInstanceId) => {
  Object.defineProperty(item, SMART_ENUM_ITEM, {
    value: true,
    enumerable: false
  });
  Object.defineProperty(item, SMART_ENUM_ID, {
    value: enumInstanceId,
    enumerable: false
  });
  Object.defineProperty(item, "__smart_enum_brand", {
    value: true,
    enumerable: false
  });
  Object.defineProperty(item, "__smart_enum_type", {
    value: enumType,
    enumerable: false
  });
  Object.defineProperty(item, "toJSON", {
    value: () => ({ __smart_enum_type: enumType, value: item.value }),
    enumerable: false
  });
  Object.defineProperty(item, "toPostgres", {
    value: () => item.value,
    enumerable: false
  });
  return item;
};
var formatProperties = (k, formatters) => formatters.reduce(
  (acc, formatter) => {
    acc[formatter.key] = formatter.format(k);
    return acc;
  },
  {
    value: (0, import_case_anything.constantCase)(k),
    display: (0, import_case_anything.capitalCase)(k)
  }
);
function buildEnumFromObject(enumType, input, propertyAutoFormatters) {
  const formattersWithDefaults = [
    { key: "value", format: import_case_anything.constantCase },
    { key: "display", format: import_case_anything.capitalCase },
    ...propertyAutoFormatters ?? []
  ];
  const rawEnumItems = {};
  const enumInstanceId = Symbol("smart-enum-instance");
  let index = 0;
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const typedKey = key;
      const value = input[typedKey];
      const enumItemBase = {
        index,
        key: typedKey,
        ...formatProperties(typedKey, formattersWithDefaults),
        ...value
      };
      const enumItem = finalizeEnumItem(
        enumItemBase,
        enumType,
        enumInstanceId
      );
      Object.freeze(enumItem);
      rawEnumItems[typedKey] = enumItem;
      index++;
    }
  }
  const extensionMethods = addExtensionMethods(
    Object.values(rawEnumItems)
  );
  const enumObject = {
    ...rawEnumItems,
    ...extensionMethods
  };
  Object.defineProperty(enumObject, SMART_ENUM, {
    value: true,
    enumerable: false
  });
  Object.freeze(enumObject);
  return enumObject;
}
function enumeration(enumType, props) {
  const normalized = normalizeInput(props.input);
  return buildEnumFromObject(
    enumType,
    normalized,
    props.propertyAutoFormatters
  );
}

// src/utilities/typeGuards.ts
var isSmartEnumItem = (x) => {
  return !!x && typeof x === "object" && Reflect.get(x, SMART_ENUM_ITEM) === true;
};
var isSmartEnum = (x) => {
  return !!x && typeof x === "object" && Reflect.get(x, SMART_ENUM) === true;
};
var isSerializedSmartEnumItem = (x) => {
  return !!x && typeof x === "object" && Reflect.has(x, "__smart_enum_type") && Reflect.has(x, "value");
};

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
      debug(`Found serialized smartEnum: ${v.__smart_enum_type}`);
      const enumInstance = registry[v.__smart_enum_type];
      if (enumInstance) {
        debug(`Found enumInstance in registry: ${v.__smart_enum_type}`);
        const enumItem = enumInstance.tryFromValue(v.value);
        if (enumItem) {
          debug(`Revived enumItem using value: ${v.value}`);
          return enumItem;
        }
        const key = v.value.toLowerCase();
        const enumItemFromKey = enumInstance.tryFromKey(key);
        if (enumItemFromKey) {
          debug(`Revived enumItem using key: ${key}`);
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

// src/utilities/transport/transportRegistry.ts
var createLevelFilteredLogger = (logger, level) => {
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
};
var globalEnumRegistry;
var initializeSmartEnumMappings = (config) => {
  globalEnumRegistry = config.enumRegistry;
  const logLevel = config.logLevel ?? "error";
  const logger = config.logger ?? getLogger();
  setLogger(createLevelFilteredLogger(logger, logLevel));
  info("Initialized smart enum mappings", {
    enumCount: Object.keys(config.enumRegistry).length,
    enumTypes: Object.keys(config.enumRegistry),
    logLevel
  });
};
var getGlobalEnumRegistry = () => globalEnumRegistry;

// src/utilities/transport/reviveAfterTransport.ts
var reviveAfterTransport = (payload) => {
  const registry = getGlobalEnumRegistry();
  if (!registry) {
    return payload;
  }
  return reviveSmartEnums(payload, registry);
};

// src/utilities/transport/serializeForTransport.ts
var serializeForTransport = (payload) => serializeSmartEnums(payload);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enumeration,
  getGlobalEnumRegistry,
  initializeSmartEnumMappings,
  isSmartEnum,
  isSmartEnumItem,
  reviveAfterTransport,
  reviveSmartEnums,
  serializeForTransport,
  serializeSmartEnums
});
//# sourceMappingURL=transport.cjs.map