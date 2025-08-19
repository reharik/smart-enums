
import { capitalCase, constantCase } from 'case-anything';
import { addExtensionMethods } from './extensionMethods';
import {
  BaseEnum,
  EnumerationProps,
  EnumItem,
  ExtensionMethods,
  NormalizedInputType,
  PropertyAutoFormatter,
} from './types';

/**
 * Creates a type-safe enumeration with built-in utility methods.
 * 
 * @example
 * // Simple string array input
 * const Status = enumeration({
 *   input: ['PENDING', 'ACTIVE', 'COMPLETED'] as const
 * });
 * 
 * // Object input with overrides
 * const UserRole = enumeration({
 *   input: {
 *     ADMIN: { display: 'Administrator', value: 'admin' },
 *     USER: { display: 'Regular User' },
 *     GUEST: { deprecated: true }
 *   }
 * });
 * 
 * // With custom extensions
 * const Priority = enumeration({
 *   input: {
 *     LOW: { level: 1 },
 *     MEDIUM: { level: 2 },
 *     HIGH: { level: 3 }
 *   },
 *   extraExtensionMethods: (items) => ({
 *     getByLevel: (level: number) => items.find(i => i.level === level),
 *     getSorted: () => items.sort((a, b) => a.level - b.level)
 *   })
 * });
 * 
 * // Usage examples:
 * const active = Status.ACTIVE; // EnumItem with key, value, display, etc.
 * const statusFromValue = Status.fromValue('PENDING'); // Lookup by value
 * const allOptions = Status.toOptions(); // Convert to dropdown options
 * const activeOnly = UserRole.toEnumItems(item => !item.deprecated);
 * 
 * @param props Configuration for the enumeration
 * @returns An object with enum items as properties plus all extension methods
 */
function enumeration<
  TInput extends readonly string[] | { [k: string]: BaseEnum },
  TEnumItemExtension = Record<string, never>,
  TExtraExtensionMethods = Record<string, never>,
>({
  input,
  extraExtensionMethods,
  propertyAutoFormatters,
}: EnumerationProps<TInput, TEnumItemExtension, TExtraExtensionMethods>): {
  [K in keyof NormalizedInputType<TInput>]: EnumItem<
    NormalizedInputType<TInput>,
    TEnumItemExtension
  >;
} & ExtensionMethods<NormalizedInputType<TInput>, TEnumItemExtension> &
  TExtraExtensionMethods {
  
  // Type alias for better readability
  type NormalizedInput = NormalizedInputType<TInput>;

  // Step 1: Normalize input to object format
  // Arrays become objects with empty values: ['A', 'B'] -> { A: {}, B: {} }
  const normalizedInput: NormalizedInput = (
    Array.isArray(input)
      ? input.reduce((acc, k) => ({ ...acc, [k]: {} }), {})
      : input
  ) as NormalizedInput;

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
      acc[formatter.key as keyof typeof acc] = formatter.format(k);
      return acc;
    }, {});

  // Step 3: Build the enum items object
  const rawEnumItems: {
    [K in keyof NormalizedInput]: EnumItem<NormalizedInput, TEnumItemExtension>;
  } = {} as {
    [K in keyof NormalizedInput]: EnumItem<NormalizedInput, TEnumItemExtension>;
  };

  // Step 4: Populate each enum item with formatted properties and user overrides
  let index = 0;
  for (const key in normalizedInput) {
    // eslint requires hasOwnProperty check
    if (Object.prototype.hasOwnProperty.call(normalizedInput, key)) {
      const value = normalizedInput[key];

      // Create enum item:
      // 1. Set index and key
      // 2. Apply auto-formatters (value, display, custom)
      // 3. Override with any user-provided values
      const enumItem: EnumItem<NormalizedInput, TEnumItemExtension> = {
        index,
        key: key as keyof NormalizedInputType<TInput>,
        ...formatProperties(key, formattersWithDefaults), // Auto-generated props
        ...value, // User overrides
      } as EnumItem<NormalizedInput, TEnumItemExtension>;

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

export { enumeration };