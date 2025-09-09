import { enumeration, isSmartEnumItem } from '../index.js';

describe('isSmartEnumItem', () => {
  const input = ['one', 'two'] as const;
  const TestEnum = enumeration({ input });

  it('returns true for enum items', () => {
    expect(isSmartEnumItem(TestEnum.one)).toBe(true);
    expect(isSmartEnumItem(TestEnum.two)).toBe(true);
  });

  it('returns false for plain objects', () => {
    expect(isSmartEnumItem({ key: 'one', value: 'ONE', index: 0 })).toBe(false);
  });

  it('returns false for primitives and arrays', () => {
    expect(isSmartEnumItem('ONE')).toBe(false);
    expect(isSmartEnumItem(1)).toBe(false);
    expect(isSmartEnumItem([TestEnum.one])).toBe(false);
  });
});
