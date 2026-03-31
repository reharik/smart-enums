type BuiltInOverrideKeys = 'key' | 'value' | 'display' | 'deprecated' | 'index' | '__smart_enum_brand' | '__smart_enum_type';
type StandardEnumItem = {
    readonly __smart_enum_brand: true;
    readonly __smart_enum_type: string;
    readonly key: string;
    readonly value: string;
    readonly display: string;
    readonly index: number;
    readonly deprecated?: boolean;
};
type EnumInputItem = Partial<{
    key: string;
    value: string;
    display: string;
    deprecated: boolean;
}> & object;
type ObjectEnumInput = Record<string, EnumInputItem>;
type EmptyEnumInputItem = Record<never, never>;
type Separator = '-' | '_' | ' ' | '.';
type IsUpperChar<C extends string> = C extends Uppercase<C> ? (C extends Lowercase<C> ? false : true) : false;
type IsLowerChar<C extends string> = C extends Lowercase<C> ? (C extends Uppercase<C> ? false : true) : false;
type PushUnderscore<S extends string> = S extends '' | `${string}_` ? S : `${S}_`;
type TrimUnderscore<S extends string> = S extends `_${infer R}` ? TrimUnderscore<R> : S extends `${infer R}_` ? TrimUnderscore<R> : S;
type CollapseUnderscores<S extends string> = S extends `${infer A}__${infer B}` ? CollapseUnderscores<`${A}_${B}`> : S;
type ConstantCaseInternal<S extends string, Prev extends string = '', Out extends string = ''> = S extends `${infer C}${infer Rest}` ? C extends Separator ? ConstantCaseInternal<Rest, C, PushUnderscore<Out>> : IsUpperChar<C> extends true ? IsLowerChar<Prev> extends true ? ConstantCaseInternal<Rest, C, `${PushUnderscore<Out>}${Uppercase<C>}`> : ConstantCaseInternal<Rest, C, `${Out}${Uppercase<C>}`> : ConstantCaseInternal<Rest, C, `${Out}${Uppercase<C>}`> : CollapseUnderscores<TrimUnderscore<Out>>;
type ConstantCase<S extends string> = string extends S ? string : ConstantCaseInternal<S>;
type ArrayToObjectType<T extends readonly string[]> = {
    [K in T[number]]: EmptyEnumInputItem & {
        readonly value?: ConstantCase<K>;
    };
};
type NormalizedInputType<TInput> = TInput extends readonly string[] ? ArrayToObjectType<TInput> : TInput extends ObjectEnumInput ? TInput : never;
type UnionKeys<T> = T extends T ? keyof T : never;
type MergeUnionToObject<T> = {
    [K in UnionKeys<T>]: T extends Record<K, infer V> ? V : undefined;
};
type ExtraShapeUnion<TObj extends ObjectEnumInput> = {
    [K in keyof TObj]: Omit<TObj[K], BuiltInOverrideKeys>;
}[keyof TObj];
type InferredExtraFields<TObj extends ObjectEnumInput> = MergeUnionToObject<ExtraShapeUnion<TObj>>;
type EnumItemFromNormalizedObject<TObj extends ObjectEnumInput, K extends keyof TObj = keyof TObj> = Omit<StandardEnumItem, 'key' | 'value'> & InferredExtraFields<TObj> & {
    readonly key: Extract<K, string>;
    readonly value: TObj[K] extends {
        value?: infer V;
    } ? Extract<V, string> extends never ? string : Extract<V, string> : string;
};
type EnumMemberUnionFromNormalizedObject<TObj extends ObjectEnumInput> = {
    [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
}[keyof TObj];
type CoreEnumMethods<TItem extends StandardEnumItem> = {
    fromValue(value: string): TItem;
    tryFromValue(value?: string | null): TItem | undefined;
    fromKey(key: string): TItem;
    tryFromKey(key?: string | null): TItem | undefined;
    items(): readonly TItem[];
    values(): readonly string[];
    keys(): readonly string[];
};
type EnumFromNormalizedObject<TObj extends ObjectEnumInput> = {
    [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
} & CoreEnumMethods<EnumMemberUnionFromNormalizedObject<TObj>>;
type EnumerationProps<TInput> = {
    input: TInput;
    propertyAutoFormatters?: PropertyAutoFormatter[];
};
type PropertyAutoFormatter = {
    key: string;
    format: (k: string) => string;
};
declare function enumeration<const TArr extends readonly string[]>(enumType: string, props: EnumerationProps<TArr>): EnumFromNormalizedObject<NormalizedInputType<TArr>>;
declare function enumeration<const TObj extends ObjectEnumInput>(enumType: string, props: EnumerationProps<TObj>): EnumFromNormalizedObject<NormalizedInputType<TObj>>;

/**
 * Logger interface for smart-enums library
 *
 * This interface allows users to inject their own logging implementation
 * or use the default console logger.
 */
type Logger = {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
};

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
type AnyEnumLike = {
    tryFromValue: (value?: string | null) => unknown;
    tryFromKey: (key?: string | null) => unknown;
} & Record<string, unknown>;
type RevivedSmartEnums<T, M extends Record<string, AnyEnumLike>> = T extends ReadonlyArray<infer U> ? RevivedSmartEnums<U, M>[] : T extends Array<infer U> ? RevivedSmartEnums<U, M>[] : T extends object ? {
    [K in keyof T]: K extends Extract<keyof M, string> ? Enumeration<M[K]> : RevivedSmartEnums<T[K], M>;
} : T;
type SmartEnumItemSerialized = {
    __smart_enum_type: string;
    value: string;
};
/**
 * Configuration for API helpers with auto-learning capabilities
 */
type SmartApiHelperConfig = {
    /** Registry of enum types for revival */
    enumRegistry: Record<string, AnyEnumLike>;
    /** Optional mapping of field paths to enum types for database revival */
    fieldEnumMapping?: Record<string, string | string[]>;
};
/**
 * Compile-time transformer: replaces Smart Enum items with string values,
 * recursively over arrays and objects. Used for database storage.
 */
type DatabaseFormat<T> = T extends {
    value: string;
    key: unknown;
} ? string : T extends ReadonlyArray<infer U> ? ReadonlyArray<DatabaseFormat<U>> : T extends Array<infer U> ? DatabaseFormat<U>[] : T extends object ? {
    [K in keyof T]: DatabaseFormat<T[K]>;
} : T;
/**
 * Log levels for smart enum mappings
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * Configuration for smart enum mappings initialization
 */
type SmartEnumMappingsConfig = {
    enumRegistry: Record<string, AnyEnumLike>;
    logLevel?: LogLevel;
    logger?: Logger;
};
type Enumeration<TEnum> = {
    [K in keyof TEnum]: TEnum[K] extends {
        __smart_enum_brand: true;
    } ? TEnum[K] : never;
}[keyof TEnum];

/**
 * Runtime type guard to detect Smart Enum items created by this library.
 * Returns true if the value has the SMART_ENUM_ITEM symbol.
 *
 * @example
 * ```typescript
 * import { Status } from './status';
 * const item = Status.active;
 * isSmartEnumItem(item); // true
 * isSmartEnumItem({ key: 'active', value: 'ACTIVE' }); // false (plain object)
 * if (isSmartEnumItem(x)) {
 *   console.log(x.value, x.__smart_enum_type); // narrowed to enum item
 * }
 * ```
 */
declare const isSmartEnumItem: (x: unknown) => x is {
    key: string;
    value: string;
    index?: number;
    __smart_enum_type?: string;
};
/**
 * Runtime type guard to detect a full Smart Enum object created by this library.
 * Returns true if the object has the SMART_ENUM property.
 *
 * @example
 * ```typescript
 * import { MyEnum } from './blah';
 * isSmartEnum(MyEnum) === true; // true
 * isSmartEnum(MyEnum.one) === false; // false (this is an item, not the enum)
 * ```
 */
declare const isSmartEnum: (x: unknown) => boolean;

export { type AnyEnumLike as A, type DatabaseFormat as D, type Enumeration as E, type Logger as L, type RevivedSmartEnums as R, type SmartApiHelperConfig as S, isSmartEnum as a, type LogLevel as b, type SmartEnumMappingsConfig as c, type SerializedSmartEnums as d, enumeration as e, type SmartEnumItemSerialized as f, isSmartEnumItem as i };
