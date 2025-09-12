// src/enumeration.ts
import { capitalCase, constantCase } from "case-anything";

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
var SMART_ENUM_ITEM = Symbol.for("smart-enum-item");
var SMART_ENUM_ID = Symbol.for("smart-enum-id");
var isSmartEnumItem = (x) => {
  return !!x && typeof x === "object" && Reflect.get(x, SMART_ENUM_ITEM) === true;
};
function enumeration({
  input,
  extraExtensionMethods,
  propertyAutoFormatters,
  enumType
}) {
  const normalizedInput = Array.isArray(input) ? input.reduce(
    (acc, k) => ({ ...acc, [k]: {} }),
    {}
  ) : input;
  const formattersWithDefaults = [
    { key: "value", format: constantCase },
    { key: "display", format: capitalCase },
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
      if (enumType) {
        Object.defineProperty(enumItem, "toJSON", {
          value: () => ({ __smart_enum_type: enumType, value: enumItem.value })
        });
      }
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

// src/utilities/transformation.ts
var isPlainObject = (x) => typeof x === "object" && x !== null && Object.getPrototypeOf(x) === Object.prototype;
function serializeSmartEnums(input) {
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (v) => {
    if (isSmartEnumItem(v)) return v.value;
    if (Array.isArray(v)) {
      if (seen.has(v)) return seen.get(v);
      const arr = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
      return arr;
    }
    if (isPlainObject(v)) {
      if (seen.has(v)) return seen.get(v);
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
function reviveSmartEnums(input, enumByField) {
  const seen = /* @__PURE__ */ new WeakMap();
  const walk = (v, parentKey) => {
    if (typeof v === "string" && parentKey && enumByField[parentKey]) {
      return enumByField[parentKey].tryFromValue(v) ?? v;
    }
    if (Array.isArray(v)) {
      if (seen.has(v)) return seen.get(v);
      const arr = [];
      seen.set(v, arr);
      for (const item of v) arr.push(walk(item));
      return arr;
    }
    if (isPlainObject(v)) {
      if (seen.has(v)) return seen.get(v);
      const out = {};
      seen.set(v, out);
      for (const [k, val] of Object.entries(v)) {
        out[k] = walk(val, k);
      }
      return out;
    }
    return v;
  };
  return walk(input);
}
export {
  enumeration,
  isSmartEnumItem,
  reviveSmartEnums,
  serializeSmartEnums
};
//# sourceMappingURL=index.js.map