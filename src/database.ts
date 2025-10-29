/**
 * Smart Enums with Database Utilities
 *
 * This entry point includes the core enumeration functionality plus utilities
 * for preparing data for database storage and reviving from database records.
 *
 * @example
 * ```typescript
 * import { enumeration, prepareForDatabase, reviveFromDatabase } from 'smart-enums/database';
 * ```
 */

// Re-export core functionality
export { enumeration, isSmartEnumItem, isSmartEnum } from './enumeration.js';
export {
  prepareForDatabase,
  reviveFromDatabase,
  initializeSmartEnumMappings,
  getGlobalEnumRegistry,
  getLearnedMapping,
  mergeFieldMappings,
} from './utilities/database/index.js';
// Logger functions are internal-only, not exposed publicly
export type { Logger } from './utilities/logger.js';

// Re-export core types plus database-specific types
export type {
  Enumeration,
  DropdownOption,
  EnumItem,
  BaseEnum,
  EnumItemType,
  AnyEnumLike,
  DatabaseFormat,
  SmartApiHelperConfig,
  LogLevel,
  SmartEnumMappingsConfig,
} from './types.js';
