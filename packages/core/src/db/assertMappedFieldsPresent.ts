import type { FieldEnumMapping } from '../types.js';

import { EnumRevivalError } from './enumRevivalError.js';

const describeFields = (row: Record<string, unknown>): string => {
  const keys = Object.keys(row);
  return keys.length > 0 ? keys.join(', ') : '(none)';
};

/**
 * Throws when a key in `fieldEnumMapping` names a field the row does not have.
 *
 * A mapping key with no matching column is always a programmer error — a typo,
 * or a column the query never selected. Both leave the value as a raw string
 * that is *typed* as a member, so the failure surfaces far from its cause.
 *
 * The message lists the row's actual fields because this whole class of bug is
 * near-miss names: seeing `operations` next to `operation` is the fix.
 *
 * This is a runtime check against real data, so it cannot fire for a query that
 * returns zero rows.
 */
export const assertMappedFieldsPresent = (
  row: Record<string, unknown>,
  fieldEnumMapping: FieldEnumMapping,
): void => {
  for (const field of Object.keys(fieldEnumMapping)) {
    if (!Object.hasOwn(row, field)) {
      throw new EnumRevivalError(
        `Cannot revive field ${JSON.stringify(field)}: not present on the row. ` +
          `Available fields: ${describeFields(row)}`,
        field,
        undefined,
      );
    }
  }
};
