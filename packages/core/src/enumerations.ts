import { capitalCase, constantCase } from 'case-anything';

import { addExtensionMethods } from './extensionMethods.js';
import {
  SerializationMode,
  type EnumFromNormalizedObject,
  type EnumItemFromNormalizedObject,
  type EnumMemberUnionFromNormalizedObject,
  type EnumerationProps,
  type FinalizableEnumItem,
  type FinalizedEnumFields,
  type NormalizedInputType,
  type ObjectEnumInput,
  type PropertyAutoFormatter,
  type StandardEnumItem,
} from './types.js';
import { enumItemsEqual } from './utilities/enumItemsEqual.js';
import { resolveSerializationMode } from './utilities/serializationMode.js';

export type EnumItem<TEnum> = {
  [K in keyof TEnum]: TEnum[K] extends { __smart_enum_brand: true }
    ? TEnum[K]
    : never;
}[keyof TEnum];

/**
 * Creation-time name-uniqueness guard.
 *
 * Enum names are the wire/identity key: equality keys on `__smart_enum_type`
 * (see {@link enumItemsEqual}) and revival looks enums up by name (see
 * `reviveSmartEnums`). Two *different* enums sharing a name would make both
 * ambiguous, so we reject that collision here — a name may only be reused if the
 * new definition has the *same* members (that is harmless: members compare equal
 * across instances under the string-based identity).
 *
 * The signature is the sorted set of `key=value` pairs; extras/formatters/
 * `serializeAs` don't affect wire identity and are intentionally ignored.
 *
 * Limitation: this registry is module-scoped, so it only catches collisions
 * within a single library instance — duplicate copies of `@reharik/smart-enum`
 * each keep their own registry. That is acceptable: it catches the likely
 * accidental case (defining conflicting enums in one app) and documents the
 * invariant the string-based identity relies on.
 */
const registeredEnumSignatures = new Map<string, string>();

const registerEnumName = (
  enumType: string,
  items: readonly { key: string; value: string }[],
): void => {
  const signature = items
    .map(item => `${item.key}=${item.value}`)
    .sort()
    .join('|');

  const existing = registeredEnumSignatures.get(enumType);
  if (existing !== undefined && existing !== signature) {
    throw new Error(
      `Enum name '${enumType}' is already defined with different members; ` +
        `enum names must be unique because they are the wire/identity key ` +
        `(equality and revival key on __smart_enum_type + value).`,
    );
  }
  registeredEnumSignatures.set(enumType, signature);
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

const finalizeEnumItem = <T extends { value: string; key: string }>(
  item: T,
  enumType: string,
  serializeAs: SerializationMode | undefined,
): T & FinalizedEnumFields => {
  // `__smart_enum_brand` is the package-stable detection marker read by
  // `isSmartEnumItem`; combined with the string `__smart_enum_type` + `value`
  // below it fully identifies an item across enum instances and package copies.
  Object.defineProperty(item, '__smart_enum_brand', {
    value: true,
    enumerable: false,
  });

  Object.defineProperty(item, '__smart_enum_type', {
    value: enumType,
    enumerable: false,
  });

  Object.defineProperty(item, 'toJSON', {
    value: () => {
      const mode = resolveSerializationMode(serializeAs);
      if (mode === 'value') {
        return item.value;
      }
      return { __smart_enum_type: enumType, value: item.value };
    },
    enumerable: false,
  });

  Object.defineProperty(item, 'toPostgres', {
    value: () => item.value,
    enumerable: false,
  });

  Object.defineProperty(item, 'equals', {
    value: (other: StandardEnumItem) => enumItemsEqual(item, other),
    enumerable: false,
  });

  Object.defineProperty(item, 'match', {
    value: (handlers: Record<string, (i: unknown) => unknown>) => {
      const handler = handlers[item.key];
      if (!handler) {
        throw new Error(
          `match: no handler for '${item.key}' on enum '${enumType}'`,
        );
      }
      return handler(item);
    },
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

function buildEnumFromObject<
  TName extends string,
  TObj extends ObjectEnumInput,
>(
  enumType: TName,
  input: TObj,
  propertyAutoFormatters?: PropertyAutoFormatter[],
  serializeAs?: SerializationMode,
): EnumFromNormalizedObject<TObj, TName> {
  const formattersWithDefaults: PropertyAutoFormatter[] = [
    { key: 'value', format: constantCase },
    { key: 'display', format: capitalCase },
    ...(propertyAutoFormatters ?? []),
  ];

  type TItem = EnumMemberUnionFromNormalizedObject<TObj, TName>;

  const rawEnumItems: Partial<{
    [K in keyof TObj]: EnumItemFromNormalizedObject<TObj, K, TName>;
  }> = {};

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
        serializeAs,
      ) as unknown as TItem;

      Object.freeze(enumItem);
      rawEnumItems[typedKey as keyof TObj] = enumItem;
      index++;
    }
  }

  registerEnumName(
    enumType,
    Object.values(rawEnumItems) as FinalizableEnumItem[],
  );

  const extensionMethods = addExtensionMethods<TItem>(
    Object.values(rawEnumItems) as TItem[],
  );

  const enumObject = {
    ...rawEnumItems,
    ...extensionMethods,
  } as EnumFromNormalizedObject<TObj, TName>;

  // `__smart_enum` is the package-stable marker read by `isSmartEnum`
  // (replaces the former module-level Symbol so detection survives across copies).
  Object.defineProperty(enumObject, '__smart_enum', {
    value: true,
    enumerable: false,
  });

  Object.freeze(enumObject);

  return enumObject;
}

export function enumeration<
  const TArr extends readonly string[],
  const TName extends string = string,
>(
  enumType: TName,
  props: EnumerationProps<TArr>,
): EnumFromNormalizedObject<NormalizedInputType<TArr>, TName>;

export function enumeration<
  const TObj extends ObjectEnumInput,
  const TName extends string = string,
>(
  enumType: TName,
  props: EnumerationProps<TObj>,
): EnumFromNormalizedObject<NormalizedInputType<TObj>, TName>;

export function enumeration<const TName extends string = string>(
  enumType: TName,
  props: EnumerationProps<readonly string[] | ObjectEnumInput>,
): EnumFromNormalizedObject<
  NormalizedInputType<readonly string[] | ObjectEnumInput>,
  TName
> {
  const normalized = normalizeInput(props.input);
  return buildEnumFromObject(
    enumType,
    normalized,
    props.propertyAutoFormatters,
    props.serializeAs,
  );
}
