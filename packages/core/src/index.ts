/**
 * Smart Enums - Full API
 *
 * This is the main entry point that exports all functionality.
 * For better tree-shaking, consider using specific entry points:
 *
 * - `ts-smart-enum/core` - Just enumeration and basic types
 * - `ts-smart-enum/transport` - Core + serialization/revival for APIs
 * - `ts-smart-enum/database` - Core + database utilities
 *
 * @example
 * ```typescript
 * // Full API (current usage)
 * import { enumeration, serializeSmartEnums } from 'ts-smart-enum';
 *
 * // Tree-shaking friendly (recommended)
 * import { enumeration } from 'ts-smart-enum/core';
 * import { serializeSmartEnums } from 'ts-smart-enum/transport';
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
  StandardEnumItemBase as StandardEnumItem,
} from './types.js';
