import { SmartEnumItemSerialized, SmartEnumLike } from '../types.js';

/**
 * Runtime type guard to detect Smart Enum items.
 *
 * Detection is **structural** and package-stable: it keys on the string
 * properties `__smart_enum_brand === true`, string `__smart_enum_type` and
 * string `value`. It does not read any Symbol, so it recognizes items created
 * by a *different* copy of `@reharik/smart-enum` (duplicate-package resistant).
 *
 * Because detection is structural, a self-describing wire object that carries
 * the brand — `{ __smart_enum_brand: true, __smart_enum_type, value }` — also
 * passes. That is intentional: it lets `equals`/`has` treat a revival-boundary
 * object as the member it represents. A plain serialized shape *without* the
 * brand (`{ __smart_enum_type, value }`, as emitted by `serializeSmartEnums`)
 * is still rejected here; use {@link isSerializedSmartEnumItem} for that.
 *
 * @example
 * ```typescript
 * import { Status } from './status';
 * const item = Status.active;
 * isSmartEnumItem(item); // true
 * isSmartEnumItem({ key: 'active', value: 'ACTIVE' }); // false (no brand)
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
  __smart_enum_type: string;
} => {
  return (
    !!x &&
    typeof x === 'object' &&
    Reflect.get(x, '__smart_enum_brand') === true &&
    typeof Reflect.get(x, '__smart_enum_type') === 'string' &&
    typeof Reflect.get(x, 'value') === 'string'
  );
};

/**
 * Runtime type guard to detect a full Smart Enum object.
 *
 * Detection is **structural** and package-stable: it keys on the string marker
 * property `__smart_enum === true` that `enumeration()` stamps on every enum
 * object. It does not read any Symbol, so it recognizes enum objects created by
 * a *different* copy of `@reharik/smart-enum` (duplicate-package resistant).
 *
 * @example
 * ```typescript
 * import { MyEnum } from './blah';
 * isSmartEnum(MyEnum) === true; // true
 * isSmartEnum(MyEnum.one) === false; // false (this is an item, not the enum)
 * ```
 */
export const isSmartEnum = (x: unknown): x is SmartEnumLike => {
  return (
    !!x && typeof x === 'object' && Reflect.get(x, '__smart_enum') === true
  );
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
