import { Enumeration, enumeration } from '../index.js';
import {
  serializeSmartEnums,
  reviveSmartEnums,
} from '../utilities/transformation.js';

describe('TRANSFORMATION', () => {
  const statusInput = ['pending', 'active', 'completed'] as const;
  type Status = Enumeration<typeof Status>;
  const Status = enumeration('Status', { input: statusInput });
  const colorInput = ['red', 'blue', 'green'] as const;
  type Color = Enumeration<typeof Color>;
  const Color = enumeration('Color', { input: colorInput });
  type MixedDto = {
    status: Status;
    favoriteColor: string;
    nested: { state: Status };
    list: [{ state: Status }, string];
  };

  describe('when serializing top-level enum items', () => {
    it('should serialize enum items to their values', () => {
      const dto = { status: Status.active, color: Color.red, id: '123' };
      const wire = serializeSmartEnums(dto);
      expect(wire).toEqual({
        status: {
          __smart_enum_type: 'Status',
          value: 'ACTIVE',
        },
        color: {
          __smart_enum_type: 'Color',
          value: 'RED',
        },
        id: '123',
      });
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
      expect(wire.user.status).toEqual({
        __smart_enum_type: 'Status',
        value: 'PENDING',
      });
      expect(wire.user.history).toEqual([
        {
          __smart_enum_type: 'Status',
          value: 'ACTIVE',
        },
        {
          __smart_enum_type: 'Status',
          value: 'COMPLETED',
        },
      ]);
      const tags = wire.tags as readonly [string, { favorite: string }];
      expect(tags[0]).toEqual({
        __smart_enum_type: 'Color',
        value: 'BLUE',
      }); // Color enum now serializes to object with enumType
      expect(tags[1].favorite).toEqual({
        __smart_enum_type: 'Color',
        value: 'GREEN',
      }); // Color enum now serializes to object with enumType
    });
  });

  describe('when serializing cyclic references', () => {
    it('should preserve cycles', () => {
      type SelfReferential<T> = T & { self?: SelfReferential<T> };
      const dto: SelfReferential<{ status: unknown }> = {
        status: Status.active,
      };
      dto.self = dto;
      const wire = serializeSmartEnums(dto);
      expect(wire.status).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
      expect(wire.self).toBe(wire);
    });
  });

  describe('when reviving from registry', () => {
    it('should revive top-level and nested fields', () => {
      const dto = {
        status: Status.completed,
        favoriteColor: Color.red,
        nested: { state: Status.active },
        list: [{ state: Status.pending }, 'UNCHANGED'],
      };

      const wire = serializeSmartEnums(dto);

      const revived = reviveSmartEnums<MixedDto>(wire, {
        Status: Status,
        Color: Color,
      });

      expect(revived.status).toBe(Status.completed);
      expect(revived.favoriteColor).toBe(Color.red); // Color enum now properly revived
      expect(revived.nested.state).toBe(Status.active);
      const items = revived.list;
      expect((items[0] as { state: unknown }).state).toBe(Status.pending);
      expect(items[1]).toBe('UNCHANGED');
    });
  });

  describe('when reviving without matching enum type', () => {
    it('should leave unmatched enum types as-is', () => {
      const dto = { status: Status.active };
      const wire = serializeSmartEnums(dto);
      const revived = reviveSmartEnums<typeof dto>(wire, {
        Color: Color,
      }); // Wrong enum type
      expect(revived.status).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
    });
  });

  describe('enum types with enumType', () => {
    it('should handle both enum types correctly', () => {
      const dto = {
        status: Status.active, // Has enumType: 'Status'
        color: Color.red, // Has enumType: 'Color'
        mixed: {
          status: Status.completed, // Has enumType: 'Status'
          color: Color.blue, // Has enumType: 'Color'
        },
      };

      const wire = serializeSmartEnums(dto);

      // Status enum (with enumType) serializes to object with type info
      expect(wire.status).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });

      // Color enum now serializes to object with enumType
      expect(wire.color).toEqual({
        __smart_enum_type: 'Color',
        value: 'RED',
      });

      // Mixed nested object
      expect(wire.mixed.status).toEqual({
        __smart_enum_type: 'Status',
        value: 'COMPLETED',
      });
      expect(wire.mixed.color).toEqual({
        __smart_enum_type: 'Color',
        value: 'BLUE',
      });

      // Revival works for both types
      const revived = reviveSmartEnums<typeof dto>(wire, {
        Status: Status,
        Color: Color,
      });
      expect(revived.status).toBe(Status.active);
      expect(revived.color).toBe(Color.red); // Now properly revived
      expect(revived.mixed.status).toBe(Status.completed);
      expect(revived.mixed.color).toBe(Color.blue); // Now properly revived
    });
  });

  describe('type safety with enum types', () => {
    it('should demonstrate proper enum revival', () => {
      // Create an object with an enum with enumType
      const dto = {
        color: Color.red, // This will serialize to object with enumType
      };

      const wire = serializeSmartEnums(dto);

      // Revive with Color in registry (since it now has enumType)
      const revived = reviveSmartEnums<typeof dto>(wire, {
        Status: Status,
        Color: Color,
      });

      // The revived value is now properly a Color enum
      expect(revived.color).toBe(Color.red); // This is now properly a Color enum

      // This demonstrates that the revived value is now properly a Color enum
      expect((revived.color as Record<string, unknown>).key).toBe('red'); // Can access enum properties
      expect((revived.color as Record<string, unknown>).value).toBe('RED'); // Can access enum properties
      expect((revived.color as Record<string, unknown>).display).toBe('Red'); // Can access enum properties

      // The type system can't catch this because reviveSmartEnums returns 'unknown'
      // But at runtime, we can see that the value is now properly revived
      expect(typeof revived.color).toBe('object');
      expect(revived.color).toHaveProperty('key');
    });

    it('should demonstrate the correct way to handle revived enums', () => {
      // Create an object with enum types
      const dto = {
        status: Status.active, // Has enumType, will revive to EnumItem
        color: Color.red, // Has enumType, will revive to EnumItem
      };

      const wire = serializeSmartEnums(dto);
      const revived = reviveSmartEnums<typeof dto>(wire, {
        Status: Status,
        Color: Color,
      });

      // Correct usage: treat the revived values according to their actual types
      expect(revived.status).toBe(Status.active); // EnumItem
      expect(revived.status.key).toBe('active'); // Can access enum properties
      expect(revived.color).toBe(Color.red); // EnumItem
      expect(typeof revived.color).toBe('object'); // Confirmed to be object

      // If you need to convert the string back to an enum, you'd need to do it manually:
      const colorFromString = Color.fromValue(
        (revived.color as Record<string, unknown>).value as string,
      );
      expect(colorFromString).toBe(Color.red);
    });
  });
});
