import { DropdownOption, BaseEnum, EnumFilterOptions, EnumItem } from './types';
export declare const addExtensionMethods: <T, TEnumItemExtension = {}, TExtraExtensionMethods = {}>(enumItems: EnumItem<T, TEnumItemExtension>[], extraExtensionMethods?: (enumItems: EnumItem<T, TEnumItemExtension>[]) => TExtraExtensionMethods) => {
    fromValue: (target: string) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>>;
    fromKey: (target: string) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>>;
    fromDisplay: (target: string) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>>;
    tryFromValue: (target?: string | null) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>> | undefined;
    tryFromKey: (target?: string | null) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>> | undefined;
    tryFromCustomField: (field: keyof TEnumItemExtension, target?: string | null, filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>> | undefined;
    tryFromDisplay: (target?: string | null) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>> | undefined;
    toCustomFieldValues: <X = string>(field: keyof TEnumItemExtension, filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => X[];
    toOptions: (filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => DropdownOption[];
    toValues: (filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => string[];
    toKeys: (filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => string[];
    toDisplays: (filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => string[];
    toEnumItems: (filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => EnumItem<T, TEnumItemExtension, import("./types").Source<T>>[];
    toExtendableObject: <ITEM_TYPE extends BaseEnum>(filter?: ((item: EnumItem<T, TEnumItemExtension, import("./types").Source<T>>) => boolean) | undefined, filterOptions?: EnumFilterOptions) => Record<string, ITEM_TYPE>;
} & TExtraExtensionMethods;
//# sourceMappingURL=extensionMethods.d.ts.map