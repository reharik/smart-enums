/**
 * Smart Enums — database persistence helpers (`src/db`).
 *
 * Transport wire revival (`initializeSmartEnumMappings`, `reviveAfterTransport`)
 * is exported from `smart-enums/transport` and `smart-enums` root.
 *
 * @example
 * ```typescript
 * import {
 *   enumeration,
 *   prepareForDatabase,
 *   reviveRowFromDatabase,
 * } from 'smart-enums/database';
 * ```
 */

export { enumeration } from './enumerations.js';
export { isSmartEnumItem, isSmartEnum } from './utilities/typeGuards.js';
export {
  prepareForDatabase,
  reviveRowFromDatabase,
  revivePayloadFromDatabase,
  EnumRevivalError,
} from './db/index.js';
export type { Logger } from './utilities/logger.js';
export type {
  Enumeration,
  AnyEnumLike,
  DatabaseFormat,
  SmartApiHelperConfig,
  LogLevel,
  SmartEnumMappingsConfig,
  SmartEnumLike,
  FieldEnumMapping,
  ReviveRowOptions,
  PathEnumMapping,
  RevivePayloadOptions,
} from './types.js';
