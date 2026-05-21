import { Enumeration, enumeration } from '../index.js';

describe('Core enum methods', () => {
  describe('array-based enums', () => {
    const input = ['one', 'two', 'three'] as const;
    type TestEnumItem = Enumeration<typeof TestEnum>;
    const TestEnum = enumeration('TestEnum', { input });

    it('fromValue returns matching item and throws on unknown', () => {
      const item: TestEnumItem = TestEnum.fromValue('TWO');
      expect(item.key).toBe('two');
      expect(item.value).toBe('TWO');
      expect(item.display).toBe('Two');

      expect(() => TestEnum.fromValue('UNKNOWN')).toThrow(
        "No enum value found for 'UNKNOWN'",
      );
    });

    it('tryFromValue returns item or undefined', () => {
      const found = TestEnum.tryFromValue('THREE');
      expect(found?.key).toBe('three');

      expect(TestEnum.tryFromValue('UNKNOWN')).toBeUndefined();
      expect(TestEnum.tryFromValue()).toBeUndefined();
      // eslint-disable-next-line unicorn/no-null
      expect(TestEnum.tryFromValue(null)).toBeUndefined();
    });

    it('fromKey / tryFromKey behave correctly', () => {
      const item: TestEnumItem = TestEnum.fromKey('one');
      expect(item.value).toBe('ONE');

      expect(() => TestEnum.fromKey('unknown')).toThrow(
        "No enum key found for 'unknown'",
      );

      const found = TestEnum.tryFromKey('two');
      expect(found?.value).toBe('TWO');
      expect(TestEnum.tryFromKey('missing')).toBeUndefined();
    });

    it('equals compares items by value within the same enum', () => {
      const oneAgain = TestEnum.fromValue('ONE');

      expect(TestEnum.one.equals(oneAgain)).toBe(true);
      expect(oneAgain.equals(TestEnum.one)).toBe(true);
      expect(TestEnum.equals(TestEnum.one, oneAgain)).toBe(true);
      expect(TestEnum.one.equals(TestEnum.two)).toBe(false);
      expect(TestEnum.equals(TestEnum.one, TestEnum.two)).toBe(false);
      expect(TestEnum.one.equals({ key: 'one', value: 'ONE' })).toBe(false);
      expect(
        TestEnum.equals(TestEnum.one, { key: 'one', value: 'ONE' }),
      ).toBe(false);
    });

    it('items / values / keys expose all enum members', () => {
      const items = TestEnum.items();
      const values = TestEnum.values();
      const keys = TestEnum.keys();

      expect(items.map(x => x.key)).toEqual(['one', 'two', 'three']);
      expect(values).toEqual(['ONE', 'TWO', 'THREE']);
      expect(keys).toEqual(['one', 'two', 'three']);

      // items() should return a copy, not the original array
      expect(items).not.toBe(TestEnum.items());
    });
  });

  describe('object-based enums', () => {
    const input = {
      first: { value: 'FIRST', display: 'First item' },
      second: { value: 'SECOND', display: 'Second item' },
    } as const;

    type ObjectEnumItem = Enumeration<typeof ObjectEnum>;
    const ObjectEnum = enumeration('ObjectEnum', { input });

    it('supports lookups by value and key', () => {
      const byValue: ObjectEnumItem = ObjectEnum.fromValue('FIRST');
      expect(byValue.key).toBe('first');
      expect(byValue.display).toBe('First item');

      const byKey: ObjectEnumItem = ObjectEnum.fromKey('second');
      expect(byKey.value).toBe('SECOND');
      expect(byKey.display).toBe('Second item');
    });

    it('equals works for object input enums', () => {
      expect(ObjectEnum.first.equals(ObjectEnum.fromValue('FIRST'))).toBe(
        true,
      );
      expect(
        ObjectEnum.equals(ObjectEnum.first, ObjectEnum.fromKey('second')),
      ).toBe(false);
    });

    it('items / values / keys work for object input', () => {
      const items = ObjectEnum.items();

      expect(items.map(x => x.key)).toEqual(['first', 'second']);
      expect(ObjectEnum.values()).toEqual(['FIRST', 'SECOND']);
      expect(ObjectEnum.keys()).toEqual(['first', 'second']);
    });
  });
});
