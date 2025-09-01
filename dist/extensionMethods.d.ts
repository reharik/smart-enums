import { DropdownOption, BaseEnum, EnumFilterOptions, EnumItem } from './types.js';
/**
 * Adds extension methods to an enum object.
 * This is the main factory that creates all the utility methods for enum lookup and filtering.
 *
 * @param enumItems - Array of all enum items
 * @param extraExtensionMethods - Optional factory for additional custom methods
 * @returns An object containing all standard extension methods plus any custom methods
 */
export declare const addExtensionMethods: <T, TEnumItemExtension = Record<string, never>, TExtraExtensionMethods = Record<string, never>>(enumItems: EnumItem<T, TEnumItemExtension>[], extraExtensionMethods?: (enumItems: EnumItem<T, TEnumItemExtension>[]) => TExtraExtensionMethods) => {
    fromValue: (target: string) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>;
    fromKey: (target: string) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>;
    fromDisplay: (target: string) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>;
    tryFromValue: (target?: string | null) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>> | undefined;
    tryFromKey: (target?: string | null) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>> | undefined;
    tryFromCustomField: (field: keyof TEnumItemExtension, target?: string | null, filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>> | undefined;
    tryFromDisplay: (target?: string | null) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>> | undefined;
    toCustomFieldValues: <X = string>(field: keyof TEnumItemExtension, filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => X[];
    toOptions: (filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => DropdownOption[];
    toValues: (filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => string[];
    toKeys: (filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => string[];
    toDisplays: (filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => string[];
    toEnumItems: (filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>[];
    toExtendableObject: <ITEM_TYPE extends BaseEnum>(filter?: ((item: EnumItem<T, TEnumItemExtension, keyof import("./types.js").NormalizedInputType<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => Record<string, ITEM_TYPE>;
} & TExtraExtensionMethods;
