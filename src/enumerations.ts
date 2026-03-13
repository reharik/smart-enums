import { capitalCase, constantCase } from 'case-anything';

import { addExtensionMethods } from './extensionMethods.js';
import {
  ObjectEnumInput,
  NormalizedInputType,
  FinalizedEnumFields,
  SMART_ENUM_ITEM,
  SMART_ENUM_ID,
  PropertyAutoFormatter,
  EnumFromNormalizedObject,
  EnumItemFromNormalizedObject,
  FinalizableEnumItem,
  SMART_ENUM,
  EnumerationProps,
  CoreEnumMethods,
} from './types.js';

function normalizeInput<TInput extends readonly string[] | ObjectEnumInput>(
  input: TInput,
): NormalizedInputType<TInput> {
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input.map(k => [k, {}]),
    ) as NormalizedInputType<TInput>;
  }

  return input as NormalizedInputType<TInput>;
}

const finalizeEnumItem = <T extends { value: string }>(
  item: T,
  enumType: string,
  enumInstanceId: symbol,
): T & FinalizedEnumFields => {
  Object.defineProperty(item, SMART_ENUM_ITEM, {
    value: true,
    enumerable: true,
  });

  Object.defineProperty(item, SMART_ENUM_ID, {
    value: enumInstanceId,
    enumerable: true,
  });

  Object.defineProperty(item, '__smart_enum_brand', {
    value: true,
    enumerable: true,
  });

  Object.defineProperty(item, '__smart_enum_type', {
    value: enumType,
    enumerable: true,
  });

  Object.defineProperty(item, 'toJSON', {
    value: () => ({ __smart_enum_type: enumType, value: item.value }),
    enumerable: true,
  });

  return item as T & FinalizedEnumFields;
};

function buildEnumFromObject<TObj extends ObjectEnumInput>(
  enumType: string,
  input: TObj,
  propertyAutoFormatters?: PropertyAutoFormatter[],
): EnumFromNormalizedObject<TObj> {
  // Step 1: Set up property formatters with defaults
  // By default: value = CONSTANT_CASE, display = Capital Case
  const formattersWithDefaults = [
    { key: 'value', format: constantCase },
    { key: 'display', format: capitalCase },
    ...(propertyAutoFormatters || []),
  ];

  // Helper to apply all formatters to a key
  const formatProperties = (
    k: string,
    formatters: PropertyAutoFormatter[],
  ): { value: string; display: string } & Record<string, string> =>
    formatters.reduce(
      (acc, formatter) => {
        acc[formatter.key] = formatter.format(k);
        return acc;
      },
      { value: constantCase(k), display: capitalCase(k) } as {
        value: string;
        display: string;
      } & Record<string, string>,
    );

  // Step 2: Build the enum items object
  type TItem = EnumItemFromNormalizedObject<TObj>;

  const rawEnumItems = {} as { [K in keyof TObj]: TItem };

  // Step 3: Populate each enum item with formatted properties and user overrides
  // Create a per-enum instance identifier for optional identity checks
  const enumInstanceId = Symbol('smart-enum-instance');
  let index = 0;
  for (const key in input) {
    // eslint requires hasOwnProperty check
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const value = input[key];

      // Create enum item:
      // 1. Set index and key
      // 2. Apply auto-formatters (value, display, custom)
      // 3. Override with any user-provided values
      const enumItemBase = {
        index,
        key,
        ...formatProperties(key, formattersWithDefaults),
        ...value,
      } as FinalizableEnumItem & TObj[Extract<keyof TObj, string>];

      const enumItem = finalizeEnumItem(
        enumItemBase,
        enumType,
        enumInstanceId,
      ) as TItem;
      Object.freeze(enumItem);
      rawEnumItems[key] = enumItem;
      index++;
    }
  }

  // Step 4: Combine enum items with extension methods
  // This creates the final enum object with both data and methods
  const extensionMethods: CoreEnumMethods<TItem> = addExtensionMethods(
    Object.values(rawEnumItems),
  );
  const enumObject = {
    ...rawEnumItems, // All enum items as properties
    ...extensionMethods,
  };

  // Attach a non-enumerable property to identify this as a smart enum
  Object.defineProperty(enumObject, SMART_ENUM, {
    value: true,
    enumerable: false,
  });
  Object.freeze(enumObject);
  return enumObject as EnumFromNormalizedObject<TObj>;
}

/**
 * Creates a Smart Enum from an array of keys or an object of key/item definitions.
 * Each item gets `key`, `value`, `display`, `index`, and optional custom fields.
 *
 * @param enumType - Unique name for this enum (used for serialization/revival)
 * @param props - `{ input }` array or object; optional `propertyAutoFormatters`
 * @returns Frozen enum object with items and methods (fromValue, toOptions, etc.)
 *
 * @example
 * ```typescript
 * // From array
 * const Status = enumeration('Status', { input: ['pending', 'active'] as const });
 * type Status = Enumeration<typeof Status>;
 * Status.active.value; // 'ACTIVE'
 *
 * // From object
 * const Priority = enumeration('Priority', {
 *   input: { low: {}, high: { value: 'HIGH', display: 'High Priority' } },
 * });
 * ```
 */
export function enumeration<const TArr extends readonly string[]>(
  enumType: string,
  props: EnumerationProps<TArr>,
): EnumFromNormalizedObject<NormalizedInputType<TArr>>;

export function enumeration<const TObj extends ObjectEnumInput>(
  enumType: string,
  props: EnumerationProps<TObj>,
): EnumFromNormalizedObject<NormalizedInputType<TObj>>;

export function enumeration(
  enumType: string,
  props: EnumerationProps<readonly string[] | ObjectEnumInput>,
) {
  const normalized = normalizeInput(props.input);
  return buildEnumFromObject(
    enumType,
    normalized,
    props.propertyAutoFormatters,
  );
}
