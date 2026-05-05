import { buildSchema, graphql } from 'graphql';

import { enumeration } from '../enumerations.js';
import { patchSchemaEnumSerializers } from '../utilities/patchSchemaEnumSerializers.js';

const Status = enumeration('Status', {
  input: ['pending', 'active'] as const,
});

const Priority = enumeration('Priority', {
  input: ['low', 'high'] as const,
});

describe('patchSchemaEnumSerializers - nested types', () => {
  describe('outbound: serialize on nested object fields', () => {
    it('should serialize enum on a nested object field returned by a resolver', async () => {
      const schema = buildSchema(`
        enum Status { PENDING, ACTIVE }
        type Order { id: ID!, status: Status! }
        type Query { order: Order }
      `);

      patchSchemaEnumSerializers(schema, { Status });

      const rootValue = {
        order: () => ({
          id: '1',
          status: Status.active, // smart-enum item, not string
        }),
      };

      const result = await graphql({
        schema,
        source: '{ order { id status } }',
        rootValue,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        order: { id: '1', status: 'ACTIVE' },
      });
    });

    it('should serialize enum on a deeply nested object field', async () => {
      const schema = buildSchema(`
        enum Status { PENDING, ACTIVE }
        type Item { status: Status! }
        type Order { items: [Item!]! }
        type Query { order: Order }
      `);

      patchSchemaEnumSerializers(schema, { Status });

      const rootValue = {
        order: () => ({
          items: [{ status: Status.pending }, { status: Status.active }],
        }),
      };

      const result = await graphql({
        schema,
        source: '{ order { items { status } } }',
        rootValue,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        order: {
          items: [{ status: 'PENDING' }, { status: 'ACTIVE' }],
        },
      });
    });
  });

  describe('inbound: parseValue on nested input fields', () => {
    it('should parse enum on a nested input object field', async () => {
      const schema = buildSchema(`
        enum Status { PENDING, ACTIVE }
        input OrderInput { name: String!, status: Status! }
        type Query {
          createOrder(input: OrderInput!): String
        }
      `);

      patchSchemaEnumSerializers(schema, { Status });

      let receivedStatus: unknown;

      const rootValue = {
        createOrder: ({ input }: { input: { status: unknown } }) => {
          receivedStatus = input.status;
          return 'ok';
        },
      };

      const result = await graphql({
        schema,
        source: `
          query Test($input: OrderInput!) {
            createOrder(input: $input)
          }
        `,
        rootValue,
        variableValues: {
          input: { name: 'test', status: 'ACTIVE' },
        },
      });

      expect(result.errors).toBeUndefined();
      // If parseValue was called on the nested enum, receivedStatus
      // should be the smart-enum instance, not a raw string.
      expect(receivedStatus).toBe(Status.active);
    });

    it('should parse enum on a deeply nested input field', async () => {
      const schema = buildSchema(`
        enum Status { PENDING, ACTIVE }
        input ItemInput { status: Status! }
        input OrderInput { items: [ItemInput!]! }
        type Query {
          createOrder(input: OrderInput!): String
        }
      `);

      patchSchemaEnumSerializers(schema, { Status });

      let receivedStatuses: unknown[] = [];

      const rootValue = {
        createOrder: ({
          input,
        }: {
          input: { items: { status: unknown }[] };
        }) => {
          receivedStatuses = input.items.map(i => i.status);
          return 'ok';
        },
      };

      const result = await graphql({
        schema,
        source: `
          query Test($input: OrderInput!) {
            createOrder(input: $input)
          }
        `,
        rootValue,
        variableValues: {
          input: {
            items: [{ status: 'PENDING' }, { status: 'ACTIVE' }],
          },
        },
      });

      expect(result.errors).toBeUndefined();
      expect(receivedStatuses).toEqual([Status.pending, Status.active]);
    });
  });

  describe('inbound: parseLiteral on inline enum values', () => {
    it('should parse enum literal in nested input object', async () => {
      const schema = buildSchema(`
        enum Status { PENDING, ACTIVE }
        input OrderInput { status: Status! }
        type Query {
          createOrder(input: OrderInput!): String
        }
      `);

      patchSchemaEnumSerializers(schema, { Status });

      let receivedStatus: unknown;

      const rootValue = {
        createOrder: ({ input }: { input: { status: unknown } }) => {
          receivedStatus = input.status;
          return 'ok';
        },
      };

      const result = await graphql({
        schema,
        // Inline enum value, no variable — this triggers parseLiteral
        source: '{ createOrder(input: { status: ACTIVE }) }',
        rootValue,
      });

      expect(result.errors).toBeUndefined();
      expect(receivedStatus).toBe(Status.active);
    });
  });

  describe('mixed: object containing enum from a non-registered type', () => {
    it('should serialize registered enums and pass through unregistered ones', async () => {
      const schema = buildSchema(`
        enum Status { PENDING, ACTIVE }
        enum Priority { LOW, HIGH }
        type Order { status: Status!, priority: Priority! }
        type Query { order: Order }
      `);

      // Only register Status, not Priority
      patchSchemaEnumSerializers(schema, { Status });

      const rootValue = {
        order: () => ({
          status: Status.active, // smart-enum item — should serialize via patch
          priority: 'HIGH', // raw string — should pass through unchanged
        }),
      };

      const result = await graphql({
        schema,
        source: '{ order { status priority } }',
        rootValue,
      });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({
        order: { status: 'ACTIVE', priority: 'HIGH' },
      });
    });
  });
});
