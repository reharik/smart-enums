import { c as DatabaseFormat, A as AnyEnumLike } from './core-D2kChDMb.cjs';
export { B as BaseEnum, D as DropdownOption, a as EnumItem, b as EnumItemType, E as Enumeration, S as SmartApiHelperConfig, e as enumeration, i as isSmartEnumItem } from './core-D2kChDMb.cjs';

/**
 * Converts enum items to their string values for database storage.
 * Use this when saving data to the database where only enum values are stored.
 * Automatically learns field mappings for future database operations.
 *
 * @param payload - The data to save to database
 * @returns The payload with enum items converted to their string values
 *
 * @example
 * ```typescript
 * // API has: { user: { status: UserStatus.ACTIVE } }
 * const dbData = prepareForDatabase(userData);
 * // Result: { user: { status: 'ACTIVE' } }
 * // Also learns: { status: ['UserStatus'] } for future database operations
 * ```
 */
declare function prepareForDatabase<T>(payload: T): DatabaseFormat<T>;

/**
 * Revives enum values from database records.
 * Use this when loading data from the database where enums are stored as string values.
 * Uses the global configuration set up with initializeSmartEnumMappings().
 *
 * @param payload - The data loaded from database
 * @param options - Optional configuration for manual field mappings
 * @returns The payload with string enum values converted back to enum items
 *
 * @example
 * ```typescript
 * // First, initialize the global configuration
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 *
 * // Option 1: Pure learning (uses learned mappings only)
 * const revivedData = reviveFromDatabase(dbRecord);
 *
 * // Option 2: Manual fallback when no learning has occurred yet
 * const revivedData = reviveFromDatabase(dbRecord, {
 *   fieldEnumMapping: {
 *     status: ['UserStatus', 'OrderStatus'],
 *     priority: ['Priority'],
 *   }
 * });
 *
 * // Option 3: Hybrid - manual mappings + learning (manual takes precedence)
 * // Manual mappings work immediately, learning improves over time
 * ```
 */
declare function reviveFromDatabase<T>(payload: unknown, options?: {
    fieldEnumMapping?: Record<string, string[]>;
}): T;

/**
 * Initializes the global smart enum mapping system
 */
declare function initializeSmartEnumMappings(config: {
    enumRegistry: Record<string, AnyEnumLike>;
}): void;
/**
 * Gets the learned mapping from the global field mapping system
 */
declare function getLearnedMapping(): Record<string, string[]>;
/**
 * Gets the global enum registry
 */
declare function getGlobalEnumRegistry(): Record<string, AnyEnumLike> | undefined;
/**
 * Merges learned mappings with manual mappings and persists manual mappings to global state.
 * Manual mappings take precedence, but learned enum types are added if not already present.
 * Manual mappings are added to the global singleton so they persist across calls.
 */
declare function mergeFieldMappings(learnedMapping: Record<string, string[]>, manualMapping?: Record<string, string[]>): Record<string, string[]>;

export { AnyEnumLike, DatabaseFormat, getGlobalEnumRegistry, getLearnedMapping, initializeSmartEnumMappings, mergeFieldMappings, prepareForDatabase, reviveFromDatabase };
