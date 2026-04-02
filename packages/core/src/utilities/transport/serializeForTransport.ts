import { serializeSmartEnums } from '../transformation.js';
import type { SerializedSmartEnums } from '../../types.js';

/**
 * Serializes smart enums for transport (to client or API).
 * Wire payloads include `__smart_enum_type` for `reviveAfterTransport`.
 */
export const serializeForTransport = <T>(payload: T): SerializedSmartEnums<T> =>
  serializeSmartEnums(payload);
