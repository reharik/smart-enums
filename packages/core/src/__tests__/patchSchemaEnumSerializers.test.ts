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

    patchSchemaEnumSerializers(schema, { Status });

    const statusType = schema.getType('Status');
    if (!isEnumType(statusType)) throw new Error('Expected enum type');

    expect(statusType.serialize(Status.active)).toBe('ACTIVE');
  });

  it('should pass through raw strings unchanged', () => {
    const schema = buildSchema(`
      enum Status { PENDING, ACTIVE }
      type Query { status: Status }
    `);

    patchSchemaEnumSerializers(schema, { Status });

    const statusType = schema.getType('Status');
    if (!isEnumType(statusType)) throw new Error('Expected enum type');

    expect(statusType.serialize('PENDING')).toBe('PENDING');
  });

  it('is idempotent: patching the same schema twice does not double-wrap', () => {
    const schema = buildSchema(`
      enum Status { PENDING, ACTIVE }
      type Query { status: Status }
    `);

    patchSchemaEnumSerializers(schema, { Status });
    // A second patch (e.g. two code paths, or a duplicate copy of the library
    // each patching) previously wrapped parseValue twice: the inner wrapper
    // returned an enum item, the outer called fromValue(<item>) and threw
    // "No enum value found" — an error naming the wrong thing entirely.
    patchSchemaEnumSerializers(schema, { Status });

    const statusType = schema.getType('Status');
    if (!isEnumType(statusType)) throw new Error('Expected enum type');

    expect(statusType.serialize(Status.active)).toBe('ACTIVE');
    expect(statusType.parseValue('ACTIVE')).toBe(Status.active);
  });
});
