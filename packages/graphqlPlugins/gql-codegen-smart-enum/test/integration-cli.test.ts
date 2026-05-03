import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const runCodegen = (): void => {
  execSync('npm run build', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  execSync('npx graphql-codegen --config examples/codegen.ts', {
    cwd: process.cwd(),
    stdio: 'pipe',
  });
};

describe('Codegen CLI integration', () => {
  describe('When using local built plugin from codegen.ts', () => {
    it('should generate smart enum and typescript files', () => {
      // arrange
      const smartEnumsOutputPath = path.resolve(
        process.cwd(),
        'examples/generated/graphql-smart-enums.ts',
      );
      const typesOutputPath = path.resolve(
        process.cwd(),
        'examples/generated/graphql-types.ts',
      );

      // act
      runCodegen();

      // assert
      expect(existsSync(smartEnumsOutputPath)).toBe(true);
      expect(existsSync(typesOutputPath)).toBe(true);

      const smartEnumsOutput = readFileSync(smartEnumsOutputPath, 'utf8');
      expect(smartEnumsOutput).toContain(
        "import { enumeration, type Enumeration } from '@reharik/smart-enum';",
      );
      expect(smartEnumsOutput).toContain(
        "export const PaymentStatus = enumeration<typeof paymentStatusInput>('PaymentStatus'",
      );
      expect(smartEnumsOutput).toContain('type Enumeration');
      expect(smartEnumsOutput).toContain(
        "'canceled': { display: 'Payment was canceled', deprecated: true, deprecationReason: 'Use VOIDED' },",
      );
    });
  });
});
