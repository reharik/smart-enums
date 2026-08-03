import type { Knex } from 'knex';
import {
  EnumRevivalError,
  enumeration,
  type FieldEnumMapping,
} from '@reharik/smart-enum';

import { createSmartEnumPostProcessResponse } from '../createSmartEnumPostProcessResponse.js';
import { withEnumRevival } from '../withEnumRevival.js';

describe('withEnumRevival', () => {
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active'] as const,
  });

  const mapping: FieldEnumMapping = { status: UserStatus };

  describe('When called with a query builder-like object', () => {
    it('should attach smartEnumFieldMapping and smartEnumStrict on the query context', () => {
      const captured: unknown[] = [];
      const query = {
        queryContext(ctx: unknown) {
          captured.push(ctx);
          return this;
        },
      } as unknown as Knex.QueryBuilder;

      const out = withEnumRevival(query, mapping, { strict: true });

      expect(out).toBe(query);
      expect(captured).toHaveLength(1);
      expect(captured[0]).toEqual({
        smartEnumFieldMapping: mapping,
        smartEnumStrict: true,
      });
    });
  });

  describe('When strict is omitted', () => {
    it('should default smartEnumStrict to true', () => {
      const captured: unknown[] = [];
      const query = {
        queryContext(ctx: unknown) {
          captured.push(ctx);
          return this;
        },
      } as unknown as Knex.QueryBuilder;

      withEnumRevival(query, mapping);

      expect(captured[0]).toEqual({
        smartEnumFieldMapping: mapping,
        smartEnumStrict: true,
      });
    });
  });

  describe('When strict is explicitly false', () => {
    it('should carry that through to the query context', () => {
      const captured: unknown[] = [];
      const query = {
        queryContext(ctx: unknown) {
          captured.push(ctx);
          return this;
        },
      } as unknown as Knex.QueryBuilder;

      withEnumRevival(query, mapping, { strict: false });

      expect(captured[0]).toEqual({
        smartEnumFieldMapping: mapping,
        smartEnumStrict: false,
      });
    });
  });
});

// The Knex config field is optional, so the factory's return type is too.
const makeHook = (): NonNullable<Knex.Config['postProcessResponse']> =>
  createSmartEnumPostProcessResponse() as NonNullable<
    Knex.Config['postProcessResponse']
  >;

describe('createSmartEnumPostProcessResponse', () => {
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active'] as const,
  });

  const mapping: FieldEnumMapping = { status: UserStatus };

  describe('When query context has no field mapping', () => {
    it('should return the result unchanged', () => {
      const hook = makeHook();
      const result = { status: 'ACTIVE' };
      expect(hook(result, {})).toBe(result);
      // The hook's second parameter is required by Knex's type, so an absent
      // query context has to be passed explicitly.
      // eslint-disable-next-line unicorn/no-useless-undefined
      expect(hook(result, undefined)).toBe(result);
    });
  });

  describe('When the result is a single row object', () => {
    it('should revive mapped string fields to enum items', () => {
      const hook = makeHook();
      const row = { status: 'ACTIVE', id: 1 };
      const out = hook(row, {
        smartEnumFieldMapping: mapping,
        smartEnumStrict: false,
      }) as typeof row;
      expect(out.status).toBe(UserStatus.active);
      expect(out.id).toBe(1);
    });
  });

  describe('When the result is an array of row objects', () => {
    it('should revive each row-like element', () => {
      const hook = makeHook();
      const rows = [{ status: 'ACTIVE' }, { status: 'PENDING' }];
      const out = hook(rows, {
        smartEnumFieldMapping: mapping,
        smartEnumStrict: false,
      }) as typeof rows;
      expect(out[0].status).toBe(UserStatus.active);
      expect(out[1].status).toBe(UserStatus.pending);
    });

    it('should leave non-record elements unchanged', () => {
      const hook = makeHook();
      const rows = [{ status: 'ACTIVE' }, undefined, 1];
      const out = hook(rows, {
        smartEnumFieldMapping: mapping,
        smartEnumStrict: false,
      }) as unknown[];
      expect((out[0] as { status: unknown }).status).toBe(UserStatus.active);
      expect(out[1]).toBeUndefined();
      expect(out[2]).toBe(1);
    });
  });

  describe('When strict mode is true and a value cannot be revived', () => {
    it('should propagate EnumRevivalError', () => {
      const hook = makeHook();
      const row = { status: 'NOT_A_STATUS' };
      expect(() =>
        hook(row, {
          smartEnumFieldMapping: mapping,
          smartEnumStrict: true,
        }),
      ).toThrow(EnumRevivalError);
    });
  });

  describe('When the result is not row-shaped', () => {
    it('should return primitives unchanged', () => {
      const hook = makeHook();
      expect(hook(42, { smartEnumFieldMapping: mapping })).toBe(42);
    });
  });

  describe('When smartEnumStrict is omitted', () => {
    it('should default to strict', () => {
      const hook = makeHook();
      expect(() =>
        hook({ status: 'NOT_A_STATUS' }, { smartEnumFieldMapping: mapping }),
      ).toThrow(EnumRevivalError);
    });
  });

  describe('When a mapping key names a field the rows do not have', () => {
    const operationMapping: FieldEnumMapping = { operation: UserStatus };

    it('should throw for a single row result', () => {
      const hook = makeHook();
      expect(() =>
        hook(
          { operations: ['ACTIVE'] },
          { smartEnumFieldMapping: operationMapping },
        ),
      ).toThrow(/Cannot revive field "operation": not present on the row/);
    });

    it('should throw for an array result', () => {
      const hook = makeHook();
      expect(() =>
        hook([{ operations: ['ACTIVE'] }, { operations: ['PENDING'] }], {
          smartEnumFieldMapping: operationMapping,
        }),
      ).toThrow(/Available fields: operations/);
    });

    it('should validate against the first row only', () => {
      const hook = makeHook();
      // Second row lacks `status`. Heterogeneous rows aren't supported, but the
      // check is deliberately scoped to the first row, so this must not throw.
      const out = hook([{ status: 'ACTIVE' }, { other: 1 }], {
        smartEnumFieldMapping: mapping,
      }) as Record<string, unknown>[];
      expect(out[0].status).toBe(UserStatus.active);
      expect(out[1]).toEqual({ other: 1 });
    });

    it('should skip leading non-record elements when picking the row to validate', () => {
      const hook = makeHook();
      expect(() =>
        hook([undefined, { operations: ['ACTIVE'] }], {
          smartEnumFieldMapping: operationMapping,
        }),
      ).toThrow(EnumRevivalError);
    });

    it('should not throw for an empty result set', () => {
      const hook = makeHook();
      expect(hook([], { smartEnumFieldMapping: operationMapping })).toEqual([]);
    });

    it('should stay a silent no-op when strict is false', () => {
      const hook = makeHook();
      const out = hook([{ operations: ['ACTIVE'] }], {
        smartEnumFieldMapping: operationMapping,
        smartEnumStrict: false,
      });
      expect(out).toEqual([{ operations: ['ACTIVE'] }]);
    });
  });
});
