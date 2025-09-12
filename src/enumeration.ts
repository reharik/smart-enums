import { capitalCase, constantCase } from 'case-anything';

import { addExtensionMethods } from './extensionMethods.js';
import {
  EnumerationProps,
  EnumItem,
  ExtensionMethods,
  NormalizedInputType,
  PropertyAutoFormatter,
  EnumInput,
  ObjectEnumInput,
  ArrayToObjectType,
} from './types.js';

// Runtime tagging for Smart Enum items
export const SMART_ENUM_ITEM = Symbol.for('smart-enum-item');
export const SMART_ENUM_ID = Symbol.for('smart-enum-id');

/**
 * Runtime type guard to detect Smart Enum items created by this library.
 */
export const isSmartEnumItem = (
  x: unknown,
): x is { key: string; value: string; index?: number } => {
  return (
    !!x && typeof x === 'object' && Reflect.get(x, SMART_ENUM_ITEM) === true
  );
};

// Overload 1: array input (types return object form)
export function enumeration<
  TArr extends readonly string[],
  TEnumItemExtension = Record<string, never>,
  TExtraExtensionMethods = Record<string, never>,
>(
  props: EnumerationProps<TArr, TEnumItemExtension, TExtraExtensionMethods>,
): {
  [K in keyof ArrayToObjectType<TArr>]: EnumItem<
    ArrayToObjectType<TArr>,
    TEnumItemExtension
  >;
} & ExtensionMethods<
  {
    [K in keyof ArrayToObjectType<TArr>]: EnumItem<
      ArrayToObjectType<TArr>,
      TEnumItemExtension
    >;
  },
  TEnumItemExtension
> &
  TExtraExtensionMethods;

// Overload 2: object input
export function enumeration<
  TObj extends ObjectEnumInput,
  TEnumItemExtension = Record<string, never>,
  TExtraExtensionMethods = Record<string, never>,
>(
  props: EnumerationProps<TObj, TEnumItemExtension, TExtraExtensionMethods>,
): {
  [K in keyof TObj]: EnumItem<TObj, TEnumItemExtension>;
} & ExtensionMethods<
  {
    [K in keyof TObj]: EnumItem<TObj, TEnumItemExtension>;
  },
  TEnumItemExtension
> &
  TExtraExtensionMethods;

// Implementation
export function enumeration<
  TInput extends EnumInput,
  TEnumItemExtension = Record<string, never>,
  TExtraExtensionMethods = Record<string, never>,
>({
  input,
  extraExtensionMethods,
  propertyAutoFormatters,
  enumType,
}: EnumerationProps<TInput, TEnumItemExtension, TExtraExtensionMethods>): {
  [K in keyof NormalizedInputType<TInput>]: EnumItem<
    NormalizedInputType<TInput>,
    TEnumItemExtension
  >;
} & ExtensionMethods<
  {
    [K in keyof NormalizedInputType<TInput>]: EnumItem<
      NormalizedInputType<TInput>,
      TEnumItemExtension
    >;
  },
  TEnumItemExtension
> &
  TExtraExtensionMethods {
  // Step 1: Normalize input to object format
  // Arrays become objects with empty values: ['A', 'B'] -> { A: {}, B: {} }
  const normalizedInput: NormalizedInputType<TInput> = (
    Array.isArray(input)
      ? input.reduce(
          (acc: NormalizedInputType<TInput>, k) => ({ ...acc, [k]: {} }),
          {},
        )
      : input
  ) as NormalizedInputType<TInput>;

  // Step 2: Set up property formatters with defaults
  // By default: value = CONSTANT_CASE, display = Capital Case
  const formattersWithDefaults = [
    { key: 'value', format: constantCase },
    { key: 'display', format: capitalCase },
    ...(propertyAutoFormatters || []),
  ];

  // Helper to apply all formatters to a key
  const formatProperties = (k: string, formatters: PropertyAutoFormatter[]) =>
    formatters.reduce((acc: Record<string, string>, formatter) => {
      acc[formatter.key] = formatter.format(k);
      return acc;
    }, {});

  // Step 3: Build the enum items object
  const rawEnumItems: {
    [K in keyof NormalizedInputType<TInput>]: EnumItem<
      NormalizedInputType<TInput>,
      TEnumItemExtension
    >;
  } = {} as {
    [K in keyof NormalizedInputType<TInput>]: EnumItem<
      NormalizedInputType<TInput>,
      TEnumItemExtension
    >;
  };

  // Step 4: Populate each enum item with formatted properties and user overrides
  // Create a per-enum instance identifier for optional identity checks
  const enumInstanceId = Symbol('smart-enum-instance');
  let index = 0;
  for (const key in normalizedInput) {
    // eslint requires hasOwnProperty check
    if (Object.prototype.hasOwnProperty.call(normalizedInput, key)) {
      const value = normalizedInput[key];

      // Create enum item:
      // 1. Set index and key
      // 2. Apply auto-formatters (value, display, custom)
      // 3. Override with any user-provided values
      const enumItem: EnumItem<
        NormalizedInputType<TInput>,
        TEnumItemExtension
      > = {
        index,
        key: key as keyof NormalizedInputType<TInput>,
        ...formatProperties(key, formattersWithDefaults), // Auto-generated props
        ...value, // User overrides
      } as EnumItem<NormalizedInputType<TInput>, TEnumItemExtension>;

      // Attach non-enumerable runtime tags for detection and identity
      Object.defineProperty(enumItem, SMART_ENUM_ITEM, {
        value: true,
        enumerable: false,
      });
      Object.defineProperty(enumItem, SMART_ENUM_ID, {
        value: enumInstanceId,
        enumerable: false,
      });

      // If a public enumType was provided, attach a JSON serializer that emits it
      // Attach toJSON only when an enumType is provided in the props
      if (enumType) {
        Object.defineProperty(enumItem, 'toJSON', {
          value: () => ({ __smart_enum_type: enumType, value: enumItem.value }),
        });
      }

      rawEnumItems[key] = enumItem;
      index++;
    }
  }

  // Step 5: Combine enum items with extension methods
  // This creates the final enum object with both data and methods
  return {
    ...rawEnumItems, // All enum items as properties
    ...addExtensionMethods(Object.values(rawEnumItems), extraExtensionMethods), // All methods
  };
}
