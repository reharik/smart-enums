/**
 * Core Smart Enums functionality
 *
 * This is the minimal entry point containing only the essential enumeration
 * functionality. Import this for tree-shaking when you only need basic enums.
 *
 * @example
 * ```typescript
 * import { enumeration, isSmartEnumItem, isSmartEnum } from 'smart-enums/core';
 * ```
 */

export { enumeration } from './enumerations.js';
export { isSmartEnumItem, isSmartEnum } from './utilities/typeGuards.js';
export type { Enumeration, AnyEnumLike } from './types.js';
