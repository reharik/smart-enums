import { reviveSmartEnums } from '../transformation.js';
import { getGlobalEnumRegistry } from '../database/fieldMappingBuilder.js';

/**
 * Revives smart enums after transport (from client request or API response).
 * Use this when receiving data that contains serialized enums.
 * Uses the global configuration set up with initializeSmartEnumMappings().
 *
 * @param payload - The payload received after transport
 * @returns The payload with enums revived to their proper enum items
 *
 * @example
 * ```typescript
 * // First, initialize the global configuration
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 *
 * // Then revive using global config
 * // Received: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }
 * const revivedPayload = reviveAfterTransport(requestBody);
 * // Result: { user: { status: UserStatus.ACTIVE } }
 * ```
 */
export function reviveAfterTransport<T>(payload: unknown): T {
  const globalEnumRegistry = getGlobalEnumRegistry();

  if (!globalEnumRegistry) {
    // If no global configuration, return as-is
    return payload as T;
  }

  return reviveSmartEnums(payload, globalEnumRegistry);
}
