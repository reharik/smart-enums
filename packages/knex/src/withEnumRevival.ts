import type { Knex } from 'knex';
import type { FieldEnumMapping } from 'ts-smart-enum';

import type { SmartEnumKnexQueryContext } from './types.js';

export const withEnumRevival = <T extends Knex.QueryBuilder>(
  query: T,
  fieldEnumMapping: FieldEnumMapping,
  options?: { strict?: boolean },
): T => {
  const queryContext: SmartEnumKnexQueryContext = {
    smartEnumFieldMapping: fieldEnumMapping,
    smartEnumStrict: options?.strict ?? false,
  };

  // Knex types widen `queryContext` to `QueryBuilder`; callers keep their concrete builder type `T`.
  return query.queryContext(queryContext) as T;
};
