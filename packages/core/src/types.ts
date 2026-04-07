/**
 * Type guard to check if a value is not null or undefined
 * @param value - The value to check
 * @returns True if the value is defined and not null
 */
export const notEmpty = <X>(
  value: X | null | undefined,
): value is NonNullable<X> => {
  // eslint-disable-next-line unicorn/no-null
  return value != null;
};

// Public symbols used at runtime for detection/identity (not used in type keys)
export const SMART_ENUM_ITEM = Symbol('smart-enum-item');
export const SMART_ENUM_ID = Symbol('smart-enum-id');
export const SMART_ENUM = Symbol('smart-enum');

/**
 * Options for filtering enum items in various methods
 */
export type EnumFilterOptions = {
  /** Include items with null/undefined values (default: false) */
  showEmpty?: boolean;
  /** Include deprecated items (default: false) */
  showDeprecated?: boolean;
};

// export type EnumInput = readonly string[] | ObjectEnumInput;

/**
 * Compile-time transformer: replaces Smart Enum items with string values,
 * recursively over arrays and objects. Structural detection checks for
 * presence of `key` and `value`.
 */
export type SerializedSmartEnums<T> = T extends { value: string; key: unknown }
  ? string
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<SerializedSmartEnums<U>>
    : T extends Array<infer U>
      ? SerializedSmartEnums<U>[]
      : T extends object
        ? { [K in keyof T]: SerializedSmartEnums<T[K]> }
        : T;

/**
 * Revived shape: for keys present in mapping M, the string becomes the
 * corresponding enum item type (derived from the provided enum object);
 * other fields recurse.
 */
export type EnumItemFromEnum<TEnum> =
  TEnum extends Record<string, infer V>
    ? V extends { __smart_enum_brand: true }
      ? V
      : never
    : never;

/**
 * Structural constraint for smart enum instances (registry entries, `reviveSmartEnums`, etc.).
 * `T` is the enum item type returned by `tryFromValue` / `tryFromKey` (default `unknown` when heterogeneous).
 */
export type AnyEnumLike<T = unknown> = {
  tryFromValue: (value?: string | null) => T | undefined;
  tryFromKey: (key?: string | null) => T | undefined;
} & Record<string, unknown>;

export type RevivedSmartEnums<T, M extends Record<string, AnyEnumLike>> =
  T extends ReadonlyArray<infer U>
    ? RevivedSmartEnums<U, M>[]
    : T extends Array<infer U>
      ? RevivedSmartEnums<U, M>[]
      : T extends object
        ? {
            [K in keyof T]: K extends Extract<keyof M, string>
              ? Enumeration<M[K]>
              : RevivedSmartEnums<T[K], M>;
          }
        : T;

export type SmartEnumItemSerialized = {
  __smart_enum_type: string;
  value: string;
};

/** Example shape for transport tests (`reviveAfterTransport` registry). */
export type SmartApiHelperConfig = {
  enumRegistry: Record<string, AnyEnumLike>;
};

/**
 * Compile-time transformer: replaces Smart Enum items with string values,
 * recursively over arrays and objects. Used for database storage.
 */
export type DatabaseFormat<T> = T extends { value: string; key: unknown }
  ? string
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DatabaseFormat<U>>
    : T extends Array<infer U>
      ? DatabaseFormat<U>[]
      : T extends object
        ? { [K in keyof T]: DatabaseFormat<T[K]> }
        : T;

/**
 * Log levels for smart enum mappings
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Configuration for smart enum mappings initialization
 */
export type SmartEnumMappingsConfig = {
  enumRegistry: Record<string, AnyEnumLike>;
  logLevel?: LogLevel;
  logger?: import('./utilities/logger.js').Logger;
};

type BuiltInOverrideKeys =
  | 'key'
  | 'value'
  | 'display'
  | 'deprecated'
  | 'index'
  | '__smart_enum_brand'
  | '__smart_enum_type';

/**
 * Structural fields shared by every enum member (key, value, display, index, optional deprecated).
 * Does not include smart-enum branding or database helpers; see {@link StandardEnumItem}.
 */
export type StandardEnumItemBase = {
  readonly key: string;
  readonly value: string;
  readonly display: string;
  readonly index: number;
  readonly deprecated?: boolean;
};

/**
 * Branded item produced by `enumeration()`: {@link StandardEnumItemBase} plus runtime identity
 * (`__smart_enum_brand`, `__smart_enum_type`) and `toPostgres()`.
 */
export type StandardEnumItem = StandardEnumItemBase & {
  readonly __smart_enum_brand: true;
  readonly __smart_enum_type: string;
  readonly toPostgres: () => string;
};

export type EnumInputItem = Partial<{
  key: string;
  value: string;
  display: string;
  deprecated: boolean;
}> &
  Record<string, unknown>;

export type ObjectEnumInput = Record<string, EnumInputItem>;

export type EmptyEnumInputItem = Record<never, never>;

export type ArrayToObjectType<T extends readonly string[]> = {
  [K in T[number]]: EmptyEnumInputItem;
};

export type NormalizedInputType<TInput> = TInput extends readonly string[]
  ? ArrayToObjectType<TInput>
  : TInput extends ObjectEnumInput
    ? TInput
    : never;

export type EnumItemFromNormalizedObject<
  TObj extends ObjectEnumInput,
  K extends keyof TObj = keyof TObj,
> = Omit<StandardEnumItem, 'key'> &
  InferredExtraFields<TObj> & {
    readonly key: Extract<K, string>;
  };

export type EnumMemberUnionFromNormalizedObject<TObj extends ObjectEnumInput> =
  {
    [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
  }[keyof TObj];

export type EnumFromNormalizedObject<TObj extends ObjectEnumInput> = {
  [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
} & CoreEnumMethods<EnumMemberUnionFromNormalizedObject<TObj>>;

export type UnionKeys<T> = T extends T ? keyof T : never;

/*
To widen the type of the OptionalObject from literals to their actual types,
e.g.
shape?: "round" | "square" | "long";
slices?: true;
layers?: 2;
--turns into:--
shape: string | undefined;
slices: boolean| undefined;
layers: number| undefined;

we can use the following code:
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T;

type MergeUnionToObject<T> = {
  [K in UnionKeys<T>]: T extends Record<K, infer V> ? Widen<V> : undefined;
};
*/

type MergeUnionToObject<T> = {
  [K in UnionKeys<T>]: T extends Record<K, infer V> ? V : undefined;
};

type ExtraShapeUnion<TObj extends ObjectEnumInput> = {
  [K in keyof TObj]: Omit<TObj[K], BuiltInOverrideKeys>;
}[keyof TObj];

export type InferredExtraFields<TObj extends ObjectEnumInput> =
  MergeUnionToObject<ExtraShapeUnion<TObj>>;

export type PropertyAutoFormatter = {
  /** The property name to generate */
  key: string;
  /** Function to transform the key into the property value */
  format: (k: string) => string;
};

export type CoreEnumMethods<TItem extends StandardEnumItem> = {
  fromValue(value: string): TItem;
  tryFromValue(value?: string | null): TItem | undefined;
  fromKey(key: string): TItem;
  tryFromKey(key?: string | null): TItem | undefined;
  items(): readonly TItem[];
  values(): readonly string[];
  keys(): readonly string[];
};

/**
 * Structural shape of a smart-style enum object: lookup by value/key, list items/values/keys,
 * plus an index signature so registry and mapping types can treat instances as records.
 * Use {@link SmartEnumLike} when items are full {@link StandardEnumItem}s (the usual case).
 */
export type EnumLikeBase<
  TItem extends StandardEnumItemBase = StandardEnumItemBase,
> = {
  fromValue(value: string): TItem;
  tryFromValue(value?: string | null): TItem | undefined;
  fromKey(key: string): TItem;
  tryFromKey(key?: string | null): TItem | undefined;
  items(): readonly TItem[];
  values(): readonly TItem['value'][];
  keys(): readonly TItem['key'][];
} & Record<string, unknown>;

/**
 * A {@link EnumLikeBase} whose items are branded {@link StandardEnumItem}s (typical `enumeration()` result).
 */
export type SmartEnumLike<TItem extends StandardEnumItem = StandardEnumItem> =
  EnumLikeBase<TItem>;

export type FieldEnumMapping = Record<string, SmartEnumLike>;

export type ReviveRowOptions = {
  fieldEnumMapping: FieldEnumMapping;
  strict?: boolean;
};

export type PathEnumMapping = Record<string, SmartEnumLike>;

export type RevivePayloadOptions = {
  pathEnumMapping: PathEnumMapping;
  strict?: boolean;
};

export type EnumerationProps<TInput> = {
  input: TInput;
  propertyAutoFormatters?: PropertyAutoFormatter[];
};

export type Enumeration<TEnum> =
  TEnum extends Record<string, infer V>
    ? V extends { __smart_enum_brand: true }
      ? V
      : never
    : never;

export type FinalizedEnumFields = Pick<
  StandardEnumItem,
  '__smart_enum_brand' | '__smart_enum_type'
>;
export type FinalizableEnumItem = {
  key: string;
  value: string;
  display: string;
  index: number;
  deprecated?: boolean;
};
