import {
  isSmartEnumItem
} from "./chunk-437EMIYS.js";

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

export {
  debug,
  warn,
  initializeSmartEnumMappings,
  learnFromData,
  getLearnedMapping,
  getGlobalEnumRegistry,
  mergeFieldMappings
};
//# sourceMappingURL=chunk-JSIRBRDZ.js.map