import { D as DatabaseFormat, A as AnyEnumLike, L as Logger } from './core-t_6xTWCM.js';
export { E as Enumeration, b as LogLevel, S as SmartApiHelperConfig, c as SmartEnumMappingsConfig, e as enumeration, a as isSmartEnum, i as isSmartEnumItem } from './core-t_6xTWCM.js';

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
 * Log levels for smart enum mappings
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
/**
 * Configuration for smart enum mappings initialization
 */
type SmartEnumMappingsConfig = {
    enumRegistry: Record<string, AnyEnumLike>;
    logLevel?: LogLevel;
    logger?: Logger;
};
/**
 * Initializes the global smart enum mapping system. Call once at app startup
 * so that prepareForDatabase, reviveFromDatabase, and transport helpers can
 * learn and use field-to-enum mappings.
 *
 * @param config - enumRegistry (required), optional logLevel and logger
 *
 * @example
 * ```typescript
 * const UserStatus = enumeration('UserStatus', { input: ['active', 'inactive'] as const });
 * const Priority = enumeration('Priority', { input: ['low', 'high'] as const });
 * initializeSmartEnumMappings({
 *   enumRegistry: { UserStatus, Priority },
 *   logLevel: 'debug',
 * });
 * ```
 */
declare function initializeSmartEnumMappings(config: SmartEnumMappingsConfig): void;
/**
 * Returns the current learned field-to-enum-type mapping. Used after
 * prepareForDatabase or serializeForTransport have processed data.
 *
 * @returns Copy of the mapping, e.g. `{ status: ['UserStatus'], priority: ['Priority'] }`
 *
 * @example
 * ```typescript
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 * prepareForDatabase({ user: { status: UserStatus.active } });
 * const mapping = getLearnedMapping(); // { status: ['UserStatus'] }
 * ```
 */
declare function getLearnedMapping(): Record<string, string[]>;
/**
 * Returns the global enum registry set by initializeSmartEnumMappings, or undefined
 * if not initialized. Used internally by reviveFromDatabase and reviveAfterTransport.
 *
 * @returns Registry object (e.g. `{ UserStatus, Priority }`) or undefined
 *
 * @example
 * ```typescript
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 * const registry = getGlobalEnumRegistry(); // { UserStatus, Priority }
 * ```
 */
declare function getGlobalEnumRegistry(): Record<string, AnyEnumLike> | undefined;
/**
 * Merges learned mappings with manual mappings and persists manual mappings to global state.
 * Manual mappings take precedence; learned enum types are added if not already present.
 * Manual mappings are stored in the global singleton for future reviveFromDatabase calls.
 *
 * @param learnedMapping - Current learned mapping (e.g. from getLearnedMapping())
 * @param manualMapping - Optional manual field → enum type names (used as fallback before learning)
 * @returns Merged mapping (manual + learned, deduplicated)
 *
 * @example
 * ```typescript
 * const learned = getLearnedMapping(); // { status: ['UserStatus'] }
 * const merged = mergeFieldMappings(learned, { priority: ['Priority'] });
 * // merged has status and priority; manual 'priority' is now persisted for revival
 * ```
 */
declare function mergeFieldMappings(learnedMapping: Record<string, string[]>, manualMapping?: Record<string, string[]>): Record<string, string[]>;

export { AnyEnumLike, DatabaseFormat, Logger, getGlobalEnumRegistry, getLearnedMapping, initializeSmartEnumMappings, mergeFieldMappings, prepareForDatabase, reviveFromDatabase };
