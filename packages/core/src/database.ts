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
 *   reviveEnumField,
 *   reviveRowFromDatabase,
 * } from 'ts-smart-enum/database';
 * ```
 */

export { enumeration } from './enumerations.js';
export { isSmartEnumItem, isSmartEnum } from './utilities/typeGuards.js';
export { reviveEnumField } from './utilities/transformation.js';
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
  EnumLikeBase,
  SmartEnumLike,
  FieldEnumMapping,
  ReviveRowOptions,
  PathEnumMapping,
  RevivePayloadOptions,
  StandardEnumItemBase,
  StandardEnumItem,
} from './types.js';
