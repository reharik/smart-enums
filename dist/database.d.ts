import { c as DatabaseFormat, S as SmartApiHelperConfig, A as AnyEnumLike } from './core-D2kChDMb.js';
export { B as BaseEnum, D as DropdownOption, a as EnumItem, b as EnumItemType, E as Enumeration, e as enumeration, i as isSmartEnumItem } from './core-D2kChDMb.js';

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
 *
 * @param payload - The data loaded from database
 * @param config - Configuration containing enum registry and field mapping
 * @returns The payload with string enum values converted back to enum items
 *
 * @example
 * ```typescript
 * // Basic usage with manual mapping
 * const revivedData = reviveFromDatabase(dbRecord, {
 *   enumRegistry: { UserStatus },
 *   fieldEnumMapping: { 'user.status': 'UserStatus', 'user.profile.priority': 'Priority' }
 * });
 *
 * // Auto-learning from operations
 * const revivedData = reviveFromDatabase(dbRecord, {
 *   enumRegistry: { UserStatus, Priority },
 *   autoLearn: true
 * });
 * ```
 */
declare function reviveFromDatabase<T>(payload: unknown, config: SmartApiHelperConfig): T;

/**
 * Initializes the global smart enum mapping system
 */
declare function initializeSmartEnumMappings(config: {
    enumRegistry: Record<string, AnyEnumLike>;
}): void;

export { AnyEnumLike, DatabaseFormat, SmartApiHelperConfig, initializeSmartEnumMappings, prepareForDatabase, reviveFromDatabase };
