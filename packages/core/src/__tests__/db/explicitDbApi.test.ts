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

  describe('When strict is omitted', () => {
    it('should default to strict and throw on an unknown value', () => {
      const row = { status: 'NOPE' };
      expect(() =>
        reviveRowFromDatabase(row, {
          fieldEnumMapping: { status: UserStatus },
        }),
      ).toThrow(EnumRevivalError);
    });
  });

  describe('When a mapping key names a field the row does not have', () => {
    it('should throw under strict, naming the field', () => {
      const row = { operations: ['VIEW'] };
      expect(() =>
        reviveRowFromDatabase(row, {
          fieldEnumMapping: { operation: UserStatus },
          strict: true,
        }),
      ).toThrow(/Cannot revive field "operation": not present on the row/);
    });

    it('should list the available fields so a near-miss name is obvious', () => {
      const row = { id: 1, operations: ['VIEW'] };
      expect(() =>
        reviveRowFromDatabase(row, {
          fieldEnumMapping: { operation: UserStatus },
        }),
      ).toThrow(/Available fields: id, operations/);
    });

    it('should report "(none)" when the row has no fields at all', () => {
      expect(() =>
        reviveRowFromDatabase({}, { fieldEnumMapping: { status: UserStatus } }),
      ).toThrow(/Available fields: \(none\)/);
    });

    it('should expose the missing field on the error', () => {
      expect.assertions(2);
      try {
        reviveRowFromDatabase(
          { operations: ['VIEW'] },
          { fieldEnumMapping: { operation: UserStatus } },
        );
      } catch (error) {
        expect((error as EnumRevivalError).path).toBe('operation');
        expect((error as EnumRevivalError).value).toBeUndefined();
      }
    });

    it('should stay a silent no-op when strict is false', () => {
      const row = { operations: ['VIEW'] };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { operation: UserStatus },
        strict: false,
      });
      expect(out).toEqual({ operations: ['VIEW'] });
    });

    it('should not fire for a present field holding null', () => {
      // null, not undefined: a nullable column is what a driver actually returns.
      // eslint-disable-next-line unicorn/no-null
      const row = { status: null as unknown as string };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus },
      });
      expect(out.status).toBeNull();
    });

    it('should not fire for a present field explicitly set to undefined', () => {
      const row = { status: undefined as unknown as string };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { status: UserStatus },
      });
      expect(out.status).toBeUndefined();
    });

    it('should skip the check when validateMappedFields is false', () => {
      const row = { operations: ['VIEW'] };
      const out = reviveRowFromDatabase(row, {
        fieldEnumMapping: { operation: UserStatus },
        strict: true,
        validateMappedFields: false,
      });
      expect(out).toEqual({ operations: ['VIEW'] });
    });

    it('should still check values when validateMappedFields is false', () => {
      expect(() =>
        reviveRowFromDatabase(
          { status: 'NOPE' },
          {
            fieldEnumMapping: { status: UserStatus },
            strict: true,
            validateMappedFields: false,
          },
        ),
      ).toThrow(/unknown enum value "NOPE"/);
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
        strict: false,
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
      // null, not undefined: a nullable element is what a driver actually returns.
      /* eslint-disable unicorn/no-null */
      const row = { id: '1', mixed: ['ACTIVE', null, 42] };
      const result = reviveRowFromDatabase(row, {
        fieldEnumMapping: { mixed: Status },
      });
      expect(result.mixed).toEqual([Status.active, null, 42]);
      /* eslint-enable unicorn/no-null */
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

  describe('When a mapped path names a leaf property the payload lacks', () => {
    it('should throw under strict, naming the property', () => {
      const payload = { profile: { statuses: ['ACTIVE'] } };
      expect(() =>
        revivePayloadFromDatabase(payload, {
          pathEnumMapping: { 'profile.status': UserStatus },
          strict: true,
        }),
      ).toThrow(/property "status" is not present/);
    });

    it('should list the available properties', () => {
      const payload = { profile: { statuses: ['ACTIVE'], id: 1 } };
      expect(() =>
        revivePayloadFromDatabase(payload, {
          pathEnumMapping: { 'profile.status': UserStatus },
        }),
      ).toThrow(/Available properties: statuses, id/);
    });

    it('should stay a silent no-op when strict is false', () => {
      const payload = { profile: { statuses: ['ACTIVE'] } };
      const out = revivePayloadFromDatabase(payload, {
        pathEnumMapping: { 'profile.status': UserStatus },
        strict: false,
      });
      expect(out).toEqual({ profile: { statuses: ['ACTIVE'] } });
    });

    it('should fire per element for an items[].field path', () => {
      const payload = { items: [{ kind: 'A' }, { kindd: 'B' }] };
      expect(() =>
        revivePayloadFromDatabase(payload, {
          pathEnumMapping: { 'items[].kind': Kind },
        }),
      ).toThrow(/property "kind" is not present/);
    });

    it('should not fire for a present leaf holding null', () => {
      // null, not undefined: a nullable column is what a driver actually returns.
      // eslint-disable-next-line unicorn/no-null
      const payload = { profile: { status: null } };
      const out = revivePayloadFromDatabase(payload, {
        pathEnumMapping: { 'profile.status': UserStatus },
      });
      expect(out.profile.status).toBeNull();
    });
  });

  describe('When strict is omitted', () => {
    it('should default to strict and throw on an unknown value', () => {
      const payload = { profile: { status: 'BAD' } };
      expect(() =>
        revivePayloadFromDatabase(payload, {
          pathEnumMapping: { 'profile.status': UserStatus },
        }),
      ).toThrow(EnumRevivalError);
    });
  });

  describe('array-of-enum support at leaf paths', () => {
    // Distinct name: a different 'Status' shape is defined elsewhere in this
    // file; names must be unique per module instance.
    const Status = enumeration('StatusLeaf', {
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
      const Status = enumeration('StatusOnOff', {
        input: ['on', 'off'] as const,
      });
      expect(Status.on.toPostgres()).toBe(Status.on.value);
    });
  });
});
