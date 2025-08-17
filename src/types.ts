export const notEmpty = <X>(value: X | null | undefined): value is X => {
  if (value === null || value === undefined) return false;
  return true;
};

export type BaseEnum = {
  value: string;
  display?: string;
  index?: number;
  deprecated?: boolean;
};

export type Source<T> = T extends { [k: string]: unknown }
  ? keyof T
  : T extends readonly string[]
  ? T[number]
  : never;

export type Enumeration<ENUM_OF, INPUT_TYPE> = EnumItem<INPUT_TYPE> &
  Omit<
    ENUM_OF[keyof ENUM_OF & Source<INPUT_TYPE>],
    'key' | 'value' | 'display' | 'index' | 'deprecated'
  >;

export type EnumItem<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TEnumItemExtension = {},
  K extends Source<T> = Source<T>,
> = {
  key: K;
  value: string;
  display?: string;
  index?: number;
  deprecated?: boolean;
} & TEnumItemExtension;

export type EnumFromObj<
  TSource extends { [k: string]: unknown },
  TEnumItemExtension,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
> = {
  [K in Source<TSource>]: EnumItem<TSource, TEnumItemExtension, K>;
} & ExtensionMethods<TSource, TEnumItemExtension> &
  TExtraExtensionMethods;

export type EnumFromArr<
  TSource extends readonly string[],
  TEnumItemExtension,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
> = {
  [K in Source<TSource>]: EnumItem<TSource, TEnumItemExtension, K>;
} & ExtensionMethods<TSource, TEnumItemExtension> &
  TExtraExtensionMethods;

export type PropertyAutoFormatter = {
  key: string;
  format: (k: string) => string;
};

export type EnumFromObjProps<
  TSource extends { [k: string]: unknown },
  TEnumItemExtension,
  TExtraExtensionMethods,
> = {
  input: TSource;
  extraExtensionMethods?: (
    enumItems: EnumItem<TSource, TEnumItemExtension>[],
  ) => TExtraExtensionMethods;
  transform?: (v: Source<TSource>) => EnumItem<TSource, TEnumItemExtension>;
  propertyAutoFormatters?: PropertyAutoFormatter[];
};

export type EnumFromArrProps<
  TSource extends readonly string[],
  TEnumItemExtension,
  TExtraExtensionMethods,
> = {
  input: TSource;
  extraExtensionMethods?: (
    enumItems: EnumItem<TSource, TEnumItemExtension>[],
  ) => TExtraExtensionMethods;
  transform?: (v: Source<TSource>) => EnumItem<TSource, TEnumItemExtension>;
  propertyAutoFormatters?: PropertyAutoFormatter[];
};

export interface EnumFilterOptions {
  showEmpty?: boolean;
  showDeprecated?: boolean;
}

export type DropdownOption = {
  value: string;
  label: string;
  iconText?: string;
};

export type ExtensionMethods<T, TEnumItemExtension> = {
  fromValue: (target: string) => EnumItem<T, TEnumItemExtension>;
  fromKey: (target: string) => EnumItem<T, TEnumItemExtension>;
  fromDisplay: (target: string) => EnumItem<T, TEnumItemExtension>;
  tryFromValue: (
    target?: string | null,
  ) => EnumItem<T, TEnumItemExtension> | undefined;
  tryFromKey: (
    target?: string | null,
  ) => EnumItem<T, TEnumItemExtension> | undefined;
  tryFromCustomField: (
    field: keyof TEnumItemExtension,
    target?: string | null,
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
  ) => EnumItem<T, TEnumItemExtension> | undefined;
  tryFromDisplay: (
    target?: string | null,
  ) => EnumItem<T, TEnumItemExtension> | undefined;
  toCustomFieldValues: <X = string>(
    field: keyof TEnumItemExtension,
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => X[];
  toOptions: (
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => DropdownOption[];
  toValues: (
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => string[];
  toKeys: (
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => string[];
  toDisplays: (
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => string[];
  toEnumItems: (
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => EnumItem<T, TEnumItemExtension>[];
  toExtendableObject: <ITEM_TYPE extends BaseEnum>(
    filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    filterOptions?: EnumFilterOptions,
  ) => Record<string, ITEM_TYPE>;
};

export type ExtendedInput<T, X extends object> = {
  [k in keyof T]: BaseEnum & X;
};
