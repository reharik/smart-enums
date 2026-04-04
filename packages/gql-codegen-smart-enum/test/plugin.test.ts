import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { buildSchema } from 'graphql';

import { plugin, type SmartEnumPluginConfig } from '../src/index.js';

const schemaText = readFileSync(
  path.resolve(process.cwd(), 'examples/schema.graphql'),
  'utf8',
);

const schema = buildSchema(schemaText);

const generateFromSchemaText = async (
  schemaTextValue: string,
): Promise<string> => {
  const generatedSchema = buildSchema(schemaTextValue);
  const output = plugin(generatedSchema, [], {});
  return normalizeOutput(output);
};

const normalizeOutput = async (
  output: ReturnType<typeof plugin>,
): Promise<string> => {
  const resolved = await output;
  return typeof resolved === 'string' ? resolved : resolved.content;
};

describe('SmartEnum plugin', () => {
  describe('When generating from schema enums', () => {
    it('should produce deterministic enumeration output with display metadata', async () => {
      // arrange
      const output = plugin(schema, [], {});

      // act
      const normalized = await normalizeOutput(output);

      // assert
      expect(normalized).toContain(
        "const paymentStatusInput = { 'pending': { display: 'Waiting for payment' },",
      );
      expect(normalized).toContain(
        "'canceled': { display: 'Payment was canceled', deprecated: true, deprecationReason: 'Use VOIDED' }",
      );
      expect(normalized).toContain(
        "const sortDirectionInput = ['asc', 'desc'] as const;",
      );
    });
  });

  describe('When emitDescriptionsAsDisplay is disabled', () => {
    it('should emit object input when enum contains deprecated values', async () => {
      // arrange
      const output = plugin(schema, [], {
        emitDescriptionsAsDisplay: false,
      });

      // act
      const normalized = await normalizeOutput(output);

      // assert
      expect(normalized).toContain("const paymentStatusInput = { 'pending':");
      expect(normalized).toContain(
        "'canceled': { deprecated: true, deprecationReason: 'Use VOIDED' }",
      );
      expect(normalized).toContain(
        "const sortDirectionInput = ['asc', 'desc'] as const;",
      );
    });
  });

  describe('When enum metadata directives are present', () => {
    it('should emit display from enumMeta(display)', async () => {
      // arrange
      const schemaWithEnumMeta = `
        directive @enumMeta(
          display: String
          shortDisplay: String
          description: String
          sortOrder: Int
        ) on ENUM_VALUE

        enum ClaimStatus {
          OPEN @enumMeta(display: "Open")
        }
      `;

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'open': { display: 'Open' } } as const;",
      );
    });

    it('should emit full enumMeta payload fields', async () => {
      // arrange
      const schemaWithEnumMeta = `
        directive @enumMeta(
          display: String
          shortDisplay: String
          description: String
          sortOrder: Int
        ) on ENUM_VALUE

        enum ClaimStatus {
          IN_REVIEW @enumMeta(
            display: "In Review"
            shortDisplay: "Review"
            description: "Waiting for adjudication"
            sortOrder: 2
          )
        }
      `;

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'inReview': { display: 'In Review', shortDisplay: 'Review', description: 'Waiting for adjudication', sortOrder: 2 } } as const;",
      );
    });

    it('should fallback display to derived value when metadata and description are missing', async () => {
      // arrange
      const schemaWithEnumMeta = `
        directive @enumMeta(
          display: String
          shortDisplay: String
          description: String
          sortOrder: Int
        ) on ENUM_VALUE

        enum ClaimStatus {
          IN_REVIEW @enumMeta(sortOrder: 3)
        }
      `;

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'inReview': { display: 'In Review', sortOrder: 3 } } as const;",
      );
    });

    it('should fallback description to enum value description when directive description is missing', async () => {
      // arrange
      const schemaWithEnumMeta = `
        directive @enumMeta(
          display: String
          shortDisplay: String
          description: String
          sortOrder: Int
        ) on ENUM_VALUE

        enum ClaimStatus {
          """Needs manual review"""
          IN_REVIEW @enumMeta(display: "In Review")
        }
      `;

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'inReview': { display: 'In Review', description: 'Needs manual review' } } as const;",
      );
    });

    it('should ignore unrelated directives on enum values', async () => {
      // arrange
      const schemaWithOtherDirective = `
        directive @customFlag(enabled: Boolean) on ENUM_VALUE

        enum ClaimStatus {
          OPEN @customFlag(enabled: true)
        }
      `;

      // act
      const normalized = await generateFromSchemaText(schemaWithOtherDirective);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = ['open'] as const;",
      );
    });

    it('should handle mixed metadata across multiple enum values', async () => {
      // arrange
      const schemaWithMixedEnumMeta = `
        directive @enumMeta(
          display: String
          shortDisplay: String
          description: String
          sortOrder: Int
        ) on ENUM_VALUE

        enum ClaimStatus {
          OPEN @enumMeta(display: "Open")
          """Review queue"""
          IN_REVIEW @enumMeta(shortDisplay: "Review")
          CLOSED
          ARCHIVED @enumMeta(sortOrder: "bad")
        }
      `;

      // act
      const normalized = await generateFromSchemaText(schemaWithMixedEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'open': { display: 'Open' }, 'inReview': { display: 'Review queue', shortDisplay: 'Review', description: 'Review queue' }, 'closed': { display: 'Closed' }, 'archived': { display: 'Archived' } } as const;",
      );
    });
  });

  describe('When config is invalid', () => {
    it('should fail with a clear error for invalid enumClassSuffix type', () => {
      // arrange — deliberate wrong shape to assert validateConfig()
      const invalidConfig = {
        enumClassSuffix: true,
      } as unknown as SmartEnumPluginConfig;
      const callPlugin = () => plugin(schema, [], invalidConfig);

      // act + assert
      expect(callPlugin).toThrowError(
        /Config `enumClassSuffix` must be a string/,
      );
    });
  });

  describe('When enum value camelCase names collide', () => {
    it('should fail generation with a collision error', () => {
      // arrange
      const collisionSchema = buildSchema(`
        enum CollisionEnum {
          FOO_BAR
          fooBar
        }
      `);

      const callPlugin = () => plugin(collisionSchema, [], {});

      // act + assert
      expect(callPlugin).toThrowError(
        /CamelCase collision in enum "CollisionEnum"/,
      );
    });
  });
});
