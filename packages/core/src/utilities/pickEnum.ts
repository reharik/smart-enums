import { addExtensionMethods } from '../extensionMethods.js';
import {
  EnumMemberKeys,
  OmitEnumView,
  PickEnumView,
  SmartEnumLike,
  SmartEnumMemberUnion,
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

/**
 * Returns an enum-like view containing every member *except* the named ones —
 * the inverse of {@link pickEnum}. Original item objects are reused (not
 * cloned), so identity, `equals`, and serialization all carry over. Method
 * lookups (`fromKey`, `items`, …) scope to the remaining members, and the
 * parent's declaration order is preserved.
 *
 * Use this when you want to drop an item or two rather than list everything to
 * keep.
 *
 * @example
 * ```ts
 * const NonAlbum = omitEnum(EntityType, ['album'] as const);
 * NonAlbum.comment === EntityType.comment; // true
 * NonAlbum.keys();                          // ['comment', 'mediaItem']
 * ```
 */
export const omitEnum = <
  TEnum extends Record<string, unknown> &
    SmartEnumLike<SmartEnumMemberUnion<TEnum>>,
  const K extends EnumMemberKeys<TEnum>,
>(
  enumInstance: TEnum,
  keys: readonly K[],
) => {
  const omit = new Set<string>(keys as readonly string[]);
  const memberEntries: Record<string, StandardEnumItem> = {};
  const kept: StandardEnumItem[] = [];

  for (const key of Reflect.ownKeys(enumInstance)) {
    if (
      typeof key !== 'string' ||
      RESERVED_ENUM_MEMBER_KEYS.has(key) ||
      omit.has(key)
    ) {
      continue;
    }
    const entry = enumInstance[key];
    if (!isSmartEnumItem(entry)) {
      continue;
    }
    memberEntries[key] = entry as unknown as StandardEnumItem;
    kept.push(entry as unknown as StandardEnumItem);
  }

  const methods = addExtensionMethods(kept);
  return { ...memberEntries, ...methods } as unknown as OmitEnumView<TEnum, K>;
};
