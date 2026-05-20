/**
 * Tests for `src/db`: `prepareForDatabase`, `reviveRowFromDatabase`,
 * `revivePayloadFromDatabase`, `toPostgres()`.
 */

import { enumeration } from '../../enumerations.js';
import {
  EnumRevivalError,
  prepareForDatabase,
  revivePayloadFromDatabase,
  reviveRowFromDatabase,
} from '../../db/index.js';

describe('prepareForDatabase', () => {
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active'] as const,
  });

  describe('When the payload contains enum items', () => {
    it('should replace them with .value strings recursively', () => {
      const out = prepareForDatabase({
        id: 1,
        status: UserStatus.active,
        nested: { status: UserStatus.pending },
      });
      expect(out.id).toBe(1);
      expect(out.status).toBe('ACTIVE');
      expect(out.nested.status).toBe('PENDING');
    });
  });
});

describe('reviveRowFromDatabase', () => {
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active'] as const,
  });

  const Priority = enumeration('Priority', {
    input: ['low', 'high'] as const,
  });

  describe('When one mapped column is a valid enum string', () => {
    it('should revive that field to the enum item', () => {
      const row = { status: 'ACTIVE', id: 1 };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus },
      });
      expect(out.status).toBe(UserStatus.active);
      expect(out.id).toBe(1);
    });
  });

  describe('When several mapped columns are valid enum strings', () => {
    it('should revive each mapped field', () => {
      const row = { status: 'ACTIVE', priority: 'HIGH' };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus, priority: Priority },
      });
      expect(out.status).toBe(UserStatus.active);
      expect(out.priority).toBe(Priority.high);
    });
  });

  describe('When a field is not in fieldEnumMapping', () => {
    it('should leave it unchanged', () => {
      const row = { status: 'ACTIVE', note: 'x' };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus },
      });
      expect(out.note).toBe('x');
    });
  });

  describe('When a mapped field is not a string', () => {
    it('should leave the value unchanged', () => {
      const row = { status: 99 as unknown as string };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus },
      });
      expect(out.status).toBe(99);
    });
  });

  describe('When strict is true and the string is not a valid enum value', () => {
    it('should throw EnumRevivalError', () => {
      const row = { status: 'NOPE' };
      expect(() =>
        reviveRowFromDatabase(row, {
          fieldEnumMapping: { status: UserStatus },
          strict: true,
        }),
      ).toThrow(EnumRevivalError);
    });
  });

  describe('When strict is false and the string is not a valid enum value', () => {
    it('should keep the original string', () => {
      const row = { status: 'NOPE' };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus },
        strict: false,
      });
      expect(out.status).toBe('NOPE');
    });
  });

  describe('array-of-enum support', () => {
    const Status = enumeration('Status', {
      input: ['active', 'pending', 'closed'] as const,
    });

    it('should revive each element of a string array', () => {
      const row = { id: '1', statuses: ['ACTIVE', 'PENDING'] };
      const result = reviveRowFromDatabase(row, {
        fieldEnumMapping: { statuses: Status },
      });
      expect(result.statuses).toEqual([Status.active, Status.pending]);
    });

    it('should pass through unrecognized array values in non-strict mode', () => {
      const row = { id: '1', statuses: ['ACTIVE', 'BOGUS'] };
      const result = reviveRowFromDatabase(row, {
        fieldEnumMapping: { statuses: Status },
      });
      expect(result.statuses).toEqual([Status.active, 'BOGUS']);
    });

    it('should throw on unrecognized array values in strict mode', () => {
      const row = { id: '1', statuses: ['ACTIVE', 'BOGUS'] };
      expect(() =>
        reviveRowFromDatabase(row, {
          fieldEnumMapping: { statuses: Status },
          strict: true,
        }),
      ).toThrow(/unknown enum value "BOGUS" in array/);
    });

    it('should handle empty arrays', () => {
      const row = { id: '1', statuses: [] };
      const result = reviveRowFromDatabase(row, {
        fieldEnumMapping: { statuses: Status },
      });
      expect(result.statuses).toEqual([]);
    });

    it('should leave non-string array elements alone', () => {
      const row = { id: '1', mixed: ['ACTIVE', null, 42] };
      const result = reviveRowFromDatabase(row, {
        fieldEnumMapping: { mixed: Status },
      });
      expect(result.mixed).toEqual([Status.active, null, 42]);
    });

    it('should still handle scalar string fields alongside array fields', () => {
      const row = {
        id: '1',
        primaryStatus: 'ACTIVE',
        statuses: ['PENDING', 'CLOSED'],
      };
      const result = reviveRowFromDatabase(row, {
        fieldEnumMapping: { primaryStatus: Status, statuses: Status },
      });
      expect(result.primaryStatus).toBe(Status.active);
      expect(result.statuses).toEqual([Status.pending, Status.closed]);
    });
  });
});

describe('revivePayloadFromDatabase', () => {
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active'] as const,
  });

  const Kind = enumeration('Kind', {
    input: ['a', 'b'] as const,
  });

  describe('When a nested path is mapped', () => {
    it('should revive the value at that path', () => {
      const payload = {
        profile: { nested: { status: 'ACTIVE' }, other: 1 },
      };
      const out = revivePayloadFromDatabase(payload, {
        pathEnumMapping: { 'profile.nested.status': UserStatus },
      });
      expect(out.profile.nested.status).toBe(UserStatus.active);
      expect(out.profile.other).toBe(1);
    });
  });

  describe('When an array path like items[].kind is mapped', () => {
    it('should revive each element', () => {
      const payload = { items: [{ kind: 'A' }, { kind: 'B' }] };
      const out = revivePayloadFromDatabase(payload, {
        pathEnumMapping: { 'items[].kind': Kind },
      });
      expect(out.items[0].kind).toBe(Kind.a);
      expect(out.items[1].kind).toBe(Kind.b);
    });
  });

  describe('When strict is true and a nested mapped string is invalid', () => {
    it('should throw EnumRevivalError', () => {
      const payload = { profile: { status: 'BAD' } };
      expect(() =>
        revivePayloadFromDatabase(payload, {
          pathEnumMapping: { 'profile.status': UserStatus },
          strict: true,
        }),
      ).toThrow(EnumRevivalError);
    });
  });

  describe('array-of-enum support at leaf paths', () => {
    const Status = enumeration('Status', {
      input: ['active', 'pending'] as const,
    });

    it('should revive an array at a leaf path', () => {
      const payload = { user: { statuses: ['ACTIVE', 'PENDING'] } };
      const result = revivePayloadFromDatabase(payload, {
        pathEnumMapping: { 'user.statuses': Status },
      });
      expect(result.user.statuses).toEqual([Status.active, Status.pending]);
    });

    it('should throw on unknown array values in strict mode', () => {
      const payload = { user: { statuses: ['ACTIVE', 'BOGUS'] } };
      expect(() =>
        revivePayloadFromDatabase(payload, {
          pathEnumMapping: { 'user.statuses': Status },
          strict: true,
        }),
      ).toThrow(/unknown enum value "BOGUS" in array/);
    });

    it('should still handle the existing items[].field syntax for arrays of objects', () => {
      const payload = {
        items: [{ kind: 'ACTIVE' }, { kind: 'PENDING' }],
      };
      const result = revivePayloadFromDatabase(payload, {
        pathEnumMapping: { 'items[].kind': Status },
      });
      expect(result.items).toEqual([
        { kind: Status.active },
        { kind: Status.pending },
      ]);
    });
  });
});

describe('enumeration item toPostgres', () => {
  describe('When toPostgres is called', () => {
    it('should return the same string as .value', () => {
      const Status = enumeration('Status', {
        input: ['on', 'off'] as const,
      });
      expect(Status.on.toPostgres()).toBe(Status.on.value);
    });
  });
});
