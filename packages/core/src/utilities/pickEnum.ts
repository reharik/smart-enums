import { addExtensionMethods } from '../extensionMethods.js';
import {
  EnumMemberKeys,
  PickEnumView,
  SmartEnumLike,
  SmartEnumMemberUnion,
  StandardEnumItem,
} from '../types.js';
import { isSmartEnum, isSmartEnumItem } from './typeGuards.js';

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
 * Returns an enum-like view containing only the named members. Original item
 * objects are reused (not cloned), so identity, `equals`, and serialization all
 * carry over. Method lookups (`fromKey`, `items`, …) scope to the subset.
 *
 * Unlike {@link getSubsetByProp} (which selects by a shared property value),
 * `pickEnum` selects by an explicit key list — for arbitrary hand-picked subsets.
 *
 * @example
 * ```ts
 * const CommentTarget = pickEnum(EntityType, ['comment', 'mediaItem'] as const);
 * CommentTarget.comment === EntityType.comment; // true
 * ```
 */
export const pickEnum = <
  TEnum extends Record<string, unknown> &
    SmartEnumLike<SmartEnumMemberUnion<TEnum>>,
  const K extends EnumMemberKeys<TEnum>,
>(
  enumInstance: TEnum,
  keys: readonly K[],
) => {
  const memberEntries: Record<string, StandardEnumItem> = {};
  const picked: StandardEnumItem[] = [];

  for (const key of keys) {
    if (typeof key !== 'string' || RESERVED_ENUM_MEMBER_KEYS.has(key)) {
      continue;
    }
    const entry = enumInstance[key];
    if (!isSmartEnumItem(entry)) {
      continue;
    }
    memberEntries[key] = entry as unknown as StandardEnumItem;
    picked.push(entry as unknown as StandardEnumItem);
  }

  const methods = addExtensionMethods(picked);
  return { ...memberEntries, ...methods } as unknown as PickEnumView<TEnum, K>;
};
