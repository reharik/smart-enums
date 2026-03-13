import { isSmartEnumItem } from '../typeGuards.js';
import type { AnyEnumLike } from '../../types.js';
import {
  debug,
  info,
  warn,
  setLogger,
  getLogger,
  type Logger,
} from '../logger.js';

type PlainObject = Record<string, unknown>;

const isPlainObject = (x: unknown): x is PlainObject =>
  typeof x === 'object' &&
  x !== null &&
  Object.getPrototypeOf(x) === Object.prototype;

/**
 * Global state for automatic field mapping learning
 */
let globalEnumRegistry: Record<string, AnyEnumLike> | undefined;
let globalFieldMapping: Record<string, string[]> = {}; // property -> array of enum types

/**
 * Log levels for smart enum mappings
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Configuration for smart enum mappings initialization
 */
export type SmartEnumMappingsConfig = {
  enumRegistry: Record<string, AnyEnumLike>;
  logLevel?: LogLevel;
  logger?: Logger;
};

/**
 * Creates a logger that filters by log level
 */
function createLevelFilteredLogger(logger: Logger, level: LogLevel): Logger {
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  const currentLevel = levels[level];

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (currentLevel <= levels.debug) {
        logger.debug(message, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (currentLevel <= levels.info) {
        logger.info(message, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (currentLevel <= levels.warn) {
        logger.warn(message, ...args);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (currentLevel <= levels.error) {
        logger.error(message, ...args);
      }
    },
  };
}

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
export function initializeSmartEnumMappings(
  config: SmartEnumMappingsConfig,
): void {
  globalEnumRegistry = config.enumRegistry;
  globalFieldMapping = {};

  // Set up logging
  const logLevel = config.logLevel ?? 'error';
  const logger = config.logger ?? getLogger();
  const filteredLogger = createLevelFilteredLogger(logger, logLevel);

  setLogger(filteredLogger);

  info('Initialized smart enum mappings', {
    enumCount: Object.keys(config.enumRegistry).length,
    enumTypes: Object.keys(config.enumRegistry),
    logLevel,
  });
}

/**
 * Learns from data using the global field mapping system
 */
export function learnFromData(data: unknown): void {
  if (!globalEnumRegistry) {
    warn('learnFromData called but no global enum registry initialized');
    return;
  }

  const seen = new WeakSet<object>();
  let learnedCount = 0;

  const walk = (v: unknown, propertyName?: string): void => {
    if (isSmartEnumItem(v) && propertyName) {
      // Record this property name as containing this enum type
      const enumTypeName = v.__smart_enum_type;

      if (!enumTypeName) {
        warn('Smart enum item missing __smart_enum_type', {
          propertyName,
          item: v,
        });
        return;
      }

      // Add to the array of enum types for this property
      if (
        !globalFieldMapping[propertyName] ||
        !globalFieldMapping[propertyName].includes(enumTypeName)
      ) {
        globalFieldMapping[propertyName] = [
          ...(globalFieldMapping[propertyName] || []),
          enumTypeName,
        ];

        learnedCount++;
        debug('Learned field mapping', {
          property: propertyName,
          enumType: enumTypeName,
          allMappings: globalFieldMapping[propertyName],
        });
      }
      return;
    }

    if (typeof v === 'object' && v !== null) {
      if (seen.has(v)) {
        return;
      }
      seen.add(v);
    }

    if (Array.isArray(v)) {
      for (const item of v) {
        walk(item, propertyName);
      }
    } else if (isPlainObject(v)) {
      for (const [key, value] of Object.entries(v)) {
        walk(value, key);
      }
    }
  };

  walk(data);

  if (learnedCount > 0) {
    info('Field mapping learning completed', {
      learnedCount,
      totalMappings: Object.keys(globalFieldMapping).length,
    });
  }
}

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
export function getLearnedMapping(): Record<string, string[]> {
  return { ...globalFieldMapping };
}

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
export function getGlobalEnumRegistry():
  | Record<string, AnyEnumLike>
  | undefined {
  return globalEnumRegistry;
}

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
export function mergeFieldMappings(
  learnedMapping: Record<string, string[]>,
  manualMapping?: Record<string, string[]>,
): Record<string, string[]> {
  if (!manualMapping) {
    debug('No manual mappings provided, returning learned mappings', {
      learnedCount: Object.keys(learnedMapping).length,
    });
    return learnedMapping;
  }

  debug('Merging manual and learned mappings', {
    manualFields: Object.keys(manualMapping),
    learnedFields: Object.keys(learnedMapping),
  });

  // Add manual mappings to global state so they persist
  for (const [field, manualEnumTypes] of Object.entries(manualMapping)) {
    const existingEnumTypes = globalFieldMapping[field] || [];

    // Start with manual enum types
    const combinedEnumTypes = [...manualEnumTypes];

    // Add existing enum types that aren't already in the manual list
    for (const existingEnumType of existingEnumTypes) {
      if (!combinedEnumTypes.includes(existingEnumType)) {
        combinedEnumTypes.push(existingEnumType);
      }
    }

    // Update global state
    globalFieldMapping[field] = combinedEnumTypes;

    debug('Updated field mapping', {
      field,
      manualTypes: manualEnumTypes,
      existingTypes: existingEnumTypes,
      combinedTypes: combinedEnumTypes,
    });
  }

  info('Field mapping merge completed', {
    totalFields: Object.keys(globalFieldMapping).length,
    manualFieldsAdded: Object.keys(manualMapping).length,
  });

  // Return the merged result (which now includes the updated global state)
  return { ...globalFieldMapping };
}
