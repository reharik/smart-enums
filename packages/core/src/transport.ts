/**
 * Smart Enums with Transport Utilities
 *
 * This entry point includes the core enumeration functionality plus utilities
 * for serializing/reviving enums for API transport (JSON over the wire).
 *
 * @example
 * ```typescript
 * import { enumeration, serializeForTransport, reviveAfterTransport } from 'ts-smart-enum/transport';
 * ```
 */

// Re-export core functionality
export { enumeration } from './enumerations.js';
export { isSmartEnumItem, isSmartEnum } from './utilities/typeGuards.js';
export {
  serializeSmartEnums,
  reviveSmartEnums,
  reviveEnumField,
} from './utilities/transformation.js';
export {
  reviveAfterTransport,
  serializeForTransport,
  initializeSmartEnumMappings,
  getGlobalEnumRegistry,
} from './utilities/transport/index.js';

// Re-export core types plus transport-specific types
export type {
  Enumeration,
  AnyEnumLike,
  SerializedSmartEnums,
  RevivedSmartEnums,
  SmartEnumItemSerialized,
  LogLevel,
  SmartEnumMappingsConfig,
  StandardEnumItemBase,
  StandardEnumItem,
} from './types.js';
