import { SMART_ENUM_ID } from '../types.js';

import { isSmartEnumItem } from './typeGuards.js';

/** Value-based equality for smart enum items from the same enumeration instance. */
export const enumItemsEqual = (a: unknown, b: unknown): boolean => {
  if (!isSmartEnumItem(a) || !isSmartEnumItem(b)) {
    return false;
  }

  return (
    Reflect.get(a, SMART_ENUM_ID) === Reflect.get(b, SMART_ENUM_ID) &&
    a.value === b.value
  );
};
