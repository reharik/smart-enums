import {
  SMART_ENUM_ITEM,
  SMART_ENUM,
  SmartEnumItemSerialized,
} from '../types.js';

/**
 * Runtime type guard to detect Smart Enum items created by this library.
 * Returns true if the value has the SMART_ENUM_ITEM symbol.
 *
 * @example
 * ```typescript
 * import { Status } from './status';
 * const item = Status.active;
 * isSmartEnumItem(item); // true
 * isSmartEnumItem({ key: 'active', value: 'ACTIVE' }); // false (plain object)
 * if (isSmartEnumItem(x)) {
 *   console.log(x.value, x.__smart_enum_type); // narrowed to enum item
 * }
 * ```
 */
export const isSmartEnumItem = (
  x: unknown,
): x is {
  key: string;
  value: string;
  index?: number;
  __smart_enum_type?: string;
} => {
  return (
    !!x && typeof x === 'object' && Reflect.get(x, SMART_ENUM_ITEM) === true
  );
};

/**
 * Runtime type guard to detect a full Smart Enum object created by this library.
 * Returns true if the object has the SMART_ENUM property.
 *
 * @example
 * ```typescript
 * import { MyEnum } from './blah';
 * isSmartEnum(MyEnum) === true; // true
 * isSmartEnum(MyEnum.one) === false; // false (this is an item, not the enum)
 * ```
 */
export const isSmartEnum = (x: unknown): boolean => {
  return !!x && typeof x === 'object' && Reflect.get(x, SMART_ENUM) === true;
};

/**
 * Runtime type guard to detect a serialized Smart Enum item created by this library.
 * Returns true if the value has `__smart_enum_type` and `value` (wire/database shape).
 *
 * @example
 * ```typescript
 * const wire = { __smart_enum_type: 'Status', value: 'ACTIVE' };
 * isSerializedSmartEnumItem(wire); // true
 * isSerializedSmartEnumItem(Status.active); // false (live enum item)
 * if (isSerializedSmartEnumItem(x)) {
 *   reviveItem(x.__smart_enum_type, x.value); // narrowed to SmartEnumItemSerialized
 * }
 * ```
 */
export const isSerializedSmartEnumItem = (
  x: unknown,
): x is SmartEnumItemSerialized => {
  return (
    !!x &&
    typeof x === 'object' &&
    Reflect.has(x, '__smart_enum_type') &&
    Reflect.has(x, 'value')
  );
};
