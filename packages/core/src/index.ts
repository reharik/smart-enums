/**
 * Smart Enums - Full API
 *
 * This is the main entry point that exports all functionality.
 * For better tree-shaking, consider using specific entry points:
 *
 * - `@reharik/smart-enum/core` - Just enumeration and basic types
 * - `@reharik/smart-enum/transport` - Core + serialization/revival for APIs
 * - `@reharik/smart-enum/database` - Core + database utilities
 *
 * @example
 * ```typescript
 * // Full API (current usage)
 * import { enumeration, serializeSmartEnums } from '@reharik/smart-enum';
 *
 * // Tree-shaking friendly (recommended)
 * import { enumeration } from '@reharik/smart-enum/core';
 * import { serializeSmartEnums } from '@reharik/smart-enum/transport';
 * ```
 */

export { isSmartEnumItem, isSmartEnum } from './utilities/typeGuards.js';
export { getSubsetByProp, subsetByProp } from './utilities/getSubsetByProp.js';
export { enumeration } from './enumerations.js';
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
  EnumLikeBase,
  SmartEnumLike,
  FieldEnumMapping,
  ReviveRowOptions,
  PathEnumMapping,
  RevivePayloadOptions,
  StandardEnumItemBase,
  StandardEnumItem,
} from './types.js';
