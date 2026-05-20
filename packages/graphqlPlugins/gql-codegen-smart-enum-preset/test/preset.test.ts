import { buildSchema } from 'graphql';

import { preset } from '../src/index.js';

const smartEnumPluginName = '@reharik/graphql-codegen-smart-enum';
const typePoliciesPluginName =
  '@reharik/graphql-codegen-smart-enum-type-policies';

const testSchema = buildSchema(`
  enum PaymentStatus { PENDING, PAID, VOIDED }
  enum SortDirection { ASC, DESC }
  enum Internal { A, B }

  type Order {
    id: ID!
    status: PaymentStatus!
    direction: SortDirection
  }

  type Query {
    order(id: ID!): Order
  }
`);

/**
 * The preset's buildGeneratesSection takes a large `options` object that
 * graphql-codegen normally builds. For tests, we construct a minimal version
 * that has just enough fields for the preset to do its work.
 */
const buildOptions = (overrides: Record<string, unknown> = {}) => ({
  baseOutputDir: './output.ts',
  plugins: [],
  pluginMap: {},
  schema: undefined,
  schemaAst: testSchema,
  config: {},
  presetConfig: {},
  documents: [],
  ...overrides,
});

describe('smart-enum preset', () => {
  describe('config validation', () => {
    it('should throw when mode is missing', () => {
      const options = buildOptions({ presetConfig: {} });
      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /presetConfig\.mode must be one of/,
      );
    });

    it('should throw when mode is invalid', () => {
      const options = buildOptions({ presetConfig: { mode: 'bogus' } });
      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /presetConfig\.mode must be one of/,
      );
    });

    it("should throw when enumImportPath is missing in 'type-policies' mode", () => {
      const options = buildOptions({
        presetConfig: { mode: 'type-policies' },
      });
      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /enumImportPath is required/,
      );
    });

    it("should throw when enumImportPath is missing in 'with-enum-values' mode", () => {
      const options = buildOptions({
        presetConfig: { mode: 'with-enum-values' },
        plugins: ['typescript'],
      });
      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /enumImportPath is required/,
      );
    });

    it("should NOT require enumImportPath in 'enums' mode", () => {
      const options = buildOptions({ presetConfig: { mode: 'enums' } });
      expect(() =>
        preset.buildGeneratesSection(options as never),
      ).not.toThrow();
    });

    it('should throw when skipEnums is not an array', () => {
      const options = buildOptions({
        presetConfig: { mode: 'enums', skipEnums: 'PaymentStatus' },
      });
      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /skipEnums must be an array/,
      );
    });

    it('should throw when serializeAs is invalid', () => {
      const options = buildOptions({
        presetConfig: { mode: 'enums', serializeAs: 'bogus' },
      });
      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /serializeAs must be 'value' or 'wrapped'/,
      );
    });
  });

  describe("'enums' mode", () => {
    it('should produce a single output configured to run the enum-definition plugin', () => {
      const options = buildOptions({
        presetConfig: { mode: 'enums' },
      });

      const result = preset.buildGeneratesSection(options as never);

      expect(result).toHaveLength(1);
      expect(result[0]?.plugins).toEqual([{ [smartEnumPluginName]: {} }]);

      const map = result[0]?.pluginMap as
        | Record<string, { plugin?: unknown }>
        | undefined;
      expect(typeof map?.[smartEnumPluginName]?.plugin).toBe('function');
    });

    it('should pass through enum-definition plugin config options', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          enumClassSuffix: 'Enum',
          emitDescriptionsAsDisplay: false,
          serializeAs: 'value',
          skipEnums: ['Internal'],
          externalEnums: { Internal: '../hand-authored/internal' },
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;

      expect(config.enumClassSuffix).toBe('Enum');
      expect(config.emitDescriptionsAsDisplay).toBe(false);
      expect(config.serializeAs).toBe('value');
      expect(config.skipEnums).toEqual(['Internal']);
      expect(config.externalEnums).toEqual({
        Internal: '../hand-authored/internal',
      });
    });

    it('should not include unset config keys', () => {
      const options = buildOptions({
        presetConfig: { mode: 'enums' },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;

      expect(config).not.toHaveProperty('enumClassSuffix');
      expect(config).not.toHaveProperty('serializeAs');
      expect(config).not.toHaveProperty('skipEnums');
      expect(config).not.toHaveProperty('externalEnums');
    });
  });

  describe("'type-policies' mode", () => {
    it('should produce a single output configured to run the type-policies plugin', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'type-policies',
          enumImportPath: '@packages/contracts',
        },
      });

      const result = preset.buildGeneratesSection(options as never);

      expect(result).toHaveLength(1);
      expect(result[0]?.plugins).toEqual([{ [typePoliciesPluginName]: {} }]);

      const map = result[0]?.pluginMap as
        | Record<string, { plugin?: unknown }>
        | undefined;
      expect(typeof map?.[typePoliciesPluginName]?.plugin).toBe('function');
    });

    it('should pass enumImportPath to the type-policies plugin', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'type-policies',
          enumImportPath: '@packages/contracts',
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;

      expect(config.enumImportPath).toBe('@packages/contracts');
    });

    it('should pass enumClassSuffix and skipEnums when provided', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'type-policies',
          enumImportPath: '@packages/contracts',
          enumClassSuffix: 'Enum',
          skipEnums: ['Internal'],
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;

      expect(config.enumClassSuffix).toBe('Enum');
      expect(config.skipEnums).toEqual(['Internal']);
    });
  });

  describe("'with-enum-values' mode", () => {
    it('should preserve the consumer plugin list', () => {
      const options = buildOptions({
        plugins: ['typescript', 'typescript-operations'],
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
        },
      });

      const result = preset.buildGeneratesSection(options as never);

      expect(result).toHaveLength(1);
      expect(result[0]?.plugins).toEqual([
        'typescript',
        'typescript-operations',
      ]);
    });

    it('should auto-derive enumValues for every schema enum', () => {
      const options = buildOptions({
        plugins: ['typescript-operations'],
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;
      const enumValues = config.enumValues as Record<string, string>;

      expect(enumValues).toEqual({
        Internal: '@packages/contracts#Internal',
        PaymentStatus: '@packages/contracts#PaymentStatus',
        SortDirection: '@packages/contracts#SortDirection',
      });
    });

    it('should apply enumClassSuffix to enumValues entries', () => {
      const options = buildOptions({
        plugins: ['typescript-resolvers'],
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
          enumClassSuffix: 'Enum',
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;
      const enumValues = config.enumValues as Record<string, string>;

      expect(enumValues.PaymentStatus).toBe(
        '@packages/contracts#PaymentStatusEnum',
      );
    });

    it('should respect skipEnums', () => {
      const options = buildOptions({
        plugins: ['typescript-operations'],
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
          skipEnums: ['Internal'],
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;
      const enumValues = config.enumValues as Record<string, string>;

      expect(enumValues).not.toHaveProperty('Internal');
      expect(enumValues).toHaveProperty('PaymentStatus');
      expect(enumValues).toHaveProperty('SortDirection');
    });

    it('should preserve consumer-supplied config keys', () => {
      const options = buildOptions({
        plugins: ['typescript', 'typescript-operations'],
        config: {
          scalars: { DateTime: 'string' },
          maybeValue: 'T | undefined',
        },
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;

      expect(config.scalars).toEqual({ DateTime: 'string' });
      expect(config.maybeValue).toBe('T | undefined');
    });

    it('should let consumer-supplied enumValues override auto-derived ones', () => {
      const options = buildOptions({
        plugins: ['typescript-operations'],
        config: {
          enumValues: {
            PaymentStatus: '@special/path#CustomPaymentStatus',
          },
        },
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
        },
      });

      const result = preset.buildGeneratesSection(options as never);
      const config = result[0]?.config as Record<string, unknown>;
      const enumValues = config.enumValues as Record<string, string>;

      // PaymentStatus comes from consumer override
      expect(enumValues.PaymentStatus).toBe(
        '@special/path#CustomPaymentStatus',
      );
      // SortDirection still auto-derived
      expect(enumValues.SortDirection).toBe(
        '@packages/contracts#SortDirection',
      );
    });

    it('should throw when no plugins are provided', () => {
      const options = buildOptions({
        plugins: [],
        presetConfig: {
          mode: 'with-enum-values',
          enumImportPath: '@packages/contracts',
        },
      });

      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /requires the consumer to provide a 'plugins' array/,
      );
    });
  });
  describe('skipEnums schema validation', () => {
    it('should throw when skipEnums contains a name not in the schema', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          skipEnums: ['DoesNotExist'],
        },
      });

      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /skipEnums contains names that don't correspond to enum types/,
      );
    });

    it('should list available enum types in the error message', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          skipEnums: ['DoesNotExist'],
        },
      });

      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /PaymentStatus.*SortDirection/,
      );
    });

    it('should throw when skipEnums references an object type, not an enum', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          skipEnums: ['Order'], // Order is a type, not an enum
        },
      });

      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /Order/,
      );
    });

    it('should accept valid enum names in skipEnums', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          skipEnums: ['Internal'],
        },
      });

      expect(() =>
        preset.buildGeneratesSection(options as never),
      ).not.toThrow();
    });

    it('should accept multiple valid enum names in skipEnums', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          skipEnums: ['Internal', 'PaymentStatus'],
        },
      });

      expect(() =>
        preset.buildGeneratesSection(options as never),
      ).not.toThrow();
    });

    it('should mention all unknown names in the error', () => {
      const options = buildOptions({
        presetConfig: {
          mode: 'enums',
          skipEnums: ['Foo', 'Bar', 'PaymentStatus'],
        },
      });

      expect(() => preset.buildGeneratesSection(options as never)).toThrow(
        /'Foo'.*'Bar'/,
      );
    });
  });
});
