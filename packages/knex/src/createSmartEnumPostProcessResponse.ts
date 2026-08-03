import type { Knex } from 'knex';
import type { FieldEnumMapping } from '@reharik/smart-enum';
import {
  assertMappedFieldsPresent,
  reviveRowFromDatabase,
} from '@reharik/smart-enum';

import type { SmartEnumKnexQueryContext } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mapRowWithEnumRevival = (
  row: unknown,
  fieldEnumMapping: FieldEnumMapping,
  strict: boolean,
  validateMappedFields: boolean,
): unknown => {
  if (!isRecord(row)) {
    return row;
  }
  return reviveRowFromDatabase(row, {
    fieldEnumMapping,
    strict,
    validateMappedFields,
  });
};

const postProcessSmartEnumResponse = (
  result: unknown,
  queryContext?: SmartEnumKnexQueryContext,
): unknown => {
  const fieldEnumMapping = queryContext?.smartEnumFieldMapping;
  if (!fieldEnumMapping) {
    return result;
  }

  const strict = queryContext?.smartEnumStrict ?? true;

  if (Array.isArray(result)) {
    // Validate the mapping once, against the first row that has a shape to
    // validate against. Heterogeneous rows in one result set aren't supported,
    // and a per-row check would exit on the first failure anyway.
    const firstRow: unknown = (result as unknown[]).find((row: unknown) =>
      isRecord(row),
    );
    if (strict && isRecord(firstRow)) {
      assertMappedFieldsPresent(firstRow, fieldEnumMapping);
    }
    return (result as unknown[]).map((row: unknown) =>
      mapRowWithEnumRevival(row, fieldEnumMapping, strict, false),
    );
  }

  if (isRecord(result)) {
    return reviveRowFromDatabase(result, { fieldEnumMapping, strict });
  }

  return result;
};

export const createSmartEnumPostProcessResponse =
  (): Knex.Config['postProcessResponse'] => postProcessSmartEnumResponse;
