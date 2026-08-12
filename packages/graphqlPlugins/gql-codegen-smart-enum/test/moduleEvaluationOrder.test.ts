import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression tests for the enumRegistry import-cycle bug.
 *
 * Old layout: the enums output held `enumRegistry`, so it imported every
 * hand-authored enum. User code (fixtures/moduleGraph/userError.ts) imports
 * generated enums and sits in a hand-authored enum's import closure, which
 * completed a cycle: enums output → user enum → user error → enums output.
 * Whichever side evaluated first crashed with a TDZ ReferenceError on the
 * other side's const — a crash that depends on module load order, so it could
 * pass in one entrypoint and fail in another.
 *
 * New layout (mirrored by fixtures/moduleGraph/): the registry is a separate
 * pure-sink module, the graph is acyclic, and evaluation must succeed from
 * EVERY entry point. Each test resets the module cache and enters the graph
 * from a different module.
 */
describe('module graph evaluation order', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should evaluate cleanly entering from the registry (bootstrap order)', async () => {
    const { enumRegistry } = await import(
      './fixtures/moduleGraph/enumRegistry.js'
    );

    expect(Object.keys(enumRegistry).sort()).toEqual([
      'EntityType',
      'ErrorCategory',
    ]);
    expect(enumRegistry.EntityType.album.deniedError.code).toBe(
      'MEMBER_NOT_ALLOWED',
    );
  });

  it('should evaluate cleanly entering from user error code first', async () => {
    // This is the order that crashed the old layout: userError pulls in the
    // enums module, which (old layout) pulled the user enum back in before
    // userError finished initializing.
    const { contractError } = await import(
      './fixtures/moduleGraph/userError.js'
    );
    const { enumRegistry } = await import(
      './fixtures/moduleGraph/enumRegistry.js'
    );

    expect(contractError.category.value).toBe('AUTH');
    expect(enumRegistry.EntityType.album.deniedError).toBe(contractError);
  });

  it('should evaluate cleanly entering from the hand-authored enum first', async () => {
    const { EntityType } = await import('./fixtures/moduleGraph/userEnum.js');

    expect(EntityType.album.value).toBe('ALBUM');
    expect(EntityType.album.deniedError.category.value).toBe('AUTH');
  });

  it('should evaluate cleanly entering from the generated enums first', async () => {
    const { ErrorCategory } = await import(
      './fixtures/moduleGraph/generatedEnums.js'
    );
    const { enumRegistry } = await import(
      './fixtures/moduleGraph/enumRegistry.js'
    );

    expect(ErrorCategory.auth.value).toBe('AUTH');
    expect(enumRegistry.ErrorCategory).toBe(ErrorCategory);
  });
});
