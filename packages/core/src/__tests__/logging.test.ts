import {
  setLogger,
  getLogger,
  debug,
  info,
  warn,
  error,
  type Logger,
} from '../utilities/logger.js';

describe('Logging', () => {
  beforeEach(() => {
    // Reset to console logger for each test
    setLogger({
      debug: (message, ...args) =>
        console.debug(`[ts-smart-enum:debug] ${message}`, ...args),
      info: (message, ...args) =>
        console.info(`[ts-smart-enum:info] ${message}`, ...args),
      warn: (message, ...args) =>
        console.warn(`[ts-smart-enum:warn] ${message}`, ...args),
      error: (message, ...args) =>
        console.error(`[ts-smart-enum:error] ${message}`, ...args),
    });
  });

  describe('Logger interface', () => {
    it('should provide console logger by default', () => {
      const logger = getLogger();
      expect(logger).toBeDefined();

      // Should not throw
      expect(() => {
        logger.debug('test');
        logger.info('test');
        logger.warn('test');
        logger.error('test');
      }).not.toThrow();
    });

    it('should allow custom logger implementation', () => {
      const logs: Array<{ level: string; message: string; args: unknown[] }> =
        [];

      const customLogger: Logger = {
        debug: (message, ...args) =>
          logs.push({ level: 'debug', message, args }),
        info: (message, ...args) => logs.push({ level: 'info', message, args }),
        warn: (message, ...args) => logs.push({ level: 'warn', message, args }),
        error: (message, ...args) =>
          logs.push({ level: 'error', message, args }),
      };

      setLogger(customLogger);

      debug('debug message', { data: 'test' });
      info('info message');
      warn('warn message');
      error('error message');

      expect(logs).toHaveLength(4);
      expect(logs[0]).toEqual({
        level: 'debug',
        message: 'debug message',
        args: [{ data: 'test' }],
      });
      expect(logs[1]).toEqual({
        level: 'info',
        message: 'info message',
        args: [],
      });
    });

    it('should provide convenience functions', () => {
      const logs: Array<{ level: string; message: string; args: unknown[] }> =
        [];

      const customLogger: Logger = {
        debug: (message, ...args) =>
          logs.push({ level: 'debug', message, args }),
        info: (message, ...args) => logs.push({ level: 'info', message, args }),
        warn: (message, ...args) => logs.push({ level: 'warn', message, args }),
        error: (message, ...args) =>
          logs.push({ level: 'error', message, args }),
      };

      setLogger(customLogger);

      // Use convenience functions
      debug('convenience debug');
      info('convenience info');
      warn('convenience warn');
      error('convenience error');

      expect(logs).toHaveLength(4);
      expect(logs.map(l => l.level)).toEqual([
        'debug',
        'info',
        'warn',
        'error',
      ]);
    });
  });
});
