/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */

import { enumeration } from '@reharik/smart-enum';

/** any key not in the schema resolves to `never`, so unknown keys are rejected */
type Exact<X, K extends string> = X & Record<Exclude<keyof X, K>, never>;

export const entityTypeKeys = [
  'album',
  'authorization',
  'comment',
  'mediaItem',
  'reaction',
  'user',
] as const;
export type EntityTypeKeys = (typeof entityTypeKeys)[number];

/**
 * Define the EntityType smart enum.
 *
 * One entry per schema value. A missing key or a key not in the schema is a
 * compile error, so this enum cannot drift from the SDL. Values and display
 * strings are derived from the key; unlike generated enums, schema
 * descriptions are NOT applied as display strings. Pass `display` in an
 * entry to use them, or `value` to override the wire value.
 *
 * @param input Per-member extras, keyed by schema value.
 * @example
 * ```ts
 * export const EntityType = defineEntityType({
 *   album: { some: 'extra' },
 *   // ...one entry per schema value
 * });
 * ```
 */
export const defineEntityType = <
  const X extends Record<EntityTypeKeys, Record<string, unknown>>,
>(
  input: Exact<X, EntityTypeKeys>,
) => enumeration('EntityType', { input: input as X });
