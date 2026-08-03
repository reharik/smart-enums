import type { ReviveRowOptions } from '../types.js';

import { assertMappedFieldsPresent } from './assertMappedFieldsPresent.js';
import { EnumRevivalError } from './enumRevivalError.js';

export const reviveRowFromDatabase = <T extends Record<string, unknown>>(
  row: T,
  options: ReviveRowOptions,
): T => {
  const {
    fieldEnumMapping,
    strict = true,
    validateMappedFields = true,
  } = options;
  const out = { ...row } as Record<string, unknown>;

  if (strict && validateMappedFields) {
    assertMappedFieldsPresent(out, fieldEnumMapping);
  }

  for (const [field, smartEnum] of Object.entries(fieldEnumMapping)) {
    if (!Object.hasOwn(out, field)) {
      continue;
    }
    const raw = out[field];

    if (typeof raw === 'string') {
      const revived = smartEnum.tryFromValue(raw);
      if (revived !== undefined) {
        out[field] = revived as unknown;
      } else if (strict) {
        throw new EnumRevivalError(
          `Cannot revive field ${JSON.stringify(field)}: unknown enum value ${JSON.stringify(raw)}`,
          field,
          raw,
        );
      }
      continue;
    }

    if (Array.isArray(raw)) {
      const revivedItems: unknown[] = [];
      for (const item of raw) {
        if (typeof item !== 'string') {
          revivedItems.push(item);
          continue;
        }
        const revived = smartEnum.tryFromValue(item);
        if (revived !== undefined) {
          revivedItems.push(revived);
        } else if (strict) {
          throw new EnumRevivalError(
            `Cannot revive field ${JSON.stringify(field)}: unknown enum value ${JSON.stringify(item)} in array`,
            field,
            item,
          );
        } else {
          revivedItems.push(item);
        }
      }
      out[field] = revivedItems;
      continue;
    }
  }

  return out as T;
};
