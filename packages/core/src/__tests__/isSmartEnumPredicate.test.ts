import { enumeration, isSmartEnum } from '../index.js';

describe('isSmartEnum as a type predicate', () => {
  const E = enumeration('E', { input: ['one', 'two'] as const });

  describe('runtime', () => {
    it('is true for an enum container', () => {
      expect(isSmartEnum(E)).toBe(true);
    });

    it('is false for an individual item', () => {
      expect(isSmartEnum(E.one)).toBe(false);
    });

    it('is false for a plain object', () => {
      expect(isSmartEnum({ key: 'one', value: 'ONE' })).toBe(false);
    });
  });

  describe('type-level', () => {
    it('narrows x to SmartEnumLike inside the guard', () => {
      const use = (x: unknown): string | undefined => {
        if (isSmartEnum(x)) {
          // narrowed to SmartEnumLike — these members are callable
          const count = x.items().length;
          const item = x.fromValue('ONE');
          return `${count}:${item.value}`;
        }
        return undefined;
      };

      expect(use(E)).toBe('2:ONE');
      expect(use(42)).toBeUndefined();
    });
  });
});
