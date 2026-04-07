import { capitalCase, constantCase } from 'case-anything';

import { addExtensionMethods } from './extensionMethods.js';
import {
  SMART_ENUM,
  SMART_ENUM_ID,
  SMART_ENUM_ITEM,
  type EnumFromNormalizedObject,
  type EnumItemFromNormalizedObject,
  type EnumMemberUnionFromNormalizedObject,
  type EnumerationProps,
  type FinalizableEnumItem,
  type FinalizedEnumFields,
  type NormalizedInputType,
  type ObjectEnumInput,
  type PropertyAutoFormatter,
} from './types.js';

export type EnumItem<TEnum> = {
  [K in keyof TEnum]: TEnum[K] extends { __smart_enum_brand: true }
    ? TEnum[K]
    : never;
}[keyof TEnum];

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

  Object.defineProperty(item, 'toPostgres', {
    value: () => item.value,
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

  type TItem = EnumMemberUnionFromNormalizedObject<TObj>;

  const rawEnumItems: Partial<{
    [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K>;
  }> = {};

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
      ) as unknown as TItem;

      Object.freeze(enumItem);
      rawEnumItems[typedKey as keyof TObj] = enumItem;
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
