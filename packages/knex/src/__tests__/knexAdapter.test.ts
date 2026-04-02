import type { Knex } from 'knex';
import {
  EnumRevivalError,
  enumeration,
  type FieldEnumMapping,
} from 'smart-enums';

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
    it('should default smartEnumStrict to false', () => {
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
        smartEnumStrict: false,
      });
    });
  });
});

describe('createSmartEnumPostProcessResponse', () => {
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active'] as const,
  });

  const mapping: FieldEnumMapping = { status: UserStatus };

  describe('When query context has no field mapping', () => {
    it('should return the result unchanged', () => {
      const hook = createSmartEnumPostProcessResponse();
      const result = { status: 'ACTIVE' };
      expect(hook(result, {})).toBe(result);
      expect(hook(result)).toBe(result);
    });
  });

  describe('When the result is a single row object', () => {
    it('should revive mapped string fields to enum items', () => {
      const hook = createSmartEnumPostProcessResponse();
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
      const hook = createSmartEnumPostProcessResponse();
      const rows = [{ status: 'ACTIVE' }, { status: 'PENDING' }];
      const out = hook(rows, {
        smartEnumFieldMapping: mapping,
        smartEnumStrict: false,
      }) as typeof rows;
      expect(out[0].status).toBe(UserStatus.active);
      expect(out[1].status).toBe(UserStatus.pending);
    });

    it('should leave non-record elements unchanged', () => {
      const hook = createSmartEnumPostProcessResponse();
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
      const hook = createSmartEnumPostProcessResponse();
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
      const hook = createSmartEnumPostProcessResponse();
      expect(hook(42, { smartEnumFieldMapping: mapping })).toBe(42);
    });
  });
});
