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

/** SDL fragment: `EnumMetaProp` input + `@enumMeta` with `props` list (optional in schema). */
const enumMetaDirectiveSchema = (enumBody: string): string => `
input EnumMetaProp {
  name: String!
  value: String!
}

directive @enumMeta(
  display: String
  shortDisplay: String
  description: String
  sortOrder: Int
  props: [EnumMetaProp!]
) on ENUM_VALUE

${enumBody}
`;

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
      const schemaWithEnumMeta = enumMetaDirectiveSchema(`
        enum ClaimStatus {
          OPEN @enumMeta(display: "Open")
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'open': { display: 'Open' } } as const;",
      );
    });

    it('should emit full enumMeta payload fields', async () => {
      // arrange
      const schemaWithEnumMeta = enumMetaDirectiveSchema(`
        enum ClaimStatus {
          IN_REVIEW @enumMeta(
            display: "In Review"
            shortDisplay: "Review"
            description: "Waiting for adjudication"
            sortOrder: 2
          )
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'inReview': { display: 'In Review', shortDisplay: 'Review', description: 'Waiting for adjudication', sortOrder: 2 } } as const;",
      );
    });

    it('should fallback display to derived value when metadata and description are missing', async () => {
      // arrange
      const schemaWithEnumMeta = enumMetaDirectiveSchema(`
        enum ClaimStatus {
          IN_REVIEW @enumMeta(sortOrder: 3)
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaWithEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'inReview': { display: 'In Review', sortOrder: 3 } } as const;",
      );
    });

    it('should fallback description to enum value description when directive description is missing', async () => {
      // arrange
      const schemaWithEnumMeta = enumMetaDirectiveSchema(`
        enum ClaimStatus {
          """Needs manual review"""
          IN_REVIEW @enumMeta(display: "In Review")
        }
      `);

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
      const schemaWithMixedEnumMeta = enumMetaDirectiveSchema(`
        enum ClaimStatus {
          OPEN @enumMeta(display: "Open")
          """Review queue"""
          IN_REVIEW @enumMeta(shortDisplay: "Review")
          CLOSED
          ARCHIVED @enumMeta(sortOrder: "bad")
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaWithMixedEnumMeta);

      // assert
      expect(normalized).toContain(
        "const claimStatusInput = { 'open': { display: 'Open' }, 'inReview': { display: 'Review queue', shortDisplay: 'Review', description: 'Review queue' }, 'closed': { display: 'Closed' }, 'archived': { display: 'Archived' } } as const;",
      );
    });

    it('should emit enumMeta props as extra item fields', async () => {
      // arrange
      const schemaWithProps = enumMetaDirectiveSchema(`
        enum RowKind {
          PERSON @enumMeta(
            display: "Person"
            props: [
              { name: "column", value: "person_id" }
              { name: "locale", value: "en-US" }
            ]
          )
          ORG @enumMeta(
            display: "Organization"
            props: [{ name: "column", value: "org_id" }]
          )
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaWithProps);

      // assert
      expect(normalized).toContain("column: 'person_id'");
      expect(normalized).toContain("locale: 'en-US'");
      expect(normalized).toContain("column: 'org_id'");
    });

    it('should omit display when enumMeta only defines props', async () => {
      // arrange
      const schemaPropsOnly = enumMetaDirectiveSchema(`
        enum AlbumSortBy {
          CREATED_AT @enumMeta(
            props: [{ name: "column", value: "created_at" }]
          )
          TITLE @enumMeta(props: [{ name: "column", value: "title" }])
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaPropsOnly);

      // assert
      expect(normalized).toContain(
        "const albumSortByInput = { 'createdAt': { column: 'created_at' }, 'title': { column: 'title' } } as const;",
      );
      expect(normalized).not.toContain("display: 'Created At'");
    });

    it('should use bracket keys for props names that are not valid identifiers', async () => {
      // arrange
      const schemaWeirdKey = enumMetaDirectiveSchema(`
        enum E {
          A @enumMeta(props: [{ name: "weird-key", value: "1" }])
        }
      `);

      // act
      const normalized = await generateFromSchemaText(schemaWeirdKey);

      // assert
      expect(normalized).toContain('["weird-key"]: \'1\'');
    });

    it('should fail when props repeats the same name', () => {
      // arrange
      const badSchema = enumMetaDirectiveSchema(`
        enum E {
          A @enumMeta(props: [
            { name: "x", value: "1" }
            { name: "x", value: "2" }
          ])
        }
      `);

      // act
      const run = () => plugin(buildSchema(badSchema), [], {});

      // assert
      expect(run).toThrowError(/Duplicate enumMeta props name "x"/);
    });

    it('should fail when props uses a reserved name', () => {
      // arrange
      const badSchema = enumMetaDirectiveSchema(`
        enum E {
          A @enumMeta(props: [{ name: "display", value: "oops" }])
        }
      `);

      // act
      const run = () => plugin(buildSchema(badSchema), [], {});

      // assert
      expect(run).toThrowError(/enumMeta props name "display" is reserved/);
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
  describe('When config is invalid', () => {
    it('should fail with a clear error for invalid enumClassSuffix type', () => {
      // arrange
      const invalidConfig = JSON.parse('{"enumClassSuffix":true}');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const callPlugin = () => plugin(schema, [], invalidConfig);

      // act + assert
      expect(callPlugin).toThrowError(
        /Config `enumClassSuffix` must be a string/,
      );
    });

    it('should fail with a clear error when skipEnums is not an array', () => {
      // arrange
      const invalidConfig = JSON.parse('{"skipEnums":"PaymentStatus"}');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const callPlugin = () => plugin(schema, [], invalidConfig);

      // act + assert
      expect(callPlugin).toThrowError(
        /Config `skipEnums` must be an array of strings/,
      );
    });

    it('should fail with a clear error when skipEnums contains a non-string', () => {
      // arrange
      const invalidConfig = JSON.parse('{"skipEnums":["PaymentStatus",1]}');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const callPlugin = () => plugin(schema, [], invalidConfig);

      // act + assert
      expect(callPlugin).toThrowError(
        /Config `skipEnums` must contain only string/,
      );
    });
  });

  describe('When skipEnums lists schema enums', () => {
    it('should omit listed enums from generated output', async () => {
      // arrange
      const output = plugin(schema, [], {
        skipEnums: ['PaymentStatus'],
      });

      // act
      const normalized = await normalizeOutput(output);

      // assert
      expect(normalized).not.toContain('PaymentStatus');
      expect(normalized).not.toContain('paymentStatusInput');
      expect(normalized).toContain('const sortDirectionInput');
    });

    it('should return empty output when all enums are skipped', async () => {
      // arrange
      const output = plugin(schema, [], {
        skipEnums: ['PaymentStatus', 'SortDirection', 'OrderType'],
      });

      // act
      const normalized = await normalizeOutput(output);

      // assert
      expect(normalized).toBe('');
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
  describe('enumRegistry barrel export', () => {
    it('should emit a registry containing every generated enum', async () => {
      const schema = buildSchema(`
        enum Status { ACTIVE, INACTIVE }
        enum Priority { LOW, HIGH }
      `);

      const output = await plugin(schema, [], {});

      expect(output).toContain(
        'export const enumRegistry = { Priority, Status } as const;',
      );
    });

    it('should apply enumClassSuffix to registry entries', async () => {
      const schema = buildSchema(`
        enum Status { ACTIVE }
        enum Priority { LOW }
      `);

      const output = await plugin(schema, [], { enumClassSuffix: 'Enum' });

      expect(output).toContain(
        'export const enumRegistry = { Priority: PriorityEnum, Status: StatusEnum } as const;',
      );
    });

    it('should respect skipEnums in the registry', async () => {
      const schema = buildSchema(`
        enum Status { ACTIVE }
        enum Internal { A }
      `);

      const output = await plugin(schema, [], { skipEnums: ['Internal'] });

      expect(output).toContain(
        'export const enumRegistry = { Status } as const;',
      );
      expect(output).not.toContain('Internal');
    });

    it('should omit the registry export when no enums are emitted', async () => {
      const schema = buildSchema(`
        type Query { hello: String }
      `);

      const output = await plugin(schema, [], {});

      expect(output).not.toContain('enumRegistry');
    });
  });

  describe('serializeAs config', () => {
    it("should emit serializeAs: 'value' when configured", async () => {
      const schema = buildSchema(`enum Status { ACTIVE }`);

      const output = await plugin(schema, [], { serializeAs: 'value' });

      expect(output).toContain("input: statusInput, serializeAs: 'value'");
    });

    it("should emit serializeAs: 'wrapped' when configured", async () => {
      const schema = buildSchema(`enum Status { ACTIVE }`);

      const output = await plugin(schema, [], { serializeAs: 'wrapped' });

      expect(output).toContain("input: statusInput, serializeAs: 'wrapped'");
    });

    it('should not emit serializeAs when not configured', async () => {
      const schema = buildSchema(`enum Status { ACTIVE }`);

      const output = await plugin(schema, [], {});

      expect(output).not.toContain('serializeAs');
      expect(output).toContain('input: statusInput }');
    });

    it('should reject invalid serializeAs values', () => {
      const schema = buildSchema(`enum Status { ACTIVE }`);

      expect(() =>
        plugin(schema, [], { serializeAs: 'bogus' as 'value' }),
      ).toThrow(/serializeAs must be 'value' or 'wrapped'/);
    });
  });

  describe('externalEnums config', () => {
    describe('When externalEnums lists a type (with or without skipEnums)', () => {
      it('should imply skip: emit a definer, not a generated body', async () => {
        const schema = buildSchema(`
          enum Status { OPEN }
          enum CustomEnum { A, B }
        `);

        const output = await normalizeOutput(
          plugin(schema, [], {
            externalEnums: { CustomEnum: '../hand-authored/customEnum' },
          }),
        );

        expect(output).not.toContain('customEnumInput');
        // (the definer's @example mentions the name; only real code lines count)
        expect(output).not.toMatch(/^export const CustomEnum = /m);
        expect(output).toContain('export const defineCustomEnumInput');
      });

      it('should behave identically when the name is also in skipEnums (back-compat)', async () => {
        const schema = buildSchema(`
          enum Status { OPEN }
          enum CustomEnum { A, B }
        `);

        const output = await normalizeOutput(
          plugin(schema, [], {
            skipEnums: ['CustomEnum'],
            externalEnums: { CustomEnum: '../hand-authored/customEnum' },
          }),
        );

        expect(output).not.toMatch(/^export const CustomEnum = /m);
        expect(output).toContain('export const defineCustomEnumInput');
      });
    });

    describe('When externalEnums references a name that is not an enum in the schema', () => {
      it('should throw', () => {
        const schema = buildSchema(`enum Status { OPEN }`);

        expect(() =>
          plugin(schema, [], {
            skipEnums: ['DoesNotExist'],
            externalEnums: { DoesNotExist: '../somewhere' },
          }),
        ).toThrow();
      });
    });
  });

  describe('externalEnums definers in the enums output', () => {
    const definesSchema = buildSchema(`
      enum EntityType { ALBUM AUTHORIZATION COMMENT MEDIA_ITEM REACTION USER }
      enum Status { OPEN, CLOSED }
    `);

    it('should emit exactly the checked-in fixture for an all-external schema', async () => {
      const schema = buildSchema(
        'enum EntityType { ALBUM AUTHORIZATION COMMENT MEDIA_ITEM REACTION USER }',
      );

      const output = await normalizeOutput(
        plugin(schema, [], {
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      const fixture = readFileSync(
        path.resolve(process.cwd(), 'test/fixtures/entityTypeDefines.ts'),
        'utf8',
      );
      expect(output).toBe(fixture);
    });

    it('should emit the key list in schema order with camelCase derivation', async () => {
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      expect(output).toContain(
        [
          'export const entityTypeKeys = [',
          "  'album',",
          "  'authorization',",
          "  'comment',",
          "  'mediaItem',",
          "  'reaction',",
          "  'user',",
          '] as const;',
        ].join('\n'),
      );
      expect(output).toContain(
        'export type EntityTypeKeys = (typeof entityTypeKeys)[number];',
      );
    });

    it('should emit an input definer that pins the input to the schema keys', async () => {
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      expect(output).toContain(
        [
          'export const defineEntityTypeInput = <',
          '  const X extends Record<EntityTypeKeys, Record<string, unknown>>,',
          '>(',
          '  input: Exact<X, EntityTypeKeys>,',
          '): X => input;',
        ].join('\n'),
      );
    });

    it('should emit definers alongside generated enums, without a registry', async () => {
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      // Status is generated as usual...
      expect(output).toContain("export const Status = enumeration");
      // ...EntityType gets a definer instead of a generated body (the
      // definer's @example mentions the name; only real code lines count)...
      expect(output).toContain('export const defineEntityTypeInput');
      expect(output).not.toMatch(/^export const EntityType = /m);
      // ...and the registry moves to the emit: 'enumRegistry' output.
      expect(output).not.toContain('enumRegistry');
    });

    it('should never import user code', async () => {
      // The registry is the only piece that imports hand-authored enums, and
      // it lives in its own emit. User code imports generated enums from this
      // file, and the hand-authored enums' import closures may include that
      // user code — an import back from here would form a load-order-dependent
      // cycle that TDZ-crashes at module evaluation.
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      const realImports = [
        ...output.matchAll(/^import .+ from '([^']+)';$/gm),
      ].map(match => match[1]);
      expect(realImports).toEqual(['@reharik/smart-enum']);
    });

    it('should import nothing at all when every enum is external', async () => {
      // The plain-X return type plus zero imports keeps declaration emit cheap
      // in consuming packages (a generic returning enumeration(...) forces tsc
      // to expand smart-enum's internal conditional types, which OOMs).
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          externalEnums: {
            EntityType: '../consumer/entityType',
            Status: '../consumer/status',
          },
        }),
      );

      const realImports = [
        ...output.matchAll(/^import .+ from '([^']+)';$/gm),
      ].map(match => match[1]);
      expect(realImports).toEqual([]);
    });

    it('should emit the Exact helper once for multiple external enums', async () => {
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          externalEnums: {
            EntityType: '../consumer/entityType',
            Status: '../consumer/status',
          },
        }),
      );

      const exactCount =
        output.split('type Exact<X, K extends string>').length - 1;
      expect(exactCount).toBe(1);
      expect(output).toContain('export const defineEntityTypeInput');
      expect(output).toContain('export const defineStatusInput');
    });

    it('should not emit anything for enums listed only in skipEnums', async () => {
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          skipEnums: ['Status'],
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      expect(output).not.toContain('Status');
    });

    it('should include serializeAs in the emitted usage example', async () => {
      // The definer returns the input, so serializeAs has nowhere to live at
      // runtime — it surfaces in the @example so consumers copy the right
      // enumeration() call for their pipeline.
      const output = await normalizeOutput(
        plugin(definesSchema, [], {
          serializeAs: 'value',
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      expect(output).toContain(" *   serializeAs: 'value',");
    });

    it('should omit serializeAs from the usage example when not configured', async () => {
      const schema = buildSchema(
        'enum EntityType { ALBUM AUTHORIZATION COMMENT MEDIA_ITEM REACTION USER }',
      );
      const output = await normalizeOutput(
        plugin(schema, [], {
          externalEnums: { EntityType: '../consumer/entityType' },
        }),
      );

      expect(output).not.toContain('serializeAs');
    });
  });

  describe('emit: enumRegistry', () => {
    const registrySchema = buildSchema(`
      enum Status { OPEN, CLOSED }
      enum Priority { LOW, HIGH }
      enum CustomEnum { A, B }
    `);

    it('should import generated enums from enumsImportPath and externals from their paths', async () => {
      const output = await normalizeOutput(
        plugin(registrySchema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
          externalEnums: { CustomEnum: '../hand-authored/customEnum' },
        }),
      );

      expect(output).toContain(
        "import { Priority, Status } from './graphqlSmartEnums';",
      );
      expect(output).toContain(
        "import { CustomEnum } from '../hand-authored/customEnum';",
      );
      expect(output).toContain(
        'export const enumRegistry = { CustomEnum, Priority, Status } as const;',
      );
    });

    it('should contain nothing but imports and the registry', async () => {
      const output = await normalizeOutput(
        plugin(registrySchema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
          externalEnums: { CustomEnum: '../hand-authored/customEnum' },
        }),
      );

      expect(output).not.toContain('enumeration(');
      expect(output).not.toContain('defineCustomEnumInput');
      expect(output).not.toContain('export { CustomEnum }');
      expect(output).not.toContain('export const CustomEnum');
    });

    it('should apply enumClassSuffix to generated and external identifiers', async () => {
      const output = await normalizeOutput(
        plugin(registrySchema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
          enumClassSuffix: 'Enum',
          externalEnums: { CustomEnum: '../hand-authored/customEnum' },
        }),
      );

      expect(output).toContain(
        "import { PriorityEnum, StatusEnum } from './graphqlSmartEnums';",
      );
      expect(output).toContain(
        "import { CustomEnumEnum } from '../hand-authored/customEnum';",
      );
      expect(output).toContain(
        'export const enumRegistry = { CustomEnum: CustomEnumEnum, Priority: PriorityEnum, Status: StatusEnum } as const;',
      );
    });

    it('should respect skipEnums', async () => {
      const output = await normalizeOutput(
        plugin(registrySchema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
          skipEnums: ['Priority'],
          externalEnums: { CustomEnum: '../hand-authored/customEnum' },
        }),
      );

      expect(output).not.toContain('Priority');
      expect(output).toContain(
        'export const enumRegistry = { CustomEnum, Status } as const;',
      );
    });

    it('should work without externalEnums (generated-only registry)', async () => {
      const schema = buildSchema('enum Status { OPEN }');

      const output = await normalizeOutput(
        plugin(schema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
        }),
      );

      expect(output).toContain(
        "import { Status } from './graphqlSmartEnums';",
      );
      expect(output).toContain(
        'export const enumRegistry = { Status } as const;',
      );
    });

    it('should omit the generated import when every enum is external', async () => {
      const schema = buildSchema('enum CustomEnum { A }');

      const output = await normalizeOutput(
        plugin(schema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
          externalEnums: { CustomEnum: '../hand-authored/customEnum' },
        }),
      );

      expect(output).not.toContain('./graphqlSmartEnums');
      expect(output).toContain(
        'export const enumRegistry = { CustomEnum } as const;',
      );
    });

    it('should return empty output when there are no enums at all', async () => {
      const schema = buildSchema('type Query { hello: String }');

      const output = await normalizeOutput(
        plugin(schema, [], {
          emit: 'enumRegistry',
          enumsImportPath: './graphqlSmartEnums',
        }),
      );

      expect(output).toBe('');
    });

    it('should require enumsImportPath', () => {
      expect(() =>
        plugin(registrySchema, [], { emit: 'enumRegistry' }),
      ).toThrow(/enumsImportPath is required/);
    });

    it('should reject invalid emit values', () => {
      expect(() =>
        plugin(registrySchema, [], { emit: 'bogus' as 'enums' }),
      ).toThrow(/emit must be 'enums' or 'enumRegistry'/);
    });
  });
});
