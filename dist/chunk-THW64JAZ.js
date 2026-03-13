// src/enumerations.ts
import { capitalCase, constantCase } from "case-anything";

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
  return item;
};
var formatProperties = (k, formatters) => formatters.reduce(
  (acc, formatter) => {
    acc[formatter.key] = formatter.format(k);
    return acc;
  },
  {
    value: constantCase(k),
    display: capitalCase(k)
  }
);
function buildEnumFromObject(enumType, input, propertyAutoFormatters) {
  const formattersWithDefaults = [
    { key: "value", format: constantCase },
    { key: "display", format: capitalCase },
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

export {
  enumeration,
  isSmartEnumItem,
  isSmartEnum,
  isSerializedSmartEnumItem
};
//# sourceMappingURL=chunk-THW64JAZ.js.map