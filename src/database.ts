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
export { enumeration, isSmartEnumItem } from './enumeration.js';
export {
  prepareForDatabase,
  reviveFromDatabase,
  initializeSmartEnumMappings,
  getGlobalEnumRegistry,
  mergeFieldMappings,
} from './utilities/database/index.js';

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
} from './types.js';
