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
  readonly toJSON: () => string | { __smart_enum_type: string; value: string };
  readonly equals: <
    This extends { __smart_enum_type: string },
    T extends {
      __smart_enum_type: This['__smart_enum_type'];
    } & StandardEnumItem,
  >(
    this: This,
    other: T,
  ) => this is T;
};

/**
 * Display-friendly, fully-typed enum member. Structurally equivalent to
 * {@link StandardEnumItem} (plus {@link SmartEnumMatch}), but expressed as a
 * *generic interface* so editors show a single named line on hover — e.g.
 * `SmartEnumItem<"EventType", "commentPosted", "COMMENT_POSTED", "Comment Posted">`
 * — with the enum name first, instead of expanding every field. This is the
 * shape every `enumeration()` member resolves to (see
 * {@link EnumItemFromNormalizedObject}); custom extra fields are intersected on
 * top, keeping the name visible.
 *
 * Being an interface (nominal) rather than a type alias is deliberate: TS keeps
 * interface references folded on hover across TS versions, where the previous
 * intersection-of-aliases was free to expand into noise.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SmartEnumItem<
  TName extends string = string,
  TKey extends string = string,
  TValue extends string = string,
  TDisplay extends string = string,
> extends SmartEnumMatch {
  readonly __smart_enum_brand: true;
  readonly __smart_enum_type: TName;
  readonly key: TKey;
  readonly value: TValue;
  readonly display: TDisplay;
  readonly index: number;
  readonly deprecated?: boolean;
  readonly toPostgres: () => string;
  readonly toJSON: () => string | { __smart_enum_type: string; value: string };
  readonly equals: <
    This extends { __smart_enum_type: string },
    T extends {
      __smart_enum_type: This['__smart_enum_type'];
    } & StandardEnumItem,
  >(
    this: This,
    other: T,
  ) => this is T;
}

/**
 * Attaches per-member extra fields to a {@link SmartEnumItem} without hiding its
 * name. When there are no extras the base interface is returned untouched (so
 * hover shows a bare `SmartEnumItem<...>`); otherwise the extras are materialized
 * to a plain object literal and intersected — `SmartEnumItem<...> & { weight: 5 }`.
 * The conditional is what lets the surrounding alias name resolve away on hover.
 */
export type WithExtra<TBase, TExtra> = keyof TExtra extends never
  ? TBase
  : TBase & { [P in keyof TExtra]: TExtra[P] };

export type EnumInputItem = Partial<{
  key: string;
  value: string;
  display: string;
  deprecated: boolean;
}> &
  Record<string, unknown>;

export type ObjectEnumInput = Record<string, EnumInputItem>;

export type EmptyEnumInputItem = Record<never, never>;

type Separator = '-' | '_' | ' ' | '.';

type IsUpperChar<C extends string> =
  C extends Uppercase<C> ? (C extends Lowercase<C> ? false : true) : false;

type IsLowerChar<C extends string> =
  C extends Lowercase<C> ? (C extends Uppercase<C> ? false : true) : false;

type PushUnderscore<S extends string> = S extends '' | `${string}_`
  ? S
  : `${S}_`;

type TrimUnderscore<S extends string> = S extends `_${infer R}`
  ? TrimUnderscore<R>
  : S extends `${infer R}_`
    ? TrimUnderscore<R>
    : S;

type CollapseUnderscores<S extends string> = S extends `${infer A}__${infer B}`
  ? CollapseUnderscores<`${A}_${B}`>
  : S;

type ConstantCaseInternal<
  S extends string,
  Prev extends string = '',
  Out extends string = '',
> = S extends `${infer C}${infer Rest}`
  ? C extends Separator
    ? ConstantCaseInternal<Rest, C, PushUnderscore<Out>>
    : IsUpperChar<C> extends true
      ? IsLowerChar<Prev> extends true
        ? ConstantCaseInternal<Rest, C, `${PushUnderscore<Out>}${Uppercase<C>}`>
        : ConstantCaseInternal<Rest, C, `${Out}${Uppercase<C>}`>
      : ConstantCaseInternal<Rest, C, `${Out}${Uppercase<C>}`>
  : CollapseUnderscores<TrimUnderscore<Out>>;

type ConstantCase<S extends string> = string extends S
  ? string
  : ConstantCaseInternal<S>;

/** Segments of a `ConstantCase` string (underscore-separated ALL CAPS words). */
type SplitConstantCaseSegments<S extends string> =
  S extends `${infer A}_${infer B}`
    ? [A, ...SplitConstantCaseSegments<B>]
    : [S];

/** First character upper, remainder lower (for ALL-CAPS words from `ConstantCase`). */
type TitleCaseAllCapsWord<W extends string> = W extends ''
  ? ''
  : W extends `${infer F}${infer R}`
    ? `${Uppercase<F>}${Lowercase<R>}`
    : W;

type JoinDisplaySegments<T extends readonly string[]> = T extends readonly [
  infer A extends string,
  ...infer Rest extends readonly string[],
]
  ? Rest extends readonly []
    ? TitleCaseAllCapsWord<A>
    : `${TitleCaseAllCapsWord<A>} ${JoinDisplaySegments<Rest>}`
  : '';

/**
 * Display string derived from the enum member key: `ConstantCase` → split → title-case words → join with spaces.
 * Matches default runtime `capitalCase(key)` for typical PascalCase / camelCase keys. Member keys that already
 * contain separators may differ from `capitalCase` at runtime; custom `propertyAutoFormatters` for `display`
 * are not reflected in this type.
 */
type DisplayCaseFromEnumKey<K extends string> = string extends K
  ? string
  : JoinDisplaySegments<SplitConstantCaseSegments<ConstantCase<K>>>;

export type ArrayToObjectType<T extends readonly string[]> = {
  [K in T[number]]: EmptyEnumInputItem & { readonly value?: ConstantCase<K> };
};

export type NormalizedInputType<TInput> = TInput extends readonly string[]
  ? ArrayToObjectType<TInput>
  : TInput extends ObjectEnumInput
    ? TInput
    : never;

/** Input-derived fields for one member key (excludes built-ins filled by `enumeration()`). */
export type EnumMemberExtra<
  TObj extends ObjectEnumInput,
  K extends keyof TObj,
> = Omit<TObj[K], BuiltInOverrideKeys>;

/** `value` literal for member `K`: explicit `value` if given, else `ConstantCase<K>`. */
export type ItemValueFromNormalizedObject<
  TObj extends ObjectEnumInput,
  K extends keyof TObj,
> = TObj[K] extends { value?: infer V }
  ? [Extract<V, string>] extends [never]
    ? ConstantCase<Extract<K, string>>
    : Extract<V, string>
  : ConstantCase<Extract<K, string>>;

/** `display` literal for member `K`: explicit `display` if given, else derived from the key. */
export type ItemDisplayFromNormalizedObject<
  TObj extends ObjectEnumInput,
  K extends keyof TObj,
> = TObj[K] extends { display?: infer D }
  ? [Extract<D, string>] extends [never]
    ? DisplayCaseFromEnumKey<Extract<K, string>>
    : Extract<D, string>
  : DisplayCaseFromEnumKey<Extract<K, string>>;

/**
 * The type of a single enum member. Resolves to a named {@link SmartEnumItem}
 * reference (plus any custom fields via {@link WithExtra}), so hover shows the
 * enum name and member literals on one line instead of the full field dump.
 */
export type EnumItemFromNormalizedObject<
  TObj extends ObjectEnumInput,
  K extends keyof TObj = keyof TObj,
  TName extends string = string,
> = WithExtra<
  SmartEnumItem<
    TName,
    Extract<K, string>,
    ItemValueFromNormalizedObject<TObj, K>,
    ItemDisplayFromNormalizedObject<TObj, K>
  >,
  EnumMemberExtra<TObj, K>
>;

export type EnumMemberUnionFromNormalizedObject<
  TObj extends ObjectEnumInput,
  TName extends string = string,
> = {
  [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K, TName>;
}[keyof TObj];

export type EnumFromNormalizedObject<
  TObj extends ObjectEnumInput,
  TName extends string = string,
> = {
  [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K, TName>;
} & CoreEnumMethods<EnumMemberUnionFromNormalizedObject<TObj, TName>>;

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
  equals(a: TItem, b: TItem): boolean;
  /**
   * Narrowing membership predicate. Package-resistant (uses {@link enumItemsEqual}),
   * so it accepts an unknown/foreign value on purpose — unlike `equals`, it
   * carries no brand constraint.
   */
  has(x: unknown): x is TItem;
  items(): readonly TItem[];
  /** Matches runtime: `items.map(i => i.value)` (see {@link EnumLikeBase}). */
  values(): readonly TItem['value'][];
  /** Matches runtime: `items.map(i => i.key)` (see {@link EnumLikeBase}). */
  keys(): readonly TItem['key'][];
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
  equals(a: TItem, b: TItem): boolean;
  has(x: unknown): x is TItem;
  items(): readonly TItem[];
  values(): readonly TItem['value'][];
  keys(): readonly TItem['key'][];
} & Record<string, unknown>;

/**
 * A {@link EnumLikeBase} whose items are branded {@link StandardEnumItem}s (typical `enumeration()` result).
 */
export type SmartEnumLike<TItem extends StandardEnumItem = StandardEnumItem> =
  EnumLikeBase<TItem>;

/** Union of branded enum member values on an enum object `T`. */
export type SmartEnumMemberUnion<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends StandardEnumItem ? T[K] : never;
}[keyof T];

/** Keys on `TEnum` whose member matches `Record<P, V>` within `ItemUnion`. */
export type SmartEnumSubsetKeys<
  TEnum extends Record<string, unknown>,
  ItemUnion extends StandardEnumItem,
  P extends keyof ItemUnion & string,
  V extends ItemUnion[P],
> = {
  [K in keyof TEnum]: TEnum[K] extends Extract<ItemUnion, Record<P, V>>
    ? K
    : never;
}[keyof TEnum];

export type SmartEnumSubsetItemUnion<
  ItemUnion extends StandardEnumItem,
  P extends keyof ItemUnion & string,
  V extends ItemUnion[P],
> = Extract<ItemUnion, Record<P, V>>;

export type SmartEnumSubsetView<
  TEnum extends Record<string, unknown>,
  ItemUnion extends StandardEnumItem,
  P extends keyof ItemUnion & string,
  V extends ItemUnion[P],
> = Pick<TEnum, SmartEnumSubsetKeys<TEnum, ItemUnion, P, V>> &
  CoreEnumMethods<SmartEnumSubsetItemUnion<ItemUnion, P, V>>;

/** Return type of {@link getSubsetByProp} / {@link subsetByProp} for explicit consumer annotations. */
export type SubsetByPropResult<
  TEnum extends Record<string, unknown> &
    SmartEnumLike<SmartEnumMemberUnion<TEnum>>,
  P extends keyof SmartEnumMemberUnion<TEnum> & string,
  V extends SmartEnumMemberUnion<TEnum>[P],
> = SmartEnumSubsetView<TEnum, SmartEnumMemberUnion<TEnum>, P, V>;

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

/**
 * Serialization mode controls how smart-enum items are serialized to JSON.
 *
 * - 'wrapped' (default): toJSON returns { __smart_enum_type, value }.
 *   Use this when payloads need to be self-describing for revival on the
 *   receiving end (e.g. REST APIs with explicit revive middleware).
 *
 * - 'value': toJSON returns just the wire value string.
 *   Use this when the receiving end already knows the enum types from
 *   schema context (e.g. GraphQL boundaries).
 *
 * Resolution order at toJSON call time:
 *   1. Per-enum `serializeAs` option (if set on enumeration())
 *   2. Global default (set via setDefaultSerializationMode)
 *   3. 'wrapped' (built-in default, preserves backward compatibility)
 */
export type SerializationMode = 'wrapped' | 'value';

export type EnumerationProps<TInput> = {
  input: TInput;
  propertyAutoFormatters?: PropertyAutoFormatter[];
  serializeAs?: SerializationMode;
};

export type Enumeration<TEnum> =
  TEnum extends Record<string, infer V>
    ? V extends { __smart_enum_brand: true }
      ? V
      : never
    : never;

export type FinalizedEnumFields = Pick<
  StandardEnumItem,
  '__smart_enum_brand' | '__smart_enum_type' | 'toJSON'
>;
export type FinalizableEnumItem = {
  key: string;
  value: string;
  display: string;
  index: number;
  deprecated?: boolean;
};

/**
 * Exhaustive branch-on-member. One arm required per member of the *statically
 * known* receiver — miss one and it won't compile. Over a pickEnum view the
 * arms are exhaustive over just the picked members.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface SmartEnumMatch {
  readonly key: string;
  match<R>(handlers: {
    [P in this['key']]: (item: Extract<this, { key: P }>) => R;
  }): R;
}

/** Member keys of an enum object (excludes the method keys). */
export type EnumMemberKeys<TEnum> = {
  [K in keyof TEnum]: TEnum[K] extends StandardEnumItem ? K : never;
}[keyof TEnum];

/**
 * Enum-like view over an explicit list of member keys. Reuses the parent's item
 * references; methods scope to the picked subset. See {@link pickEnum}.
 */
export type PickEnumView<
  TEnum extends Record<string, unknown>,
  K extends EnumMemberKeys<TEnum>,
> = Pick<TEnum, K> & CoreEnumMethods<Extract<TEnum[K], StandardEnumItem>>;

/**
 * Enum-like view over an enum with an explicit list of member keys *removed*.
 * Reuses the parent's item references; methods scope to the remaining members.
 * The inverse of {@link PickEnumView}. See {@link omitEnum}.
 */
export type OmitEnumView<
  TEnum extends Record<string, unknown>,
  K extends EnumMemberKeys<TEnum>,
> = Pick<TEnum, Exclude<EnumMemberKeys<TEnum>, K>> &
  CoreEnumMethods<
    Extract<TEnum[Exclude<EnumMemberKeys<TEnum>, K>], StandardEnumItem>
  >;

/**
 * Selector accepted by {@link EnumSubset}: either a bare member-key union
 * (kept, i.e. include) or an explicit `{ include }` / `{ exclude }` object.
 */
export type EnumSubsetSelector<TItems extends StandardEnumItem> =
  | TItems['key']
  | { include: TItems['key'] }
  | { exclude: TItems['key'] };

/**
 * Narrows a member-item union to a subset of its keys.
 *
 * The selector may be:
 *  - a bare key union — `EnumSubset<Items, 'a' | 'b'>` keeps `a` and `b`;
 *  - `{ include: K }` — same as the bare form, but explicit;
 *  - `{ exclude: K }` — keeps every member *except* `K`.
 *
 * @example
 * ```ts
 * type Items = SmartEnumMemberUnion<typeof EntityType>;
 * type Targets = EnumSubset<Items, { exclude: 'album' }>; // comment | mediaItem
 * ```
 */
export type EnumSubset<
  TItems extends StandardEnumItem,
  Sel extends EnumSubsetSelector<TItems>,
> = Sel extends { exclude: infer K }
  ? Exclude<TItems, { key: K }>
  : Sel extends { include: infer K }
    ? Extract<TItems, { key: K }>
    : Extract<TItems, { key: Sel }>;
