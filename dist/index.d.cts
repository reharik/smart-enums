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
type EnumerationProps<TInput extends EnumInput, TEnumItemExtension = Record<string, never>, TExtraExtensionMethods = Record<string, never>> = {
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
     * Auto-formatters for generating additional properties from the enum key.
     * By default, 'value' uses constantCase and 'display' uses capitalCase.
     * @example
     * propertyAutoFormatters: [
     *   { key: 'slug', format: (k) => k.toLowerCase() },
     *   { key: 'code', format: (k) => k.substring(0, 3) }
     * ]
     */
    propertyAutoFormatters?: PropertyAutoFormatter[];
    /**
     * Optional identifier for this enum type. When provided, enum items will
     * serialize with a toJSON() that includes this id so consumers can revive
     * without an external field map. Example output: { __smart_enum_type: 'Status', value: 'ACTIVE' }
     */
    enumType?: string;
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
type ObjectEnumInput = {
    readonly [k: string]: Readonly<Partial<BaseEnum> & Record<string, unknown>>;
};
type EnumInput = readonly string[] | ObjectEnumInput;
/**
 * All extension methods that are automatically added to enum objects.
 * These methods provide various ways to look up and filter enum items.
 */
type ExtensionMethods<E, TEnumItemExtension> = {
    /** Get enum item by its value. Throws if not found. */
    fromValue: (target: string) => ItemOf<E>;
    /** Get enum item by its key. Throws if not found. */
    fromKey: (target: string) => ItemOf<E>;
    /** Get enum item by its display text. Throws if not found. */
    fromDisplay: (target: string) => ItemOf<E>;
    /** Get enum item by its value. Returns undefined if not found. */
    tryFromValue: (target?: string | null) => ItemOf<E> | undefined;
    /** Get enum item by its key. Returns undefined if not found. */
    tryFromKey: (target?: string | null) => ItemOf<E> | undefined;
    /**
     * Get enum item by any custom field. Returns undefined if not found.
     * @example
     * MyEnum.tryFromCustomField('role', 'admin', item => !item.deprecated)
     */
    tryFromCustomField: (field: keyof TEnumItemExtension, target?: string | null, filter?: (item: ItemOf<E>) => boolean) => ItemOf<E> | undefined;
    /** Get enum item by its display text. Returns undefined if not found. */
    tryFromDisplay: (target?: string | null) => ItemOf<E> | undefined;
    /**
     * Extract values from a custom field across all enum items
     * @example
     * const roles = MyEnum.toCustomFieldValues<string>('role', item => item.active)
     */
    toCustomFieldValues: <X = string>(field: keyof TEnumItemExtension, filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => X[];
    /** Convert enum items to dropdown options, sorted by index */
    toOptions: (filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => DropdownOption[];
    /** Get all enum values as an array */
    toValues: (filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => string[];
    /** Get all enum keys as an array */
    toKeys: (filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => string[];
    /** Get all display values as an array */
    toDisplays: (filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => string[];
    /** Get all enum items as an array (useful for iteration) */
    toEnumItems: (filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => ItemOf<E>[];
    /**
     * Convert to an object keyed by enum keys.
     * Useful for creating subsets or filtered versions of the enum.
     */
    toExtendableObject: <ITEM_TYPE extends BaseEnum>(filter?: (item: ItemOf<E>) => boolean, filterOptions?: EnumFilterOptions) => Record<string, ITEM_TYPE>;
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
    readonly [k: string]: Readonly<Record<string, unknown>>;
} ? T : never;
/**
 * The structure of each item in an enumeration.
 * Combines BaseEnum properties with any custom extensions.
 */
type EnumItem<T = unknown, TEnumItemExtension = Record<string, never>> = ({
    /** The original key from the input (e.g., 'USER_ADMIN') */
    key: string;
    value: string;
    display?: string;
    index?: number;
    deprecated?: boolean;
    /** Type-level brand for filtering item members */
    readonly __smart_enum_brand: true;
} & TEnumItemExtension) & (T extends unknown ? object : never);
/** Public helper alias for consumers */
type ItemOf<E> = E[keyof E];
/**
 * Helper to get the enum item type from an enum object returned by enumeration().
 * Usage:
 *   const MyEnum = enumeration({ input });
 *   type MyEnumItem = EnumItemType<typeof MyEnum>;
 */
type EnumItemType<TEnum extends Record<string, unknown>> = TEnum extends Record<string, infer V> ? V extends {
    __smart_enum_brand: true;
} ? V : never : never;
/**
 * Helper type for extracting the enum type from an enumeration object
 */
type Enumeration<ENUM_OF extends Record<string, unknown>> = ENUM_OF extends Record<string, infer V> ? V extends {
    __smart_enum_brand: true;
} ? V : never : never;
/**
 * Compile-time transformer: replaces Smart Enum items with string values,
 * recursively over arrays and objects. Structural detection checks for
 * presence of `key` and `value`.
 */
type SerializedSmartEnums<T> = T extends {
    value: string;
    key: unknown;
} ? string : T extends ReadonlyArray<infer U> ? ReadonlyArray<SerializedSmartEnums<U>> : T extends Array<infer U> ? SerializedSmartEnums<U>[] : T extends object ? {
    [K in keyof T]: SerializedSmartEnums<T[K]>;
} : T;
/**
 * Revived shape: for keys present in mapping M, the string becomes the
 * corresponding enum item type (derived from the provided enum object);
 * other fields recurse.
 */
type EnumItemFromEnum<TEnum> = TEnum extends Record<string, infer V> ? V extends {
    __smart_enum_brand: true;
} ? V : never : never;
type AnyEnumLike = {
    tryFromValue: (value?: string | null) => {
        value: string;
    } | undefined;
} & Record<string, {
    value: string;
}>;
type RevivedSmartEnums<T, M extends Record<string, AnyEnumLike>> = T extends ReadonlyArray<infer U> ? ReadonlyArray<RevivedSmartEnums<U, M>> : T extends Array<infer U> ? RevivedSmartEnums<U, M>[] : T extends object ? {
    [K in keyof T]: K extends Extract<keyof M, string> ? EnumItemFromEnum<M[K]> : RevivedSmartEnums<T[K], M>;
} : T;

/**
 * Runtime type guard to detect Smart Enum items created by this library.
 */
declare const isSmartEnumItem: (x: unknown) => x is {
    key: string;
    value: string;
    index?: number;
};
declare function enumeration<TArr extends readonly string[], TEnumItemExtension = Record<string, never>, TExtraExtensionMethods = Record<string, never>>(props: EnumerationProps<TArr, TEnumItemExtension, TExtraExtensionMethods>): {
    [K in keyof ArrayToObjectType<TArr>]: EnumItem<ArrayToObjectType<TArr>, TEnumItemExtension>;
} & ExtensionMethods<{
    [K in keyof ArrayToObjectType<TArr>]: EnumItem<ArrayToObjectType<TArr>, TEnumItemExtension>;
}, TEnumItemExtension> & TExtraExtensionMethods;
declare function enumeration<TObj extends ObjectEnumInput, TEnumItemExtension = Record<string, never>, TExtraExtensionMethods = Record<string, never>>(props: EnumerationProps<TObj, TEnumItemExtension, TExtraExtensionMethods>): {
    [K in keyof TObj]: EnumItem<TObj, TEnumItemExtension>;
} & ExtensionMethods<{
    [K in keyof TObj]: EnumItem<TObj, TEnumItemExtension>;
}, TEnumItemExtension> & TExtraExtensionMethods;

declare function serializeSmartEnums<T>(input: T): SerializedSmartEnums<T>;
declare function serializeSmartEnums<S extends Readonly<Record<string, unknown>> | readonly unknown[]>(input: unknown): S;
declare function reviveSmartEnums<T, const M extends Record<string, AnyEnumLike>>(input: T, enumByField: M): RevivedSmartEnums<T, M>;
declare function reviveSmartEnums<R extends Readonly<Record<string, unknown>> | readonly unknown[]>(input: unknown, enumByField: Record<string, AnyEnumLike>): R;

export { type AnyEnumLike, type BaseEnum, type DropdownOption, type EnumItem, type EnumItemType, type Enumeration, enumeration, isSmartEnumItem, reviveSmartEnums, serializeSmartEnums };
