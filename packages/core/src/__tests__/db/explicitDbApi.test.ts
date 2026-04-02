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
