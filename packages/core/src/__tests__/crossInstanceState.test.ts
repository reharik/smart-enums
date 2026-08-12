/**
 * Shared-state behavior across duplicate module instances.
 *
 * Since 0.10 every piece of the library's shared mutable state (serialization
 * mode, transport registry, logger, enum-name registry) is keyed on globalThis
 * rather than held in module-level variables, so configuration written through
 * one copy of the library applies to enums built by another. These tests
 * simulate a duplicate copy the same way packageResistance.test.ts does:
 * `jest.isolateModules` + `require` yields a genuinely separate module
 * instance sharing this file's global context.
 */
import { enumeration, getSubsetByProp } from '../index.js';
import {
  registerLibraryCopy,
  resetDuplicateLoadDetection,
} from '../utilities/duplicateLoadDetection.js';
import { getLogger, setLogger, type Logger } from '../utilities/logger.js';
import { LIBRARY_VERSION } from '../version.js';

// swc emits CommonJS for tests, so `require` exists at runtime; no @types/node.
declare const require: (id: string) => unknown;

const loadCopy = (): typeof import('../index.js') => {
  let mod: typeof import('../index.js') | undefined;
  jest.isolateModules(() => {
    mod = require('../index.js') as typeof import('../index.js');
  });
  if (!mod) throw new Error('failed to load isolated copy');
  return mod;
};

const makeCapturingLogger = (): { logger: Logger; lines: string[] } => {
  const lines: string[] = [];
  const capture =
    (level: string) =>
    (message: string): void => {
      lines.push(`${level}: ${message}`);
    };
  return {
    logger: {
      debug: capture('debug'),
      info: capture('info'),
      warn: capture('warn'),
      error: capture('error'),
    },
    lines,
  };
};

const originalLogger = getLogger();

afterEach(() => {
  setLogger(originalLogger);
});

describe('serialization mode across module instances', () => {
  const main = require('../index.js') as typeof import('../index.js');

  afterEach(() => {
    main.resetDefaultSerializationMode();
  });

  it('mode set through copy A applies to an enum built by copy B', () => {
    const copyA = loadCopy();
    const copyB = loadCopy();

    copyA.setDefaultSerializationMode('value');
    const Status = copyB.enumeration('XInstStatus', {
      input: ['active'] as const,
    });

    expect(JSON.stringify(Status.active)).toBe('"ACTIVE"');
  });

  it('resetting through one copy clears the default for all copies', () => {
    const copyA = loadCopy();
    copyA.setDefaultSerializationMode('value');
    main.resetDefaultSerializationMode();

    const Status = loadCopy().enumeration('XInstStatusReset', {
      input: ['active'] as const,
    });

    expect(JSON.stringify(Status.active)).toBe(
      '{"__smart_enum_type":"XInstStatusReset","value":"ACTIVE"}',
    );
  });
});

describe('transport registry across module instances', () => {
  const main = require('../index.js') as typeof import('../index.js');
  const silent = makeCapturingLogger().logger;

  afterEach(() => {
    main.resetSmartEnumMappings();
  });

  it('registry initialized through copy A is used by reviveAfterTransport from copy B', () => {
    const copyA = loadCopy();
    const copyB = loadCopy();

    const Wire = main.enumeration('XInstWire', {
      input: ['active', 'inactive'] as const,
    });
    copyA.initializeSmartEnumMappings({
      enumRegistry: { XInstWire: Wire },
      logger: silent,
      logLevel: 'error',
    });

    const revived = copyB.reviveAfterTransport<{ status: unknown }>({
      status: { __smart_enum_type: 'XInstWire', value: 'ACTIVE' },
    });

    expect(Wire.has(revived.status)).toBe(true);
    expect((revived.status as { value: string }).value).toBe('ACTIVE');
  });

  it('throws (instead of silently returning wire shapes) when never initialized', () => {
    main.resetSmartEnumMappings();

    expect(() =>
      loadCopy().reviveAfterTransport({
        status: { __smart_enum_type: 'XInstWire', value: 'ACTIVE' },
      }),
    ).toThrow(/initializeSmartEnumMappings/);
  });

  it('a logger injected through copy A receives log calls made by copy B', () => {
    const { logger, lines } = makeCapturingLogger();
    const copyA = loadCopy();
    const copyB = loadCopy();

    copyA.initializeSmartEnumMappings({
      enumRegistry: {},
      logger,
      logLevel: 'debug',
    });
    lines.length = 0;

    copyB.reviveAfterTransport({
      status: { __smart_enum_type: 'NotRegistered', value: 'X' },
    });

    expect(lines.some(l => l.startsWith('debug:'))).toBe(true);
  });
});

describe('enum-name uniqueness across module instances', () => {
  it('warns when the same name gets different members through another copy', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);
    enumeration('XInstCollision', { input: ['one'] as const });

    loadCopy().enumeration('XInstCollision', { input: ['two'] as const });

    const warnings = lines.filter(l => l.startsWith('warn:'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(
      "Enum name 'XInstCollision' was redefined with different members",
    );
  });

  it('stays silent re-registering the same name with identical members from another copy', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);
    enumeration('XInstBenign', { input: ['one'] as const });

    loadCopy().enumeration('XInstBenign', { input: ['one'] as const });

    expect(lines.filter(l => l.startsWith('warn:'))).toEqual([]);
  });
});

describe('getSubsetByProp with enum-item-valued props', () => {
  const Category = enumeration('XInstCategory', {
    input: ['food', 'toys'] as const,
  });
  const Product = enumeration('XInstProduct', {
    input: {
      apple: { category: Category.food },
      steak: { category: Category.food },
      ball: { category: Category.toys },
    },
  });

  it('matches when the query value comes from a second enum instance (same copy)', () => {
    const CategoryAgain = enumeration('XInstCategory', {
      input: ['food', 'toys'] as const,
    });

    const food = getSubsetByProp(Product, 'category', CategoryAgain.food);
    expect([...food.keys()].sort()).toEqual(['apple', 'steak']);
  });

  it('matches when the query value comes from a duplicate library copy', () => {
    const copy = loadCopy();
    const CategoryCopy = copy.enumeration('XInstCategory', {
      input: ['food', 'toys'] as const,
    });

    const toys = getSubsetByProp(Product, 'category', CategoryCopy.toys);
    expect(toys.keys()).toEqual(['ball']);
  });

  it('still matches plain values with Object.is semantics', () => {
    const food = getSubsetByProp(Product, 'category', Category.food);
    expect([...food.keys()].sort()).toEqual(['apple', 'steak']);
  });
});

describe('duplicate-install detection', () => {
  beforeEach(() => {
    resetDuplicateLoadDetection();
  });

  afterEach(() => {
    resetDuplicateLoadDetection();
  });

  it('stays silent for the first registered location', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);

    registerLibraryCopy({ version: '1.0.0', location: '/app/a/dist' });

    expect(lines).toEqual([]);
  });

  it('warns when a second distinct location registers, naming both copies', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);

    registerLibraryCopy({ version: '1.0.0', location: '/app/a/dist' });
    registerLibraryCopy({ version: '1.2.0', location: '/app/b/dist' });

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('warn: Duplicate installs');
    expect(lines[0]).toContain('1.0.0 at /app/a/dist');
    expect(lines[0]).toContain('1.2.0 at /app/b/dist');
  });

  it('does not warn when the same location registers twice (multi-entry bundles of one install)', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);

    registerLibraryCopy({ version: '1.0.0', location: '/app/a/dist' });
    registerLibraryCopy({ version: '1.0.0', location: '/app/a/dist' });

    expect(lines).toEqual([]);
  });

  it('stays silent when a location cannot be determined', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);

    registerLibraryCopy({ version: '1.0.0', location: '/app/a/dist' });
    registerLibraryCopy({ version: '1.0.0', location: undefined });

    expect(lines).toEqual([]);
  });

  it('loading a duplicate copy from the same path does not warn (jest.isolateModules)', () => {
    const { logger, lines } = makeCapturingLogger();
    setLogger(logger);

    loadCopy();
    loadCopy();

    expect(lines.filter(l => l.includes('Duplicate installs'))).toEqual([]);
  });
});

describe('version constant', () => {
  it('matches package.json (duplicate-install warnings name versions)', () => {
    const pkg = require('../../package.json') as { version: string };
    expect(LIBRARY_VERSION).toBe(pkg.version);
  });
});
