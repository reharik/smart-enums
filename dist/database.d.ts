import { c as DatabaseFormat, A as AnyEnumLike } from './core-D2kChDMb.js';
export { B as BaseEnum, D as DropdownOption, a as EnumItem, b as EnumItemType, E as Enumeration, S as SmartApiHelperConfig, e as enumeration, i as isSmartEnumItem } from './core-D2kChDMb.js';

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
 * @returns The payload with string enum values converted back to enum items
 *
 * @example
 * ```typescript
 * // First, initialize the global configuration
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 *
 * // Then revive using global config
 * const revivedData = reviveFromDatabase(dbRecord);
 * ```
 */
declare function reviveFromDatabase<T>(payload: unknown): T;

/**
 * Initializes the global smart enum mapping system
 */
declare function initializeSmartEnumMappings(config: {
    enumRegistry: Record<string, AnyEnumLike>;
}): void;
/**
 * Gets the global enum registry
 */
declare function getGlobalEnumRegistry(): Record<string, AnyEnumLike> | undefined;

export { AnyEnumLike, DatabaseFormat, getGlobalEnumRegistry, initializeSmartEnumMappings, prepareForDatabase, reviveFromDatabase };
