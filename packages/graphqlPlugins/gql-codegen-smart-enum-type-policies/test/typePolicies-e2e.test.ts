import { describe, expect, it } from 'vitest';
import { buildSchema } from 'graphql';
import { enumeration } from '@reharik/smart-enum';

import { plugin } from '../src/index.js';

/**
 * Builds a schema with object types that reference enums,
 * runs the plugin, and returns the raw output string.
 */
const runPlugin = async (
  schemaText: string,
  config: Record<string, unknown> = {},
): Promise<string> => {
  const schema = buildSchema(schemaText);
  const output = plugin(schema, [], {
    enumImportPath: './graphql-smart-enums',
    ...config,
  });
  const resolved = await output;
  return typeof resolved === 'string' ? resolved : resolved.content;
};

const testSchema = `
  enum PaymentStatus {
    PENDING
    PAID
    VOIDED
  }

  enum SortDirection {
    ASC
    DESC
  }

  enum Unused {
    A
    B
  }

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

/**
 * Create real smart-enum instances matching the test schema enums.
 * These are what the generated code would import at runtime.
 */
const PaymentStatus = enumeration('PaymentStatus', {
  input: ['pending', 'paid', 'voided'] as const,
});

const SortDirection = enumeration('SortDirection', {
  input: ['asc', 'desc'] as const,
});

/**
 * Takes the plugin output, strips the import line (we provide the enums
 * directly), wraps it so `smartEnumTypePolicies` is returned, and evaluates it.
 */
const evaluateOutput = (output: string): Record<string, unknown> => {
  // Remove the import statement — we inject the enums via Function args
  const withoutImport = output.replace(
    /^import\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?\s*$/m,
    '',
  );

  // Remove `export` so the const is just a local binding
  const withoutExport = withoutImport.replace(
    /export\s+const\s+smartEnumTypePolicies/,
    'const smartEnumTypePolicies',
  );

  // `new Function` parses JS only — strip TS parameter types from generated read()
  const jsLike = withoutExport.replaceAll(/: string\b/g, '');

  // Build a function that has the enums in scope and returns the policies object
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- test harness evaluates generated plugin output safely
  const fn = new Function(
    'PaymentStatus',
    'SortDirection',
    `${jsLike}\nreturn smartEnumTypePolicies;`,
  );

  return fn(PaymentStatus, SortDirection);
};

describe('typePolicies plugin end-to-end', () => {
  describe('When evaluating generated output for a schema with Order and Customer types', () => {
    it('should generate code that produces a valid typePolicies object', async () => {
      const output = await runPlugin(testSchema);
      const policies = evaluateOutput(output) as Record<
        string,
        { fields: Record<string, { read: (v: string) => unknown }> }
      >;

      expect(policies).toHaveProperty('Customer');
      expect(policies).toHaveProperty('Order');

      expect(policies).not.toHaveProperty('Query');
    });

    it('should generate read functions that return real smart-enum instances', async () => {
      const output = await runPlugin(testSchema);
      const policies = evaluateOutput(output) as Record<
        string,
        { fields: Record<string, { read: (v: string) => unknown }> }
      >;

      const readStatus = policies.Order.fields.status.read;
      const result = readStatus('PAID');
      expect(result).toBe(PaymentStatus.paid);
      expect((result as { key: string }).key).toBe('paid');
      expect((result as { value: string }).value).toBe('PAID');
      expect((result as { display: string }).display).toBe('Paid');

      const readDirection = policies.Order.fields.direction.read;
      expect(readDirection('ASC')).toBe(SortDirection.asc);

      const readPreferred = policies.Customer.fields.preferredSort.read;
      expect(readPreferred('DESC')).toBe(SortDirection.desc);
    });

    it('should not include non-enum fields in the generated policies', async () => {
      const output = await runPlugin(testSchema);
      const policies = evaluateOutput(output) as Record<
        string,
        { fields: Record<string, unknown> }
      >;

      expect(policies.Order.fields).not.toHaveProperty('id');
      expect(policies.Order.fields).not.toHaveProperty('total');

      expect(policies.Customer.fields).not.toHaveProperty('id');
      expect(policies.Customer.fields).not.toHaveProperty('name');
    });

    it('should only import enums that are actually referenced on object types', async () => {
      const output = await runPlugin(testSchema);

      expect(output).toMatch(/import\s+\{[^}]*PaymentStatus[^}]*\}/);
      expect(output).toMatch(/import\s+\{[^}]*SortDirection[^}]*\}/);

      expect(output).not.toContain('Unused');
    });
  });

  describe('When read resolvers receive falsy cache values', () => {
    it('should pass through null, undefined, and empty string without throwing', async () => {
      const output = await runPlugin(testSchema);
      const policies = evaluateOutput(output) as Record<
        string,
        { fields: Record<string, { read: (v: unknown) => unknown }> }
      >;

      const readStatus = policies.Order.fields.status.read;

      expect(readStatus(null)).toBeNull(); // eslint-disable-line unicorn/no-null -- verifying cache miss null pass-through
      expect(readStatus(void 0)).toBeUndefined();
      expect(readStatus('')).toBe('');
    });
  });

  describe('When skipEnums excludes SortDirection', () => {
    it('should omit excluded fields and types while keeping remaining reads working', async () => {
      const output = await runPlugin(testSchema, {
        skipEnums: ['SortDirection'],
      });
      const policies = evaluateOutput(output) as Record<
        string,
        { fields: Record<string, { read: (v: string) => unknown }> }
      >;

      expect(policies.Order.fields).toHaveProperty('status');
      expect(policies.Order.fields).not.toHaveProperty('direction');

      expect(policies).not.toHaveProperty('Customer');

      expect(policies.Order.fields.status.read('VOIDED')).toBe(
        PaymentStatus.voided,
      );
    });
  });

  describe('When enumClassSuffix is set', () => {
    it('should use suffixed names in imports and fromValue calls', async () => {
      const output = await runPlugin(testSchema, {
        enumClassSuffix: 'Enum',
      });

      expect(output).toContain('PaymentStatusEnum');
      expect(output).toContain('SortDirectionEnum');

      expect(output).toContain('PaymentStatusEnum.fromValue');
      expect(output).toContain('SortDirectionEnum.fromValue');

      expect(output).not.toContain('UnusedEnum');
      expect(output).not.toContain("'Unused'");
    });
  });

  describe('When object types have enum fields behind NonNull and List wrappers', () => {
    it('should emit read policies for each wrapped enum field', async () => {
      const wrappedSchema = `
      enum Status { ACTIVE, INACTIVE }

      type Thing {
        required: Status!
        list: [Status]
        requiredList: [Status!]!
      }
    `;

      const output = await runPlugin(wrappedSchema);

      expect(output).toContain('required:');
      expect(output).toContain('list:');
      expect(output).toContain('requiredList:');
    });
  });

  describe('When no object type has enum fields', () => {
    it('should return an empty string', async () => {
      const noEnumFieldsSchema = `
      enum Status { ACTIVE }
      type Thing { id: ID!, name: String! }
    `;

      const output = await runPlugin(noEnumFieldsSchema);
      expect(output).toBe('');
    });
  });
});
