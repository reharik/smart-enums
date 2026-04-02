import type { ReviveRowOptions } from '../types.js';

import { EnumRevivalError } from './enumRevivalError.js';

export const reviveRowFromDatabase = <T extends Record<string, unknown>>(
  row: T,
  options: ReviveRowOptions,
): T => {
  const { fieldEnumMapping, strict = false } = options;
  const out = { ...row } as Record<string, unknown>;

  for (const [field, smartEnum] of Object.entries(fieldEnumMapping)) {
    if (!Object.hasOwn(out, field)) {
      continue;
    }
    const raw = out[field];
    if (typeof raw !== 'string') {
      continue;
    }
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
  }

  return out as T;
};
