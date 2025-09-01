import { BaseEnum, EnumerationProps, EnumItem, ExtensionMethods, NormalizedInputType } from './types.js';
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
declare function enumeration<TInput extends readonly string[] | {
    [k: string]: BaseEnum;
}, TEnumItemExtension = Record<string, never>, TExtraExtensionMethods = Record<string, never>>({ input, extraExtensionMethods, propertyAutoFormatters, }: EnumerationProps<TInput, TEnumItemExtension, TExtraExtensionMethods>): {
    [K in keyof NormalizedInputType<TInput>]: EnumItem<NormalizedInputType<TInput>, TEnumItemExtension>;
} & ExtensionMethods<NormalizedInputType<TInput>, TEnumItemExtension> & TExtraExtensionMethods;
export { enumeration };
