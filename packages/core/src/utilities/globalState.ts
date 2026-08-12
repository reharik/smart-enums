/**
 * Realm-global storage for the library's shared mutable state.
 *
 * Module-level `let` is scoped to one module *instance*, and this library can
 * be evaluated more than once in a process through no fault of the consumer:
 * a stray nested install (e.g. a container-side `npm install` through a bind
 * mount), a bundler inlining the package into several chunks, mixed ESM/CJS
 * consumers loading both builds — and even importing two of this package's own
 * entry points, since each entry (`.`, `./core`, `./transport`, `./database`)
 * is bundled with its own copy of every internal module. When that happens,
 * configuration written through one copy is invisible to enums built by
 * another: nothing throws, output is silently wrong.
 *
 * Storing shared state under `globalThis`, keyed by `Symbol.for`, gives every
 * copy in the realm the same slot — the same move that makes `.equals()`
 * compare string identity instead of references.
 *
 * The payload shape of each slot is a cross-copy contract: two different
 * versions of this library may read the same slot, so fields may be added but
 * never renamed or repurposed.
 */
export const globalSlot = <T>(name: string, init: () => T): T => {
  const key = Symbol.for(`@reharik/smart-enum:${name}`);
  const store = globalThis as Record<symbol, unknown>;
  if (!(key in store)) {
    store[key] = init();
  }
  return store[key] as T;
};
