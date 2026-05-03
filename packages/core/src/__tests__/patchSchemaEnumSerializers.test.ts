import { buildSchema, isEnumType } from 'graphql';
import { enumeration } from '../index.js';
import { patchSchemaEnumSerializers } from '../utilities/patchSchemaEnumSerializers.js';

const Status = enumeration('Status', {
  input: ['pending', 'active'] as const,
});

describe('patchSchemaEnumSerializers', () => {
  it('should serialize smart-enum items to their value string', () => {
    const schema = buildSchema(`
      enum Status { PENDING, ACTIVE }
      type Query { status: Status }
    `);

    patchSchemaEnumSerializers(schema);

    const statusType = schema.getType('Status');
    if (!isEnumType(statusType)) throw new Error('Expected enum type');

    expect(statusType.serialize(Status.active)).toBe('ACTIVE');
  });

  it('should pass through raw strings unchanged', () => {
    const schema = buildSchema(`
      enum Status { PENDING, ACTIVE }
      type Query { status: Status }
    `);

    patchSchemaEnumSerializers(schema);

    const statusType = schema.getType('Status');
    if (!isEnumType(statusType)) throw new Error('Expected enum type');

    expect(statusType.serialize('PENDING')).toBe('PENDING');
  });
});
