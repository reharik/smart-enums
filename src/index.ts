/**
 * Smart Enums - Full API
 *
 * This is the main entry point that exports all functionality.
 * For better tree-shaking, consider using specific entry points:
 *
 * - `smart-enums/core` - Just enumeration and basic types
 * - `smart-enums/transport` - Core + serialization/revival for APIs
 * - `smart-enums/database` - Core + database utilities
 *
 * @example
 * ```typescript
 * // Full API (current usage)
 * import { enumeration, serializeSmartEnums } from 'smart-enums';
 *
 * // Tree-shaking friendly (recommended)
 * import { enumeration } from 'smart-enums/core';
 * import { serializeSmartEnums } from 'smart-enums/transport';
 * ```
 */

export { isSmartEnumItem, isSmartEnum } from './utilities/typeGuards.js';
export { enumeration } from './enumerations.js';
export {
  serializeSmartEnums,
  reviveSmartEnums,
} from './utilities/transformation.js';
export {
  reviveAfterTransport,
  serializeForTransport,
  initializeSmartEnumMappings,
  getGlobalEnumRegistry,
} from './utilities/transport/index.js';
export {
  prepareForDatabase,
  reviveRowFromDatabase,
  revivePayloadFromDatabase,
  EnumRevivalError,
} from './db/index.js';
// Logger functions are internal-only, not exposed publicly
export type { Logger } from './utilities/logger.js';
export type {
  Enumeration,
  AnyEnumLike,
  DatabaseFormat,
  SmartApiHelperConfig,
  LogLevel,
  SmartEnumMappingsConfig,
  SerializedSmartEnums,
  RevivedSmartEnums,
  SmartEnumItemSerialized,
  SmartEnumLike,
  FieldEnumMapping,
  ReviveRowOptions,
  PathEnumMapping,
  RevivePayloadOptions,
} from './types.js';
