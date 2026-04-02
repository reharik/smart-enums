import { reviveSmartEnums } from '../transformation.js';

import { getGlobalEnumRegistry } from './transportRegistry.js';

/**
 * Revives smart enums after transport. Requires `initializeSmartEnumMappings`.
 */
export const reviveAfterTransport = <T>(payload: unknown): T => {
  const registry = getGlobalEnumRegistry();
  if (!registry) {
    return payload as T;
  }
  return reviveSmartEnums(payload, registry);
};
