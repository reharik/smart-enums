/**
 * Smart Enums with Transport Utilities
 *
 * This entry point includes the core enumeration functionality plus utilities
 * for serializing/reviving enums for API transport (JSON over the wire).
 *
 * @example
 * ```typescript
 * import { enumeration, serializeForTransport, reviveAfterTransport } from 'smart-enums/transport';
 * ```
 */

// Re-export core functionality
export { enumeration, isSmartEnumItem, isSmartEnum } from './enumeration.js';
export {
  serializeSmartEnums,
  reviveSmartEnums,
} from './utilities/transformation.js';
export {
  reviveAfterTransport,
  serializeForTransport,
} from './utilities/transport/index.js';

// Re-export core types plus transport-specific types
export type {
  Enumeration,
  DropdownOption,
  EnumItem,
  BaseEnum,
  EnumItemType,
  AnyEnumLike,
} from './types.js';
