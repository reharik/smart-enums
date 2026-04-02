/**
 * Logger interface for ts-smart-enum library
 *
 * This interface allows users to inject their own logging implementation
 * or use the default console logger.
 */

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
    console.debug(`[ts-smart-enum:debug] ${message}`, ...args);
  },

  info(message: string, ...args: unknown[]): void {
    console.info(`[ts-smart-enum:info] ${message}`, ...args);
  },

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[ts-smart-enum:warn] ${message}`, ...args);
  },

  error(message: string, ...args: unknown[]): void {
    console.error(`[ts-smart-enum:error] ${message}`, ...args);
  },
};

/**
 * Global logger instance
 * Defaults to console logger
 */
let globalLogger: Logger = consoleLogger;

/**
 * Sets the global logger instance
 *
 * @param logger - The logger implementation to use
 *
 * @example
 * ```typescript
 * import { setLogger } from 'ts-smart-enum';
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
  globalLogger = logger;
}

/**
 * Gets the current logger instance
 *
 * @returns The current logger instance
 */
export function getLogger(): Logger {
  return globalLogger;
}

// Internal convenience functions for library use
export function debug(message: string, ...args: unknown[]): void {
  globalLogger.debug(message, ...args);
}

export function info(message: string, ...args: unknown[]): void {
  globalLogger.info(message, ...args);
}

export function warn(message: string, ...args: unknown[]): void {
  globalLogger.warn(message, ...args);
}

export function error(message: string, ...args: unknown[]): void {
  globalLogger.error(message, ...args);
}
