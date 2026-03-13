import { capitalCase, constantCase } from 'case-anything';

import { addExtensionMethods } from './extensionMethods.js';
import { SMART_ENUM, SMART_ENUM_ID, SMART_ENUM_ITEM } from './types.js';

type BuiltInOverrideKeys =
  | 'key'
  | 'value'
  | 'display'
  | 'deprecated'
  | 'index'
  | '__smart_enum_brand'
  | '__smart_enum_type';

export type StandardEnumItem = {
  readonly __smart_enum_brand: true;
  readonly __smart_enum_type: string;
  readonly key: string;
  readonly value: string;
  readonly display: string;
  readonly index: number;
  readonly deprecated?: boolean;
};

export type EnumInputItem = Partial<{
  key: string;
  value: string;
  display: string;
  deprecated: boolean;
}> &
  object;

export type ObjectEnumInput = Record<string, EnumInputItem>;

type EmptyEnumInputItem = Record<never, never>;

type ArrayToObjectType<T extends readonly string[]> = {
  [K in T[number]]: EmptyEnumInputItem;
};

type NormalizedInputType<TInput> = TInput extends readonly string[]
  ? ArrayToObjectType<TInput>
  : TInput extends ObjectEnumInput
    ? TInput
    : never;

type UnionKeys<T> = T extends T ? keyof T : never;

type MergeUnionToObject<T> = {
  [K in UnionKeys<T>]: T extends Record<K, infer V> ? V : undefined;
};

type ExtraShapeUnion<TObj extends ObjectEnumInput> = {
  [K in keyof TObj]: Omit<TObj[K], BuiltInOverrideKeys>;
}[keyof TObj];

export type InferredExtraFields<TObj extends ObjectEnumInput> =
  MergeUnionToObject<ExtraShapeUnion<TObj>>;

export type EnumItemFromNormalizedObject<
  TObj extends ObjectEnumInput,
  K extends keyof TObj = keyof TObj,
> = Omit<StandardEnumItem, 'key'> &
  InferredExtraFields<TObj> & {
    readonly key: Extract<K, string>;
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

export type EnumFromNormalizedObject<TObj extends ObjectEnumInput> = {
  [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
} & CoreEnumMethods<EnumItemFromNormalizedObject<TObj>>;

export type EnumerationProps<TInput> = {
  input: TInput;
  propertyAutoFormatters?: PropertyAutoFormatter[];
};

export type EnumItem<TEnum> = {
  [K in keyof TEnum]: TEnum[K] extends { __smart_enum_brand: true }
    ? TEnum[K]
    : never;
}[keyof TEnum];

export type PropertyAutoFormatter = {
  key: string;
  format: (k: string) => string;
};

type FinalizedEnumFields = Pick<
  StandardEnumItem,
  '__smart_enum_brand' | '__smart_enum_type'
>;

type FinalizableEnumItem = {
  key: string;
  value: string;
  display: string;
  index: number;
  deprecated?: boolean;
};

function normalizeInput<TInput extends readonly string[] | ObjectEnumInput>(
  input: TInput,
): NormalizedInputType<TInput> {
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input.map(k => [k, {}]),
    ) as NormalizedInputType<TInput>;
  }

  return input as NormalizedInputType<TInput>;
}

const finalizeEnumItem = <T extends { value: string }>(
  item: T,
  enumType: string,
  enumInstanceId: symbol,
): T & FinalizedEnumFields => {
  Object.defineProperty(item, SMART_ENUM_ITEM, {
    value: true,
    enumerable: false,
  });

  Object.defineProperty(item, SMART_ENUM_ID, {
    value: enumInstanceId,
    enumerable: false,
  });

  Object.defineProperty(item, '__smart_enum_brand', {
    value: true,
    enumerable: false,
  });

  Object.defineProperty(item, '__smart_enum_type', {
    value: enumType,
    enumerable: false,
  });

  Object.defineProperty(item, 'toJSON', {
    value: () => ({ __smart_enum_type: enumType, value: item.value }),
    enumerable: false,
  });

  return item as T & FinalizedEnumFields;
};

const formatProperties = (
  k: string,
  formatters: PropertyAutoFormatter[],
): { value: string; display: string } & Record<string, string> =>
  formatters.reduce(
    (acc, formatter) => {
      acc[formatter.key] = formatter.format(k);
      return acc;
    },
    {
      value: constantCase(k),
      display: capitalCase(k),
    } as { value: string; display: string } & Record<string, string>,
  );

function buildEnumFromObject<TObj extends ObjectEnumInput>(
  enumType: string,
  input: TObj,
  propertyAutoFormatters?: PropertyAutoFormatter[],
): EnumFromNormalizedObject<TObj> {
  const formattersWithDefaults: PropertyAutoFormatter[] = [
    { key: 'value', format: constantCase },
    { key: 'display', format: capitalCase },
    ...(propertyAutoFormatters ?? []),
  ];

  type TItem = EnumItemFromNormalizedObject<TObj>;

  const rawEnumItems = {} as {
    [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
  };

  const enumInstanceId = Symbol('smart-enum-instance');
  let index = 0;

  for (const key in input) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      const typedKey = key;
      const value = input[typedKey];

      const enumItemBase = {
        index,
        key: typedKey,
        ...formatProperties(typedKey, formattersWithDefaults),
        ...value,
      } as FinalizableEnumItem & TObj[typeof typedKey];

      const enumItem = finalizeEnumItem(
        enumItemBase,
        enumType,
        enumInstanceId,
      ) as TItem;

      Object.freeze(enumItem);
      rawEnumItems[typedKey] = enumItem;
      index++;
    }
  }

  const extensionMethods = addExtensionMethods<TItem>(
    Object.values(rawEnumItems) as TItem[],
  );

  const enumObject = {
    ...rawEnumItems,
    ...extensionMethods,
  } as EnumFromNormalizedObject<TObj>;

  Object.defineProperty(enumObject, SMART_ENUM, {
    value: true,
    enumerable: false,
  });

  Object.freeze(enumObject);

  return enumObject;
}

export function enumeration<const TArr extends readonly string[]>(
  enumType: string,
  props: EnumerationProps<TArr>,
): EnumFromNormalizedObject<NormalizedInputType<TArr>>;

export function enumeration<const TObj extends ObjectEnumInput>(
  enumType: string,
  props: EnumerationProps<TObj>,
): EnumFromNormalizedObject<NormalizedInputType<TObj>>;

export function enumeration(
  enumType: string,
  props: EnumerationProps<readonly string[] | ObjectEnumInput>,
) {
  const normalized = normalizeInput(props.input);
  return buildEnumFromObject(
    enumType,
    normalized,
    props.propertyAutoFormatters,
  );
}
