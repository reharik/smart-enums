/**
 * Base structure for enum items. All enum items will have these properties.
 */
type BaseEnum = {
    /** The constant-case value (e.g., "USER_ADMIN") */
    value?: string;
    /** The human-readable display name (e.g., "User Admin") */
    display?: string;
    /** The index/order of this item in the enum */
    index?: number;
    /** Whether this enum value is deprecated and should be hidden in most cases */
    deprecated?: boolean;
};
/**
 * Configuration for creating an enumeration
 * @template TInput - Either a readonly string array or an object with BaseEnum values
 * @template TEnumItemExtension - Additional properties to add to each enum item
 * @template TExtraExtensionMethods - Additional methods to add to the enum object
 */
type EnumerationProps<TInput extends readonly string[] | {
    [k: string]: Partial<BaseEnum>;
}, TEnumItemExtension = Record<string, never>, TExtraExtensionMethods = Record<string, never>> = {
    /**
     * The input data for the enum. Can be:
     * - An array of strings: ['USER', 'ADMIN']
     * - An object with overrides: { USER: { display: 'User Account' }, ADMIN: { deprecated: true } }
     */
    input: TInput;
    /**
     * Factory function to add custom methods to the enum object.
     * Receives all enum items and should return an object with the custom methods.
     * @example
     * extraExtensionMethods: (items) => ({
     *   getActiveItems: () => items.filter(i => !i.deprecated),
     *   findByRole: (role: string) => items.find(i => i.role === role)
     * })
     */
    extraExtensionMethods?: (enumItems: EnumItem<NormalizedInputType<TInput>, TEnumItemExtension>[]) => TExtraExtensionMethods;
    /**
     * Auto-formatters for generating additional properties from the key.
     * By default, 'value' uses constantCase and 'display' uses capitalCase.
     * @example
     * propertyAutoFormatters: [
     *   { key: 'slug', format: (k) => k.toLowerCase() },
     *   { key: 'code', format: (k) => k.substring(0, 3) }
     * ]
     */
    propertyAutoFormatters?: PropertyAutoFormatter[];
};
/**
 * Defines how to auto-generate a property from the enum key
 */
type PropertyAutoFormatter = {
    /** The property name to generate */
    key: string;
    /** Function to transform the key into the property value */
    format: (k: string) => string;
};
/**
 * Options for filtering enum items in various methods
 */
type EnumFilterOptions = {
    /** Include items with null/undefined values (default: false) */
    showEmpty?: boolean;
    /** Include deprecated items (default: false) */
    showDeprecated?: boolean;
};
/**
 * Standard dropdown/select option format
 */
type DropdownOption = {
    value: string;
    label: string;
    iconText?: string;
};
/**
 * All extension methods that are automatically added to enum objects.
 * These methods provide various ways to look up and filter enum items.
 */
type ExtensionMethods<T, TEnumItemExtension> = {
    /** Get enum item by its value. Throws if not found. */
    fromValue: (target: string) => EnumItem<T, TEnumItemExtension>;
    /** Get enum item by its key. Throws if not found. */
    fromKey: (target: string) => EnumItem<T, TEnumItemExtension>;
    /** Get enum item by its display text. Throws if not found. */
    fromDisplay: (target: string) => EnumItem<T, TEnumItemExtension>;
    /** Get enum item by its value. Returns undefined if not found. */
    tryFromValue: (target?: string | null) => EnumItem<T, TEnumItemExtension> | undefined;
    /** Get enum item by its key. Returns undefined if not found. */
    tryFromKey: (target?: string | null) => EnumItem<T, TEnumItemExtension> | undefined;
    /**
     * Get enum item by any custom field. Returns undefined if not found.
     * @example
     * MyEnum.tryFromCustomField('role', 'admin', item => !item.deprecated)
     */
    tryFromCustomField: (field: keyof TEnumItemExtension, target?: string | null, filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean) => EnumItem<T, TEnumItemExtension> | undefined;
    /** Get enum item by its display text. Returns undefined if not found. */
    tryFromDisplay: (target?: string | null) => EnumItem<T, TEnumItemExtension> | undefined;
    /**
     * Extract values from a custom field across all enum items
     * @example
     * const roles = MyEnum.toCustomFieldValues<string>('role', item => item.active)
     */
    toCustomFieldValues: <X = string>(field: keyof TEnumItemExtension, filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => X[];
    /** Convert enum items to dropdown options, sorted by index */
    toOptions: (filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => DropdownOption[];
    /** Get all enum values as an array */
    toValues: (filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => string[];
    /** Get all enum keys as an array */
    toKeys: (filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => string[];
    /** Get all display values as an array */
    toDisplays: (filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => string[];
    /** Get all enum items as an array (useful for iteration) */
    toEnumItems: (filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => EnumItem<T, TEnumItemExtension>[];
    /**
     * Convert to an object keyed by enum keys.
     * Useful for creating subsets or filtered versions of the enum.
     */
    toExtendableObject: <ITEM_TYPE extends BaseEnum>(filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean, filterOptions?: EnumFilterOptions) => Record<string, ITEM_TYPE>;
};
/**
 * Converts a readonly string array type to an object type with BaseEnum values
 * @internal
 */
type ArrayToObjectType<T extends readonly string[]> = {
    [K in T[number]]: BaseEnum;
};
/**
 * Normalizes the input type to always be an object format.
 * String arrays are converted to objects with empty BaseEnum values.
 * @internal
 */
type NormalizedInputType<T> = T extends readonly string[] ? ArrayToObjectType<T> : T extends {
    [k: string]: BaseEnum;
} ? T : never;
/**
 * The structure of each item in an enumeration.
 * Combines BaseEnum properties with any custom extensions.
 */
type EnumItem<T, TEnumItemExtension = Record<string, never>, K extends keyof NormalizedInputType<T> = keyof NormalizedInputType<T>> = {
    /** The original key from the input (e.g., 'USER_ADMIN') */
    key: K;
    value: string;
    display?: string;
    index?: number;
    deprecated?: boolean;
} & TEnumItemExtension;
/**
 * Helper type for extracting the enum type from an enumeration object
 */
type Enumeration<ENUM_OF, INPUT_TYPE> = EnumItem<INPUT_TYPE> & Omit<ENUM_OF[keyof ENUM_OF & keyof NormalizedInputType<INPUT_TYPE>], 'key' | 'value' | 'display' | 'index' | 'deprecated'>;

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

export { type BaseEnum, type DropdownOption, type EnumItem, type Enumeration, enumeration };
