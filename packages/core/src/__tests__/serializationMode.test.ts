import { enumeration } from '../enumerations.js';
import {
  resetDefaultSerializationMode,
  setDefaultSerializationMode,
} from '../utilities/serializationMode.js';

describe('serializeAs / serialization mode', () => {
  // Reset global state after every test so tests don't pollute each other
  afterEach(() => {
    resetDefaultSerializationMode();
  });

  describe('default behavior (no global, no per-enum)', () => {
    it('should serialize to wrapped shape by default', () => {
      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
      });

      expect(Status.active.toJSON()).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
    });

    it('should produce wrapped output through JSON.stringify', () => {
      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
      });

      const json = JSON.stringify({ s: Status.active });
      expect(JSON.parse(json)).toEqual({
        s: { __smart_enum_type: 'Status', value: 'ACTIVE' },
      });
    });
  });

  describe('per-enum serializeAs option', () => {
    it('should serialize to bare value when serializeAs is "value"', () => {
      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
        serializeAs: 'value',
      });

      expect(Status.active.toJSON()).toBe('ACTIVE');
    });

    it('should produce bare value through JSON.stringify when serializeAs is "value"', () => {
      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
        serializeAs: 'value',
      });

      const json = JSON.stringify({ s: Status.active });
      expect(JSON.parse(json)).toEqual({ s: 'ACTIVE' });
    });

    it('should serialize to wrapped shape when serializeAs is explicitly "wrapped"', () => {
      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
        serializeAs: 'wrapped',
      });

      expect(Status.active.toJSON()).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
    });
  });

  describe('global default mode', () => {
    it('should serialize to bare value when global mode is "value"', () => {
      setDefaultSerializationMode('value');

      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
      });

      expect(Status.active.toJSON()).toBe('ACTIVE');
    });

    it('should serialize to wrapped shape when global mode is "wrapped"', () => {
      setDefaultSerializationMode('wrapped');

      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
      });

      expect(Status.active.toJSON()).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
    });

    it('should apply global mode to enums created before setDefaultSerializationMode is called', () => {
      // Create the enum FIRST (default mode at creation time would be wrapped)
      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
      });

      // Then change the global — should affect existing enums
      setDefaultSerializationMode('value');

      expect(Status.active.toJSON()).toBe('ACTIVE');
    });
  });

  describe('precedence: per-enum overrides global', () => {
    it('per-enum "value" should win when global is "wrapped"', () => {
      setDefaultSerializationMode('wrapped');

      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
        serializeAs: 'value',
      });

      expect(Status.active.toJSON()).toBe('ACTIVE');
    });

    it('per-enum "wrapped" should win when global is "value"', () => {
      setDefaultSerializationMode('value');

      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
        serializeAs: 'wrapped',
      });

      expect(Status.active.toJSON()).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
    });

    it('different enums in the same app can use different modes', () => {
      setDefaultSerializationMode('value');

      const Wrapped = enumeration('Wrapped', {
        input: ['a', 'b'] as const,
        serializeAs: 'wrapped',
      });

      const Bare = enumeration('Bare', {
        input: ['x', 'y'] as const,
      });

      expect(Wrapped.a.toJSON()).toEqual({
        __smart_enum_type: 'Wrapped',
        value: 'A',
      });
      expect(Bare.x.toJSON()).toBe('X');
    });
  });

  describe('resetDefaultSerializationMode', () => {
    it('should restore the built-in default after reset', () => {
      setDefaultSerializationMode('value');
      resetDefaultSerializationMode();

      const Status = enumeration('Status', {
        input: ['pending', 'active'] as const,
      });

      expect(Status.active.toJSON()).toEqual({
        __smart_enum_type: 'Status',
        value: 'ACTIVE',
      });
    });
  });
});
