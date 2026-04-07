import { addExtensionMethods } from '../extensionMethods.js';
import type {
  SmartEnumLike,
  SmartEnumMemberUnion,
  SmartEnumSubsetItemUnion,
  SmartEnumSubsetView,
  StandardEnumItem,
} from '../types.js';

import { isSmartEnumItem } from './typeGuards.js';

const RESERVED_ENUM_MEMBER_KEYS = new Set([
  'fromValue',
  'tryFromValue',
  'fromKey',
  'tryFromKey',
  'items',
  'values',
  'keys',
]);

/**
 * Returns an enum-like view of members whose `prop` equals `value`.
 * Original item objects are reused (not cloned). Method lookups only consider the subset.
 *
 * Requires a {@link SmartEnumLike} (e.g. the result of {@link enumeration}).
 *
 * @example
 * ```ts
 * const mediaOnly = getSubsetByProp(AppErrorEnum, 'source', 'mediaItem' as const);
 * ```
 */
export const getSubsetByProp = <
  TEnum extends Record<string, unknown> &
    SmartEnumLike<SmartEnumMemberUnion<TEnum>>,
  P extends keyof SmartEnumMemberUnion<TEnum> & string,
  V extends SmartEnumMemberUnion<TEnum>[P],
>(
  enumInstance: TEnum,
  prop: P,
  value: V,
): SmartEnumSubsetView<TEnum, SmartEnumMemberUnion<TEnum>, P, V> => {
  const matching: StandardEnumItem[] = [];
  const memberEntries: Record<string, StandardEnumItem> = {};

  for (const key of Reflect.ownKeys(enumInstance)) {
    if (typeof key !== 'string' || RESERVED_ENUM_MEMBER_KEYS.has(key)) {
      continue;
    }
    const entry = enumInstance[key];
    if (!isSmartEnumItem(entry)) {
      continue;
    }
    const item = entry as StandardEnumItem;
    if (Object.is((item as Record<string, unknown>)[prop], value)) {
      memberEntries[key] = item;
      matching.push(item);
    }
  }

  type ItemUnion = SmartEnumMemberUnion<TEnum>;

  const methods = addExtensionMethods(
    matching as unknown as readonly SmartEnumSubsetItemUnion<ItemUnion, P, V>[],
  );

  return {
    ...memberEntries,
    ...methods,
  } as SmartEnumSubsetView<TEnum, ItemUnion, P, V>;
};

/**
 * Curried variant of {@link getSubsetByProp}: fix `prop` first, then `(enumInstance, value)`.
 *
 * @example
 * ```ts
 * const bySource = subsetByProp('source');
 * const mediaItemErrors = bySource(AppErrorEnum, 'mediaItem' as const);
 * ```
 */
export const subsetByProp =
  <const P extends string>(prop: P) =>
  <
    TEnum extends Record<string, unknown> &
      SmartEnumLike<SmartEnumMemberUnion<TEnum>>,
    V extends SmartEnumMemberUnion<TEnum>[P &
      keyof SmartEnumMemberUnion<TEnum>],
  >(
    enumInstance: TEnum,
    value: V,
  ): SmartEnumSubsetView<
    TEnum,
    SmartEnumMemberUnion<TEnum>,
    P & keyof SmartEnumMemberUnion<TEnum>,
    V
  > =>
    // `getSubsetByProp` widens `prop` in its return; re-assert to keep curried literal `P` for Pick/Extract.
    getSubsetByProp(
      enumInstance,
      prop as keyof SmartEnumMemberUnion<TEnum> & string,
      value,
    ) as unknown as SmartEnumSubsetView<
      TEnum,
      SmartEnumMemberUnion<TEnum>,
      P & keyof SmartEnumMemberUnion<TEnum>,
      V
    >;
