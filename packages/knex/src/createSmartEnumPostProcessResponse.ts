import type { Knex } from 'knex';
import type { FieldEnumMapping } from '@reharik/smart-enum';
import { reviveRowFromDatabase } from '@reharik/smart-enum';

import type { SmartEnumKnexQueryContext } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mapRowWithEnumRevival = (
  row: unknown,
  fieldEnumMapping: FieldEnumMapping,
  strict: boolean,
): unknown => {
  if (!isRecord(row)) {
    return row;
  }
  return reviveRowFromDatabase(row, { fieldEnumMapping, strict });
};

const postProcessSmartEnumResponse = (
  result: unknown,
  queryContext?: SmartEnumKnexQueryContext,
): unknown => {
  const fieldEnumMapping = queryContext?.smartEnumFieldMapping;
  if (!fieldEnumMapping) {
    return result;
  }

  const strict = queryContext?.smartEnumStrict ?? false;

  if (Array.isArray(result)) {
    return result.map((row: unknown) =>
      mapRowWithEnumRevival(row, fieldEnumMapping, strict),
    );
  }

  if (isRecord(result)) {
    return reviveRowFromDatabase(result, { fieldEnumMapping, strict });
  }

  return result;
};

export const createSmartEnumPostProcessResponse =
  (): Knex.Config['postProcessResponse'] => postProcessSmartEnumResponse;
