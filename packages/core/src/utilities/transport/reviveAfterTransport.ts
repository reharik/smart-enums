import { reviveSmartEnums } from '../transformation.js';

import { getGlobalEnumRegistry } from './transportRegistry.js';

/**
 * Revives smart enums after transport. Requires `initializeSmartEnumMappings`.
 *
 * Throws when no registry has been initialized. Returning the payload
 * untouched here (the pre-0.10 behavior) handed back wire shapes
 * (`{ __smart_enum_type, value }`) *typed* as enum members, and the failure
 * surfaced far downstream — nothing can do anything useful with a
 * half-revived payload.
 */
export const reviveAfterTransport = <T>(payload: unknown): T => {
  const registry = getGlobalEnumRegistry();
  if (!registry) {
    throw new Error(
      'reviveAfterTransport: no enum registry has been initialized. ' +
        'Call initializeSmartEnumMappings({ enumRegistry }) once at startup, ' +
        'before any payload is revived.',
    );
  }
  return reviveSmartEnums(payload, registry);
};
