import type {
  AnyEnumLike,
  LogLevel,
  SmartEnumMappingsConfig,
} from '../../types.js';
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

let globalEnumRegistry: Record<string, AnyEnumLike> | undefined;

/**
 * Wire-format registry for `reviveAfterTransport` / `reviveSmartEnums`.
 * Not used for database string revival.
 */
export const initializeSmartEnumMappings = (
  config: SmartEnumMappingsConfig,
): void => {
  globalEnumRegistry = config.enumRegistry;

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
  | undefined => globalEnumRegistry;
