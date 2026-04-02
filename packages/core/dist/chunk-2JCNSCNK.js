import {
  isSerializedSmartEnumItem,
  isSmartEnumItem
} from "./chunk-NASPJET6.js";

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

export {
  serializeSmartEnums,
  reviveSmartEnums,
  initializeSmartEnumMappings,
  getGlobalEnumRegistry,
  reviveAfterTransport,
  serializeForTransport
};
//# sourceMappingURL=chunk-2JCNSCNK.js.map