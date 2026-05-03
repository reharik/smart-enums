import { describe, expect, it } from 'vitest';
import { buildSchema } from 'graphql';

import type { TypePoliciesPluginConfig } from '../src/index.js';
import { plugin } from '../src/index.js';

const standardEnumSchema = `
enum PaymentStatus { PENDING, PAID, VOIDED }
enum SortDirection { ASC, DESC }
enum Unused { A, B }

type Order {
  id: ID!
  status: PaymentStatus!
  direction: SortDirection
  total: Float!
}

type Customer {
  id: ID!
  name: String!
  preferredSort: SortDirection!
}
`;

const normalizeOutput = async (
  output: ReturnType<typeof plugin>,
): Promise<string> => {
  const resolved = await output;
  return typeof resolved === 'string' ? resolved : resolved.content;
};

const baseConfig = {
  enumImportPath: './graphql-smart-enums',
} satisfies TypePoliciesPluginConfig;

describe('typePoliciesPlugin', () => {
  describe('When a schema has a single object type with one enum field', () => {
    it('should emit import, smartEnumTypePolicies, and a read resolver for that field', async () => {
      const schema = buildSchema(`
        enum Role { ADMIN, USER }
        type User { id: ID!, role: Role! }
      `);

      const output = await normalizeOutput(plugin(schema, [], baseConfig));

      expect(output).toContain("import { Role } from './graphql-smart-enums';");
      expect(output).toContain('export const smartEnumTypePolicies = {');
      expect(output).toContain('User: {');
      expect(output).toContain('role: {');
      expect(output).toContain('read(existing: string) {');
      expect(output).toContain(
        'return existing ? Role.fromValue(existing) : existing;',
      );
    });
  });

  describe('When a schema has multiple object types with multiple enum fields', () => {
    it('should include all types and fields sorted alphabetically', async () => {
      const schema = buildSchema(standardEnumSchema);
      const output = await normalizeOutput(plugin(schema, [], baseConfig));

      expect(output).toContain('Customer: {');
      expect(output).toContain('Order: {');
      const customerIdx = output.indexOf('Customer: {');
      const orderIdx = output.indexOf('Order: {');
      expect(customerIdx).toBeLessThan(orderIdx);

      expect(output.indexOf('direction:')).toBeLessThan(
        output.indexOf('status:'),
      );
    });
  });

  describe('When enum fields use NonNull and List wrappers', () => {
    it('should treat PaymentStatus!, PaymentStatus, list variants as PaymentStatus', async () => {
      const schema = buildSchema(`
        enum PaymentStatus { PENDING }
        type Row {
          a: PaymentStatus!
          b: PaymentStatus
          c: [PaymentStatus]
          d: [PaymentStatus!]!
        }
      `);
      const output = await normalizeOutput(plugin(schema, [], baseConfig));

      expect(output).toContain('a: {');
      expect(output).toContain('b: {');
      expect(output).toContain('c: {');
      expect(output).toContain('d: {');
      const fromValueCalls = output.match(/PaymentStatus\.fromValue/g);
      expect(fromValueCalls?.length).toBe(4);
    });
  });

  describe('When object types have only non-enum fields', () => {
    it('should omit scalar, ID, and nested object fields from type policies', async () => {
      const schema = buildSchema(`
        enum PaymentStatus { X }
        type Other { id: ID! }
        type T {
          s: String
          i: Int
          id: ID!
          o: Other
          e: PaymentStatus
        }
      `);
      const output = await normalizeOutput(plugin(schema, [], baseConfig));

      expect(output).toContain('e: {');
      const readCount = output.split('read(existing: string)').length - 1;
      expect(readCount).toBe(1);
    });
  });

  describe('When the schema includes introspection object types', () => {
    it('should not emit entries for types named with __ prefix', async () => {
      const schema = buildSchema(standardEnumSchema);
      const output = await normalizeOutput(plugin(schema, [], baseConfig));

      expect(output).not.toContain('__Schema:');
      expect(output).not.toContain('__Type:');
    });
  });

  describe('When no object type has enum fields', () => {
    it('should return an empty string', async () => {
      const schema = buildSchema(`
        type Empty { name: String! }
      `);
      const output = await normalizeOutput(plugin(schema, [], baseConfig));
      expect(output).toBe('');
    });
  });

  describe('When skipEnums excludes an enum type', () => {
    it('should drop fields of that enum and omit types with no enum fields left', async () => {
      const schema = buildSchema(`
        enum PaymentStatus { PENDING }
        enum SortDirection { ASC }
        type OnlyPayment { status: PaymentStatus! }
        type Mixed { direction: SortDirection!, status: PaymentStatus! }
      `);
      const output = await normalizeOutput(
        plugin(schema, [], {
          enumImportPath: './enums',
          skipEnums: ['PaymentStatus'],
        }),
      );

      expect(output).not.toContain('OnlyPayment:');
      expect(output).toContain('Mixed:');
      expect(output).toContain('direction:');
      expect(output).not.toContain('status:');
      expect(output).not.toContain('PaymentStatus');
    });
  });

  describe('When enumClassSuffix is set', () => {
    it('should import and call suffixed enum class names', async () => {
      const schema = buildSchema(`
        enum PaymentStatus { PENDING }
        type T { status: PaymentStatus! }
      `);
      const output = await normalizeOutput(
        plugin(schema, [], {
          enumImportPath: './enums',
          enumClassSuffix: 'Enum',
        }),
      );

      expect(output).toContain("import { PaymentStatusEnum } from './enums';");
      expect(output).toContain(
        'return existing ? PaymentStatusEnum.fromValue(existing) : existing;',
      );
    });
  });

  describe('When enumImportPath is missing or empty', () => {
    it('should throw TypeError with the type-policies prefix', () => {
      const schema = buildSchema(`
        enum E { A }
        type T { e: E }
      `);

      expect(() =>
        plugin(schema, [], {} as unknown as TypePoliciesPluginConfig),
      ).toThrow(TypeError);
      expect(() =>
        plugin(schema, [], {} as unknown as TypePoliciesPluginConfig),
      ).toThrow(/\[graphql-codegen-smart-enum-type-policies\]/);

      expect(() =>
        plugin(schema, [], {
          enumImportPath: '',
        } as TypePoliciesPluginConfig),
      ).toThrow(TypeError);
      expect(() =>
        plugin(schema, [], {
          enumImportPath: '',
        } as TypePoliciesPluginConfig),
      ).toThrow(/\[graphql-codegen-smart-enum-type-policies\]/);
    });
  });

  describe('When the schema defines unused enums', () => {
    it('should import only enums referenced on object fields', async () => {
      const schema = buildSchema(standardEnumSchema);
      const output = await normalizeOutput(plugin(schema, [], baseConfig));

      expect(output).toContain('PaymentStatus');
      expect(output).toContain('SortDirection');
      expect(output).not.toContain('Unused');
    });
  });
});
