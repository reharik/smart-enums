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
    enumerable: true
  });
  Object.defineProperty(item, SMART_ENUM_ID, {
    value: enumInstanceId,
    enumerable: true
  });
  Object.defineProperty(item, "__smart_enum_brand", {
    value: true,
    enumerable: true
  });
  Object.defineProperty(item, "__smart_enum_type", {
    value: enumType,
    enumerable: true
  });
  Object.defineProperty(item, "toJSON", {
    value: () => ({ __smart_enum_type: enumType, value: item.value }),
    enumerable: true
  });
  return item;
};
function buildEnumFromObject(enumType, input, propertyAutoFormatters) {
  const formattersWithDefaults = [
    { key: "value", format: import_case_anything.constantCase },
    { key: "display", format: import_case_anything.capitalCase },
    ...propertyAutoFormatters || []
  ];
  const formatProperties = (k, formatters) => formatters.reduce(
    (acc, formatter) => {
      acc[formatter.key] = formatter.format(k);
      return acc;
    },
    { value: (0, import_case_anything.constantCase)(k), display: (0, import_case_anything.capitalCase)(k) }
  );
  const rawEnumItems = {};
  const enumInstanceId = Symbol("smart-enum-instance");
  let index = 0;
  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];
      const enumItemBase = {
        index,
        key,
        ...formatProperties(key, formattersWithDefaults),
        ...value
      };
      const enumItem = finalizeEnumItem(
        enumItemBase,
        enumType,
        enumInstanceId
      );
      Object.freeze(enumItem);
      rawEnumItems[key] = enumItem;
      index++;
    }
  }
  const extensionMethods = addExtensionMethods(
    Object.values(rawEnumItems)
  );
  const enumObject = {
    ...rawEnumItems,
    // All enum items as properties
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
function debug(message, ...args) {
  globalLogger.debug(message, ...args);
}
function info(message, ...args) {
  globalLogger.info(message, ...args);
}
function warn(message, ...args) {
  globalLogger.warn(message, ...args);
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

// src/utilities/database/fieldMappingBuilder.ts
var isPlainObject2 = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
var globalEnumRegistry;
var globalFieldMapping = {};
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
    } else if (isPlainObject2(v)) {
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
function getGlobalEnumRegistry() {
  return globalEnumRegistry;
}

// src/utilities/transport/reviveAfterTransport.ts
function reviveAfterTransport(payload) {
  const globalEnumRegistry2 = getGlobalEnumRegistry();
  if (!globalEnumRegistry2) {
    return payload;
  }
  return reviveSmartEnums(payload, globalEnumRegistry2);
}

// src/utilities/transport/serializeForTransport.ts
function serializeForTransport(payload) {
  learnFromData(payload);
  return serializeSmartEnums(payload);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enumeration,
  isSmartEnum,
  isSmartEnumItem,
  reviveAfterTransport,
  reviveSmartEnums,
  serializeForTransport,
  serializeSmartEnums
});
//# sourceMappingURL=transport.cjs.map