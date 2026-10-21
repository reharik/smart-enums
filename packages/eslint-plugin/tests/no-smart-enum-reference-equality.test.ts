import path from 'node:path';
import tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { Linter } from 'eslint';
import ts from 'typescript';
import plugin from '../src/index.js';
import { noSmartEnumReferenceEquality } from '../src/rules/no-smart-enum-reference-equality.js';

const fixturesDir = path.join(__dirname, 'fixtures');

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: fixturesDir,
    },
  },
});

const header = `
import { pickEnum, type EnumSubset } from '@reharik/smart-enum';
import { Status, CopyStatus } from './enums.js';
type Status = import('./enums.js').Status;
declare const s: Status;
declare const maybe: Status | undefined;
declare const row: { kind: Status; name: string };
declare const subset: EnumSubset<Status, 'active'>;
declare const str: string;
`;

const useEquals = (operator: string, suggestion: string) => ({
  messageId: 'useEquals' as const,
  data: { operator, suggestion },
});

ruleTester.run(
  'no-smart-enum-reference-equality',
  noSmartEnumReferenceEquality,
  {
    valid: [
      `${header} maybe == null;`,
      `${header} maybe != undefined;`,
      `${header} s.value === 'ACTIVE';`,
      `${header} str === 'ACTIVE';`,
      `${header} row.name === 'x';`,
    ],
    invalid: [
      {
        code: `${header} s === Status.active;`,
        errors: [useEquals('===', 's.equals(Status.active)')],
      },
      {
        code: `${header} s !== Status.active;`,
        errors: [useEquals('!==', '!s.equals(Status.active)')],
      },
      {
        code: `${header} Status.active === s;`,
        errors: [useEquals('===', 'Status.active.equals(s)')],
      },
      {
        code: `${header} row.kind === Status.active;`,
        errors: [useEquals('===', 'row.kind.equals(Status.active)')],
      },
      {
        code: `${header} maybe === Status.active;`,
        errors: [useEquals('===', 'maybe.equals(Status.active)')],
      },
      {
        code: `${header} subset === Status.active;`,
        errors: [useEquals('===', 'subset.equals(Status.active)')],
      },
      {
        code: `${header} pickEnum(Status, ['active']).active === Status.active;`,
        errors: [
          useEquals(
            '===',
            "pickEnum(Status, ['active']).active.equals(Status.active)",
          ),
        ],
      },
      {
        code: `${header} s == Status.active;`,
        errors: [useEquals('==', 's.equals(Status.active)')],
      },
      {
        code: `${header} s != Status.active;`,
        errors: [useEquals('!=', '!s.equals(Status.active)')],
      },
      {
        // Member from a second copy of the package compared to one from the first.
        code: `${header} import { Status as A } from './enums.js';
        const fromCopy = CopyStatus.active;
        fromCopy === A.active;`,
        errors: [useEquals('===', 'fromCopy.equals(A.active)')],
      },
      {
        // Both operands from the copy: proves the copy's members are detected on their own.
        code: `${header} CopyStatus.active === CopyStatus.inactive;`,
        errors: [
          useEquals('===', 'CopyStatus.active.equals(CopyStatus.inactive)'),
        ],
      },
    ],
  },
);

describe('without type information', () => {
  it('throws a clear error when parserOptions.project is missing', () => {
    const linter = new Linter({ configType: 'flat' });
    expect(() =>
      linter.verify(
        'const a = 1; a === 1;',
        [
          {
            files: ['**/*.ts'],
            languageOptions: { parser: tsParser },
            plugins: { 'smart-enum': plugin },
            rules: { 'smart-enum/no-smart-enum-reference-equality': 'error' },
          } as Linter.Config,
        ],
        'file.ts',
      ),
    ).toThrow(/requires type information/);
  });
});

describe('plugin', () => {
  it('exposes the rule and a recommended config without parser settings', () => {
    expect(plugin.meta.name).toBe('@reharik/eslint-plugin-smart-enum');
    expect(plugin.rules['no-smart-enum-reference-equality']).toBe(
      noSmartEnumReferenceEquality,
    );
    expect(plugin.configs.recommended).toEqual({
      plugins: { 'smart-enum': plugin },
      rules: { 'smart-enum/no-smart-enum-reference-equality': 'error' },
    });
  });
});

describe('fixture project', () => {
  it('resolves smart-enum-copy to a distinct copy of the package', () => {
    const configPath = path.join(fixturesDir, 'tsconfig.json');
    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config, ts.sys, fixturesDir);
    const program = ts.createProgram(parsed.fileNames, parsed.options);

    expect(ts.getPreEmitDiagnostics(program)).toEqual([]);
    const files = program.getSourceFiles().map(f => f.fileName);
    expect(files.some(f => f.includes('/fixtures/smart-enum-copy/'))).toBe(
      true,
    );
    expect(files.some(f => f.includes('/core/dist/'))).toBe(true);
  });
});
