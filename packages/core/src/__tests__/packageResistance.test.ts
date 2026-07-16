/**
 * Regression tests for the two duplicate-package failure modes that the old
 * Symbol-based equality/detection could not survive. These deliberately break
 * the single-module-instance assumption that let the bug hide.
 *
 * - Mode A: two `enumeration()` calls of the same logical enum (different
 *   instances, same name+members) in one library copy.
 * - Mode B: two independent copies of the library (module-level state differs).
 */
import { enumeration } from '../enumerations.js';
import { isSmartEnumItem } from '../utilities/typeGuards.js';
import { enumItemsEqual } from '../utilities/enumItemsEqual.js';

// swc emits CommonJS for tests, so `require` exists at runtime; no @types/node.
declare const require: (id: string) => unknown;

describe('package-resistant equality and detection', () => {
  describe('Mode A: two enumeration() calls of the same enum (one library copy)', () => {
    const A = enumeration('EntityType', {
      input: { comment: {}, mediaItem: {} },
    });
    const B = enumeration('EntityType', {
      input: { comment: {}, mediaItem: {} },
    });

    it('produces distinct object instances (=== fails, as it always did)', () => {
      expect(A.comment).not.toBe(B.comment);
    });

    it('.equals is true across the two instances', () => {
      expect(A.comment.equals(B.comment)).toBe(true);
      expect(B.comment.equals(A.comment)).toBe(true);
    });

    it('Enum.equals and enumItemsEqual are true across the two instances', () => {
      expect(A.equals(A.comment, B.comment)).toBe(true);
      expect(enumItemsEqual(A.comment, B.comment)).toBe(true);
    });

    it('.has finds the other instance as a member', () => {
      expect(A.has(B.comment)).toBe(true);
      expect(B.has(A.comment)).toBe(true);
    });

    it('still distinguishes different members', () => {
      expect(A.comment.equals(B.mediaItem)).toBe(false);
      expect(A.has(B.mediaItem)).toBe(true);
      expect(A.has({ __smart_enum_type: 'EntityType', value: 'NOPE' })).toBe(
        false,
      );
    });
  });

  describe('Mode B: two independent copies of the library', () => {
    const loadCopy = (): typeof import('../index.js') => {
      let mod: typeof import('../index.js') | undefined;
      jest.isolateModules(() => {
        mod = require('../index.js') as typeof import('../index.js');
      });
      if (!mod) throw new Error('failed to load isolated copy');
      return mod;
    };

    const copy1 = loadCopy();
    const copy2 = loadCopy();

    it('the two copies really are separate module instances', () => {
      expect(copy1.enumeration).not.toBe(copy2.enumeration);
    });

    it("copy1's structural guard recognises copy2's item (no shared Symbol)", () => {
      const E2 = copy2.enumeration('EntityType', {
        input: { comment: {}, mediaItem: {} },
      });
      expect(copy1.isSmartEnumItem(E2.comment)).toBe(true);
      expect(copy2.isSmartEnumItem(E2.comment)).toBe(true);
    });

    it('.equals is true for logically-identical members from different copies', () => {
      const E1 = copy1.enumeration('EntityType', {
        input: { comment: {}, mediaItem: {} },
      });
      const E2 = copy2.enumeration('EntityType', {
        input: { comment: {}, mediaItem: {} },
      });
      expect(E1.comment).not.toBe(E2.comment);
      expect(E1.comment.equals(E2.comment)).toBe(true);
      expect(E2.comment.equals(E1.comment)).toBe(true);
      expect(E1.has(E2.comment)).toBe(true);
    });
  });

  describe('wire-object equality (revival boundary)', () => {
    const E = enumeration('WireType', { input: { comment: {}, post: {} } });

    it('a branded plain wire object compares equal to the canonical member', () => {
      const wire = {
        __smart_enum_type: 'WireType',
        value: 'COMMENT',
        __smart_enum_brand: true as const,
      };
      expect(isSmartEnumItem(wire)).toBe(true);
      // `.equals` is type-constrained to matching branded items; a loose wire
      // object is exactly the revival-boundary case, so cast to exercise the
      // runtime path. `has` (below) is the permissive API for unknown input.
      expect(E.comment.equals(wire as unknown as typeof E.comment)).toBe(true);
      expect(E.has(wire)).toBe(true);
    });

    it('a serialized shape WITHOUT the brand is not treated as an item', () => {
      const serialized = { __smart_enum_type: 'WireType', value: 'COMMENT' };
      expect(isSmartEnumItem(serialized)).toBe(false);
      expect(E.has(serialized)).toBe(false);
    });
  });

  describe('non-membership across enums', () => {
    const Member = enumeration('MemberType', { input: { comment: {} } });
    // Same member value 'COMMENT' but a different enum type.
    const Other = enumeration('OtherType', { input: { comment: {} } });

    it('.equals is false when __smart_enum_type differs (even at equal value)', () => {
      expect(Member.comment.value).toBe(Other.comment.value);
      expect(enumItemsEqual(Member.comment, Other.comment)).toBe(false);
      // Cross-enum `.equals` is rejected at compile time by design (see
      // equalsPredicate.test); the call still returns false at runtime.
      // @ts-expect-error cross-enum comparison — type mismatch, caught at compile time
      expect(Member.comment.equals(Other.comment)).toBe(false);
    });

    it('.has rejects a member of a different enum', () => {
      expect(Member.has(Other.comment)).toBe(false);
      expect(Member.has(undefined)).toBe(false);
      expect(Member.has('COMMENT')).toBe(false);
    });
  });

  describe('has narrows the value type', () => {
    const E = enumeration('NarrowType', { input: { comment: {}, post: {} } });

    it('narrows x to the member type inside the guard', () => {
      const x: unknown = E.comment;
      if (E.has(x)) {
        // If `has` did not narrow, these member accesses would be tsc errors.
        expect(x.value).toBe('COMMENT');
        const type: string = x.__smart_enum_type;
        expect(type).toBe('NarrowType');
      } else {
        throw new Error('expected E.has(E.comment) to be true');
      }
    });
  });

  describe('creation-time name-uniqueness guard', () => {
    it('throws when a name is reused with different members', () => {
      enumeration('DupDifferent', { input: { a: {} } });
      expect(() =>
        enumeration('DupDifferent', { input: { b: {} } }),
      ).toThrow(/already defined with different members/);
    });

    it('allows re-registering the same name with identical members', () => {
      expect(() =>
        enumeration('DupSame', { input: { a: {}, b: {} } }),
      ).not.toThrow();
      expect(() =>
        enumeration('DupSame', { input: { a: {}, b: {} } }),
      ).not.toThrow();
    });
  });
});
