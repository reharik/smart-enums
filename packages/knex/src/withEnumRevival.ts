import type { Knex } from 'knex';
import type { SmartEnumLike } from '@reharik/smart-enum';

import type { SmartEnumKnexQueryContext, SmartEnumRowField } from './types.js';

/**
 * Attaches a field-to-enum mapping to a query so
 * {@link createSmartEnumPostProcessResponse} revives the rows it returns.
 *
 * Mapping keys are constrained to the query's row type, so a near-miss name is
 * a compile error where the row type is known — TypeScript even suggests the
 * intended field. Untyped queries fall back to unconstrained string keys, and
 * a `.select<T>()` assertion is only as good as `T`; the strict-mode runtime
 * check in `reviveRowFromDatabase` is the backstop for both.
 */
export const withEnumRevival = <
  TQuery extends Knex.QueryBuilder,
  TField extends SmartEnumRowField<TQuery>,
>(
  query: TQuery,
  fieldEnumMapping: Record<TField, SmartEnumLike>,
  options?: { strict?: boolean },
): TQuery => {
  const queryContext: SmartEnumKnexQueryContext = {
    smartEnumFieldMapping: fieldEnumMapping,
    smartEnumStrict: options?.strict ?? true,
  };

  // Knex types widen `queryContext` to `QueryBuilder`; callers keep their concrete builder type `TQuery`.
  return query.queryContext(queryContext) as TQuery;
};
