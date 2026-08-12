/**
 * Logger interface for @reharik/smart-enum library
 *
 * This interface allows users to inject their own logging implementation
 * or use the default console logger.
 */
import { globalSlot } from './globalState.js';

export type Logger = {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
};

/**
 * Default console logger implementation
 */
const consoleLogger: Logger = {
  debug(message: string, ...args: unknown[]): void {
    console.debug(`[@reharik/smart-enum:debug] ${message}`, ...args);
  },

  info(message: string, ...args: unknown[]): void {
    console.info(`[@reharik/smart-enum:info] ${message}`, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[@reharik/smart-enum:warn] ${message}`, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    console.error(`[@reharik/smart-enum:error] ${message}`, ...args);
  },
};

/**
 * Global logger instance, defaults to console logger.
 *
 * Keyed on globalThis so every loaded copy of the library logs through the
 * same instance — a logger injected via one copy applies to all of them.
 * See globalState.ts.
 */
const state = globalSlot<{ logger: Logger }>('logger', () => ({
  logger: consoleLogger,
}));

/**
 * Sets the global logger instance
 *
 * @param logger - The logger implementation to use
 *
 * @example
 * ```typescript
 * import { setLogger } from '@reharik/smart-enum';
 *
 * // Use custom logger
 * setLogger({
 *   debug: (msg, ...args) => myLogger.debug(msg, args),
 *   info: (msg, ...args) => myLogger.info(msg, args),
 *   warn: (msg, ...args) => myLogger.warn(msg, args),
 *   error: (msg, ...args) => myLogger.error(msg, args),
 * });
 * ```
 */
export function setLogger(logger: Logger): void {
  state.logger = logger;
}

/**
 * Gets the current logger instance
 *
 * @returns The current logger instance
 */
export function getLogger(): Logger {
  return state.logger;
}

// Internal convenience functions for library use
export function debug(message: string, ...args: unknown[]): void {
  state.logger.debug(message, ...args);
}

export function info(message: string, ...args: unknown[]): void {
  state.logger.info(message, ...args);
}

export function warn(message: string, ...args: unknown[]): void {
  state.logger.warn(message, ...args);
}

export function error(message: string, ...args: unknown[]): void {
  state.logger.error(message, ...args);
}
