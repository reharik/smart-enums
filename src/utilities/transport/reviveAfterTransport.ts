import { reviveSmartEnums } from '../transformation.js';
import type { SmartApiHelperConfig } from '../../types.js';

/**
 * Revives smart enums after transport (from client request or API response).
 * Use this when receiving data that contains serialized enums.
 *
 * @param payload - The payload received after transport
 * @param config - Configuration containing enum registry
 * @returns The payload with enums revived to their proper enum items
 *
 * @example
 * ```typescript
 * // Received: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }
 * const revivedPayload = reviveAfterTransport(requestBody, { enumRegistry: { UserStatus } });
 * // Result: { user: { status: UserStatus.ACTIVE } }
 * ```
 */
export function reviveAfterTransport<T>(
  payload: unknown,
  config: SmartApiHelperConfig,
): T {
  return reviveSmartEnums(payload, config.enumRegistry);
}
