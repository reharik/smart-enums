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
  EnumRevivalError: () => EnumRevivalError,
  enumeration: () => enumeration,
  isSmartEnum: () => isSmartEnum,
  isSmartEnumItem: () => isSmartEnumItem,
  prepareForDatabase: () => prepareForDatabase,
  revivePayloadFromDatabase: () => revivePayloadFromDatabase,
  reviveRowFromDatabase: () => reviveRowFromDatabase
});
module.exports = __toCommonJS(database_exports);

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

// src/db/prepareForDatabase.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
var prepareForDatabase = (payload) => {
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
};

// src/db/enumRevivalError.ts
var EnumRevivalError = class extends Error {
  constructor(message, path, value) {
    super(message);
    this.path = path;
    this.value = value;
    this.name = "EnumRevivalError";
  }
};

// src/db/reviveRowFromDatabase.ts
var reviveRowFromDatabase = (row, options) => {
  const { fieldEnumMapping, strict = false } = options;
  const out = { ...row };
  for (const [field, smartEnum] of Object.entries(fieldEnumMapping)) {
    if (!Object.hasOwn(out, field)) {
      continue;
    }
    const raw = out[field];
    if (typeof raw !== "string") {
      continue;
    }
    const revived = smartEnum.tryFromValue(raw);
    if (revived !== void 0) {
      out[field] = revived;
    } else if (strict) {
      throw new EnumRevivalError(
        `Cannot revive field ${JSON.stringify(field)}: unknown enum value ${JSON.stringify(raw)}`,
        field,
        raw
      );
    }
  }
  return out;
};

// src/db/revivePayloadFromDatabase.ts
var isObjectRecord = (x) => typeof x === "object" && x !== null && !Array.isArray(x);
var parsePath = (pathStr) => {
  const tokens = pathStr.split(".").filter(Boolean);
  const segs = [];
  for (const token of tokens) {
    if (token.endsWith("[]")) {
      const name = token.slice(0, -2);
      if (name.length === 0) {
        throw new Error(
          `Invalid enum revival path "${pathStr}": empty key before []`
        );
      }
      segs.push({ type: "prop", name }, { type: "arrayEach" });
    } else {
      segs.push({ type: "prop", name: token });
    }
  }
  const last = segs[segs.length - 1];
  if (!last || last.type !== "prop") {
    throw new Error(
      `Invalid enum revival path "${pathStr}": must end with a property name (not [])`
    );
  }
  return segs;
};
var reviveLeaf = (host, key, smartEnum, strict, pathLabel) => {
  const raw = host[key];
  if (typeof raw !== "string") {
    return;
  }
  const revived = smartEnum.tryFromValue(raw);
  if (revived !== void 0) {
    host[key] = revived;
  } else if (strict) {
    throw new EnumRevivalError(
      `Cannot revive path "${pathLabel}": unknown enum value ${JSON.stringify(raw)}`,
      pathLabel,
      raw
    );
  }
};
var walkPath = (value, segs, segIndex, smartEnum, strict, pathLabel) => {
  const seg = segs[segIndex];
  if (seg === void 0) {
    return;
  }
  const isLast = segIndex === segs.length - 1;
  if (isLast) {
    if (seg.type !== "prop") {
      return;
    }
    if (!isObjectRecord(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected object at parent of "${seg.name}"`,
          pathLabel,
          value
        );
      }
      return;
    }
    reviveLeaf(value, seg.name, smartEnum, strict, pathLabel);
    return;
  }
  if (seg.type === "prop") {
    if (!isObjectRecord(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected object at "${seg.name}"`,
          pathLabel,
          value
        );
      }
      return;
    }
    walkPath(value[seg.name], segs, segIndex + 1, smartEnum, strict, pathLabel);
    return;
  }
  if (seg.type === "arrayEach") {
    if (!Array.isArray(value)) {
      if (strict) {
        throw new EnumRevivalError(
          `Cannot revive path "${pathLabel}": expected array before nested path`,
          pathLabel,
          value
        );
      }
      return;
    }
    for (const el of value) {
      walkPath(el, segs, segIndex + 1, smartEnum, strict, pathLabel);
    }
  }
};
var revivePayloadFromDatabase = (payload, options) => {
  const { pathEnumMapping, strict = false } = options;
  const root = structuredClone(payload);
  for (const [pathStr, smartEnum] of Object.entries(pathEnumMapping)) {
    const segs = parsePath(pathStr);
    walkPath(root, segs, 0, smartEnum, strict, pathStr);
  }
  return root;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EnumRevivalError,
  enumeration,
  isSmartEnum,
  isSmartEnumItem,
  prepareForDatabase,
  revivePayloadFromDatabase,
  reviveRowFromDatabase
});
//# sourceMappingURL=database.cjs.map