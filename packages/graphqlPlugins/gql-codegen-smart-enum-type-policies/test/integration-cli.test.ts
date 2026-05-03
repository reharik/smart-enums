import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const enumPackageDir = path.resolve(process.cwd(), '../gql-codegen-smart-enum');

const runCodegen = (): void => {
  execSync('npm run build', {
    cwd: enumPackageDir,
    stdio: 'pipe',
  });

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
  describe('When using local built plugins from codegen.ts', () => {
    it('should generate smart enums, TypeScript types, and type policies files', () => {
      // arrange
      const smartEnumsOutputPath = path.resolve(
        process.cwd(),
        'examples/generated/graphql-smart-enums.ts',
      );
      const typesOutputPath = path.resolve(
        process.cwd(),
        'examples/generated/graphql-types.ts',
      );
      const typePoliciesOutputPath = path.resolve(
        process.cwd(),
        'examples/generated/graphql-smart-enum-type-policies.ts',
      );

      // act
      runCodegen();

      // assert
      expect(existsSync(smartEnumsOutputPath)).toBe(true);
      expect(existsSync(typesOutputPath)).toBe(true);
      expect(existsSync(typePoliciesOutputPath)).toBe(true);

      const smartEnumsOutput = readFileSync(smartEnumsOutputPath, 'utf8');
      expect(smartEnumsOutput).toContain(
        "import { enumeration, type Enumeration } from '@reharik/smart-enum';",
      );
      expect(smartEnumsOutput).toContain(
        "export const PaymentStatus = enumeration<typeof paymentStatusInput>('PaymentStatus'",
      );

      const typePoliciesOutput = readFileSync(typePoliciesOutputPath, 'utf8');
      expect(typePoliciesOutput).toContain(
        'export const smartEnumTypePolicies = {',
      );
      expect(typePoliciesOutput).toContain('Order: {');
      expect(typePoliciesOutput).toContain('PaymentStatus.fromValue');
    }, 20_000);
  });
});
