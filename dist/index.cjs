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

// src/index.ts
var index_exports = {};
__export(index_exports, {
  enumeration: () => enumeration
});
module.exports = __toCommonJS(index_exports);

// src/enumeration.ts
var import_case_anything = require("case-anything");

// src/types.ts
var notEmpty = (value) => {
  return value != null;
};

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
function enumeration({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  enumeration
});
//# sourceMappingURL=index.cjs.map