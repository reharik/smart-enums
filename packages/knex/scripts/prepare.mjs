/**
 * When this package is installed from a git monorepo, npm may run `prepare` on
 * workspaces in an order where `@reharik/smart-enum` has not finished building yet.
 * Building the sibling `packages/core` first ensures declaration files exist
 * before tsup emits DTS for this package.
 *
 * When installed from the npm registry, `../core` is absent; we only run the
 * local build (dependency `@reharik/smart-enum` already ships `dist/*.d.ts`).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const knexRoot = join(scriptDir, '..');
const coreRoot = join(knexRoot, '..', 'core');

const runOrExit = (command, args, cwd) => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });
  const code = result.status ?? 1;
  if (code !== 0) {
    process.exit(code);
  }
};

if (existsSync(join(coreRoot, 'package.json'))) {
  runOrExit('npm', ['run', 'build'], coreRoot);
}

runOrExit('npm', ['run', 'build'], knexRoot);
