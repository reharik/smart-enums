import type {
  AnyEnumLike,
  LogLevel,
  SmartEnumMappingsConfig,
} from '../../types.js';
import { globalSlot } from '../globalState.js';
import { info, setLogger, getLogger, type Logger } from '../logger.js';

const createLevelFilteredLogger = (logger: Logger, level: LogLevel): Logger => {
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
};

// Keyed on globalThis so every loaded copy of the library reads the same
// registry. With a module-level `let`, `reviveAfterTransport` imported from an
// unconfigured copy saw no registry even though `initializeSmartEnumMappings`
// had been called — through another copy. See globalState.ts.
const state = globalSlot<{
  registry: Record<string, AnyEnumLike> | undefined;
}>('enumRegistry', () => ({ registry: undefined }));

/**
 * Wire-format registry for `reviveAfterTransport` / `reviveSmartEnums`.
 * Not used for database string revival.
 */
export const initializeSmartEnumMappings = (
  config: SmartEnumMappingsConfig,
): void => {
  state.registry = config.enumRegistry;

  const logLevel = config.logLevel ?? 'error';
  const logger = config.logger ?? getLogger();
  setLogger(createLevelFilteredLogger(logger, logLevel));

  info('Initialized smart enum mappings', {
    enumCount: Object.keys(config.enumRegistry).length,
    enumTypes: Object.keys(config.enumRegistry),
    logLevel,
  });
};

export const getGlobalEnumRegistry = ():
  | Record<string, AnyEnumLike>
  | undefined => state.registry;

/**
 * Reset the registry to its initial uninitialized state.
 * Primarily useful for tests.
 */
export const resetSmartEnumMappings = (): void => {
  state.registry = undefined;
};
