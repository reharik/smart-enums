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

export { enumeration, isSmartEnumItem } from './enumeration.js';
export {
  serializeSmartEnums,
  reviveSmartEnums,
} from './utilities/transformation.js';
export {
  reviveAfterTransport,
  serializeForTransport,
} from './utilities/transport/index.js';
export {
  prepareForDatabase,
  reviveFromDatabase,
  initializeSmartEnumMappings,
  getGlobalEnumRegistry,
} from './utilities/database/index.js';
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
