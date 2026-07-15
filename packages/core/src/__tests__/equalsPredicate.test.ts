import { Enumeration, enumeration } from '../index.js';

describe('equals as a type predicate', () => {
  const E = enumeration('E', { input: ['a', 'b', 'c'] as const });
  type EItem = Enumeration<typeof E>;

  describe('runtime (behavior unchanged)', () => {
    it('is true for the same item and false for a different one', () => {
      expect(E.a.equals(E.a)).toBe(true);
      expect(E.a.equals(E.b)).toBe(false);
    });
  });

  describe('type-level', () => {
    it('narrows an if-chain of .equals so the trailing else reaches never', () => {
      const assertUnreachable = (x: never): never => {
        throw new Error(`unexpected ${String(x)}`);
      };

      const classify = (item: EItem): string => {
        if (item.equals(E.a)) return 'a';
        if (item.equals(E.b)) return 'b';
        if (item.equals(E.c)) return 'c';
        // compiles only if item is narrowed to never here
        return assertUnreachable(item);
      };

      expect(classify(E.a)).toBe('a');
      expect(classify(E.b)).toBe('b');
      expect(classify(E.c)).toBe('c');
    });

    it('rejects a cross-enum comparison at compile time', () => {
      const Other = enumeration('Other', { input: ['x', 'y'] as const });

      // @ts-expect-error cross-enum comparison — brand mismatch, caught at compile time
      E.a.equals(Other.x);
    });
  });
});
