/**
 * -----------------------------------------------------------------------------
 * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.
 * Any manual changes will be overwritten by GraphQL Code Generator.
 * -----------------------------------------------------------------------------
 */

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
 * Pin the EntityType input to the schema's value set.
 *
 * One entry per schema value. A missing key or a key not in the schema is a
 * compile error, so this enum cannot drift from the SDL. Values and display
 * strings are derived from the key; unlike generated enums, schema
 * descriptions are NOT applied as display strings. Pass `display` in an
 * entry to use them, or `value` to override the wire value.
 *
 * Returns the input unchanged (typed): build the enum from it exactly like
 * any other smart enum. The return type is the plain input type so that
 * declaration emit in consuming packages stays cheap.
 *
 * @param input Per-member extras, keyed by schema value.
 * @example
 * ```ts
 * import { enumeration, type Enumeration } from '@reharik/smart-enum';
 *
 * const input = defineEntityTypeInput({
 *   album: { some: 'extra' },
 *   // ...one entry per schema value
 * });
 *
 * export type EntityType = Enumeration<typeof EntityType>;
 * export const EntityType = enumeration<typeof input>('EntityType', {
 *   input,
 * });
 * ```
 */
export const defineEntityTypeInput = <
  const X extends Record<EntityTypeKeys, Record<string, unknown>>,
>(
  input: Exact<X, EntityTypeKeys>,
): X => input;
