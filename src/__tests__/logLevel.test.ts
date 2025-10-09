import { enumeration } from '../enumeration.js';
import {
  initializeSmartEnumMappings,
  prepareForDatabase,
  type LogLevel,
} from '../utilities/database/index.js';

describe('Log Level Configuration', () => {
  // Create test enums
  const UserStatus = enumeration('UserStatus', {
    input: ['ACTIVE', 'INACTIVE', 'PENDING'],
  });

  const Priority = enumeration('Priority', {
    input: ['LOW', 'MEDIUM', 'HIGH'],
  });

  describe('Log level filtering', () => {
    it('should only log error messages when logLevel is error', () => {
      const logs: Array<{ level: string; message: string; args: unknown[] }> =
        [];

      const customLogger = {
        debug: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'debug', message, args }),
        info: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'info', message, args }),
        warn: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'warn', message, args }),
        error: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'error', message, args }),
      };

      initializeSmartEnumMappings({
        enumRegistry: { UserStatus, Priority },
        logLevel: 'error',
        logger: customLogger,
      });

      // This should not produce any logs since info is filtered out
      expect(logs).toHaveLength(0);
    });

    it('should log info and above when logLevel is info', () => {
      const logs: Array<{ level: string; message: string; args: unknown[] }> =
        [];

      const customLogger = {
        debug: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'debug', message, args }),
        info: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'info', message, args }),
        warn: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'warn', message, args }),
        error: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'error', message, args }),
      };

      initializeSmartEnumMappings({
        enumRegistry: { UserStatus, Priority },
        logLevel: 'info',
        logger: customLogger,
      });

      // Should have the initialization log
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Initialized smart enum mappings');
    });

    it('should log debug and above when logLevel is debug', () => {
      const logs: Array<{ level: string; message: string; args: unknown[] }> =
        [];

      const customLogger = {
        debug: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'debug', message, args }),
        info: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'info', message, args }),
        warn: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'warn', message, args }),
        error: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'error', message, args }),
      };

      initializeSmartEnumMappings({
        enumRegistry: { UserStatus, Priority },
        logLevel: 'debug',
        logger: customLogger,
      });

      // Should have the initialization log
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe('info');
      expect(logs[0].message).toBe('Initialized smart enum mappings');

      // Clear logs and do some operations that should produce debug logs
      logs.length = 0;

      const dataToLearn = {
        user: {
          status: UserStatus.ACTIVE,
          priority: Priority.HIGH,
        },
      };

      prepareForDatabase(dataToLearn);

      // Should have debug logs for learning
      const debugLogs = logs.filter(l => l.level === 'debug');
      expect(debugLogs.length).toBeGreaterThan(0);
      expect(debugLogs[0].message).toBe('Learned field mapping');
    });

    it('should default to error log level when not specified', () => {
      const logs: Array<{ level: string; message: string; args: unknown[] }> =
        [];

      const customLogger = {
        debug: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'debug', message, args }),
        info: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'info', message, args }),
        warn: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'warn', message, args }),
        error: (message: string, ...args: unknown[]) =>
          logs.push({ level: 'error', message, args }),
      };

      initializeSmartEnumMappings({
        enumRegistry: { UserStatus, Priority },
        logger: customLogger,
        // logLevel not specified, should default to 'error'
      });

      // Should not have any logs since info is filtered out by error level
      expect(logs).toHaveLength(0);
    });

    it('should use default logger when not specified', () => {
      // This test just ensures no errors are thrown
      expect(() => {
        initializeSmartEnumMappings({
          enumRegistry: { UserStatus, Priority },
          logLevel: 'debug',
          // logger not specified, should use default console logger
        });
      }).not.toThrow();
    });
  });

  describe('All log levels', () => {
    const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

    it.each(logLevels)('should accept %s log level', logLevel => {
      expect(() => {
        initializeSmartEnumMappings({
          enumRegistry: { UserStatus, Priority },
          logLevel,
        });
      }).not.toThrow();
    });
  });
});
