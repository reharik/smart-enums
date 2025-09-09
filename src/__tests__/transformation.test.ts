import { Enumeration, enumeration } from '../index.js';
import {
  serializeSmartEnums,
  reviveSmartEnums,
} from '../utilities/transformation.js';

describe('TRANSFORMATION', () => {
  const statusInput = ['pending', 'active', 'completed'] as const;
  type Status = Enumeration<typeof Status, typeof statusInput>;
  const Status = enumeration({ input: statusInput });
  const colorInput = ['red', 'blue', 'green'] as const;
  type Color = Enumeration<typeof Color, typeof colorInput>;
  const Color = enumeration({ input: colorInput });

  describe('when serializing top-level enum items', () => {
    it('should serialize enum items to their values', () => {
      const dto = { status: Status.active, color: Color.red, id: '123' };
      const wire = serializeSmartEnums(dto);
      expect(wire).toEqual({ status: 'ACTIVE', color: 'RED', id: '123' });
    });
  });

  describe('when serializing nested objects and arrays', () => {
    it('should serialize nested enum items', () => {
      const dto = {
        user: {
          id: 'u1',
          status: Status.pending,
          history: [Status.active, Status.completed],
        },
        tags: [Color.blue, { favorite: Color.green }],
      };
      const wire = serializeSmartEnums(dto);
      expect(wire.user.status).toBe('PENDING');
      expect(wire.user.history).toEqual(['ACTIVE', 'COMPLETED']);
      const tags = wire.tags as readonly [string, { favorite: string }];
      expect(tags[0]).toBe('BLUE');
      expect(tags[1].favorite).toBe('GREEN');
    });
  });

  describe('when serializing cyclic references', () => {
    it('should preserve cycles', () => {
      type SelfReferential<T> = T & { self?: SelfReferential<T> };
      const dto: SelfReferential<{ status: Status }> = {
        status: Status.active,
      };
      dto.self = dto;
      const wire = serializeSmartEnums(dto);
      expect(wire.status).toBe('ACTIVE');
      expect(wire.self).toBe(wire);
    });
  });

  describe('when reviving from field mapping', () => {
    it('should revive top-level and nested fields', () => {
      const wire: {
        status: string;
        favoriteColor: string;
        nested: { state: string };
        list: [{ state: string }, 'UNCHANGED'];
      } = {
        status: 'COMPLETED',
        favoriteColor: 'RED',
        nested: { state: 'ACTIVE' },
        list: [{ state: 'PENDING' }, 'UNCHANGED'],
      };

      const revived = reviveSmartEnums(wire, {
        status: Status,
        favoriteColor: Color,
        state: Status,
      });

      expect(revived.status).toBe(Status.completed);
      expect(revived.favoriteColor).toBe(Color.red);
      expect(revived.nested.state).toBe(Status.active);
      const items = revived.list as readonly [Status, { state: Status }];
      expect(items[0].state).toBe(Status.pending);
      expect(items[1]).toBe('UNCHANGED');
    });
  });

  describe('when reviving without matching field', () => {
    it('should leave unmatched fields as-is', () => {
      const wire = { other: 'ACTIVE' };
      const revived = reviveSmartEnums(wire, { status: Status });
      expect(revived).toEqual({ other: 'ACTIVE' });
    });
  });
});
