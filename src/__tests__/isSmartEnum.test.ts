import { enumeration, isSmartEnum, isSmartEnumItem } from '../index.js';

describe('isSmartEnum', () => {
  const input = ['one', 'two'] as const;
  const TestEnum = enumeration('TestEnum', { input });

  it('returns true for full enum objects', () => {
    expect(isSmartEnum(TestEnum)).toBe(true);
  });

  it('returns false for enum items', () => {
    expect(isSmartEnum(TestEnum.one)).toBe(false);
    expect(isSmartEnum(TestEnum.two)).toBe(false);
    // Verify these are enum items
    expect(isSmartEnumItem(TestEnum.one)).toBe(true);
    expect(isSmartEnumItem(TestEnum.two)).toBe(true);
  });

  it('returns false for plain objects', () => {
    expect(isSmartEnum({ key: 'one', value: 'ONE', index: 0 })).toBe(false);
    expect(isSmartEnum({})).toBe(false);
  });

  it('returns false for primitives and arrays', () => {
    expect(isSmartEnum('ONE')).toBe(false);
    expect(isSmartEnum(1)).toBe(false);
    // eslint-disable-next-line unicorn/no-null
    expect(isSmartEnum(null)).toBe(false);
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(isSmartEnum(undefined)).toBe(false);
    expect(isSmartEnum([TestEnum.one])).toBe(false);
  });

  it('returns false for plain objects containing enum items as properties', () => {
    // A plain object containing an enum item should not be considered a smart enum
    // Only objects created by enumeration() have the SMART_ENUM property
    const obj = { nested: TestEnum.one };
    expect(isSmartEnum(obj)).toBe(false);
  });

  it('returns false for plain objects with enum-like structure', () => {
    // But a plain object with enum-like structure is not a smart enum
    const plainObj = {
      one: { key: 'one', value: 'ONE', index: 0 },
    };
    expect(isSmartEnum(plainObj)).toBe(false);
  });

  it('works with object input enums', () => {
    const ObjectEnum = enumeration('ObjectEnum', {
      input: {
        FIRST: { display: 'First Item' },
        SECOND: { display: 'Second Item' },
      },
    });
    expect(isSmartEnum(ObjectEnum)).toBe(true);
    expect(isSmartEnum(ObjectEnum.FIRST)).toBe(false);
  });
});
