import type { FieldEnumMapping } from '@reharik/smart-enum';

/**
 * Query context fields read by {@link createSmartEnumPostProcessResponse}.
 * Attach via {@link withEnumRevival} on a Knex query builder.
 */
export type SmartEnumKnexQueryContext = {
  smartEnumFieldMapping?: FieldEnumMapping;
  smartEnumStrict?: boolean;
};

/**
 * The row type a Knex query builder resolves to.
 *
 * Awaiting the builder is what resolves Knex's `DeferredKeySelection` machinery,
 * so this works for `.select<T[]>()` assertions, typed tables, `.first()`, and
 * `.returning()` alike. `NonNullable` matters for `.first()`, whose result is
 * `T | undefined` — `keyof (T | undefined)` is `never`.
 *
 * An untyped builder resolves to `any`, which degrades to an unconstrained
 * `string` key — permissive, as it has to be.
 */
export type SmartEnumRow<TQuery> =
  NonNullable<Awaited<TQuery>> extends readonly (infer TElement)[]
    ? NonNullable<TElement>
    : NonNullable<Awaited<TQuery>>;

/** Field names of {@link SmartEnumRow} that a mapping key may name. */
export type SmartEnumRowField<TQuery> = Extract<
  keyof SmartEnumRow<TQuery>,
  string
>;
