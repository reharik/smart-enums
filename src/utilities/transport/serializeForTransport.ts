import { serializeSmartEnums } from '../transformation.js';
import { learnFromData } from '../database/fieldMappingBuilder.js';
import type { SerializedSmartEnums } from '../../types.js';

/**
 * Serializes smart enums for transport (to client or API).
 * Use this when sending data that contains enum items.
 * Automatically learns field mappings for future database operations.
 *
 * @param payload - The payload to send via transport
 * @returns The payload with enums serialized for transport
 *
 * @example
 * ```typescript
 * // API has: { user: { status: UserStatus.ACTIVE } }
 * const serializedPayload = serializeForTransport(responseData);
 * // Result: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }
 * // Also learns: { status: ['UserStatus'] } for future database operations
 * ```
 */
export function serializeForTransport<T>(payload: T): SerializedSmartEnums<T> {
  // Learn from the data before serializing
  learnFromData(payload);

  return serializeSmartEnums(payload);
}
