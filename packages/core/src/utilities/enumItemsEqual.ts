import { isSmartEnumItem } from './typeGuards.js';

/**
 * Value-based equality for smart enum items.
 *
 * Compares only the package-stable string identity — `__smart_enum_type` plus
 * `value` — so it holds across separate `enumeration()` calls of the same
 * logical enum and across duplicate copies of `@reharik/smart-enum` (it does
 * not depend on any per-instance or module-level Symbol). This makes it a safe
 * replacement for `===`, which fails in both of those situations.
 */
export const enumItemsEqual = (a: unknown, b: unknown): boolean => {
  if (!isSmartEnumItem(a) || !isSmartEnumItem(b)) return false;
  return a.__smart_enum_type === b.__smart_enum_type && a.value === b.value;
};
