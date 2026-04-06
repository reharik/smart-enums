/**
 * Smart Enums — database persistence helpers (`src/db`).
 *
 * Transport wire revival (`initializeSmartEnumMappings`, `reviveAfterTransport`)
 * is exported from `ts-smart-enum/transport` and `ts-smart-enum` root.
 *
 * @example
 * ```typescript
 * import {
 *   enumeration,
 *   prepareForDatabase,
 *   reviveRowFromDatabase,
 * } from 'ts-smart-enum/database';
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
  StandardEnumItemBase as StandardEnumItem,
} from './types.js';
