import { LIBRARY_VERSION } from '../version.js';

import { globalSlot } from './globalState.js';
import { warn } from './logger.js';
import { dirOf, parseStackFrames } from './stackLocation.js';

/**
 * Duplicate-install diagnostics.
 *
 * A process can end up with more than one *install* of `@reharik/smart-enum`
 * — a stray nested `node_modules` copy, or two different versions pulled in by
 * different dependents. Since 0.10 the library's shared state lives on
 * globalThis (see globalState.ts), so duplicate copies mostly behave; this
 * module exists because a duplicate install still usually indicates a
 * packaging problem, and the silent kind is expensive to find. We warn once,
 * naming each copy's version and location, instead of misbehaving quietly.
 *
 * A copy is identified by the *directory* of the module file that registered
 * it. That deliberately collapses the legitimate multi-instance cases — this
 * package's own entry points (`.`, `./core`, `./transport`, `./database`) are
 * bundled separately but share one `dist/` directory, as do the ESM and CJS
 * builds — while two installs necessarily live at two paths. When the
 * location cannot be determined (exotic bundling), we stay silent rather than
 * risk a false positive.
 */

export type LibraryCopy = { version: string; location: string };

const loadedCopies = globalSlot<LibraryCopy[]>('loadedCopies', () => []);

/**
 * Best-effort directory of the file this module was evaluated from — the
 * topmost stack frame is this function itself. See stackLocation.ts for why a
 * stack trace and not `import.meta.url`.
 */
const getOwnLocation = (): string | undefined => {
  const frames = parseStackFrames(
    new Error('stack probe for module location').stack,
  );
  return frames.length > 0 ? dirOf(frames[0].file) : undefined;
};

/**
 * Records a library copy and warns when it is the second distinct location to
 * register. Exposed (rather than inlined into the module side effect) so tests
 * can drive it with synthetic locations.
 */
export const registerLibraryCopy = (copy: {
  version: string;
  location: string | undefined;
}): void => {
  const { version, location } = copy;
  if (location === undefined) return;
  if (loadedCopies.some(c => c.location === location)) return;

  loadedCopies.push({ version, location });
  if (loadedCopies.length > 1) {
    warn(
      'Duplicate installs of @reharik/smart-enum loaded in this process: ' +
        loadedCopies.map(c => `${c.version} at ${c.location}`).join(', ') +
        '. Shared configuration (serialization mode, transport registry, ' +
        'logger) lives on globalThis, so it still applies across copies, but ' +
        'a duplicate install usually indicates a packaging problem — check ' +
        "with 'npm ls @reharik/smart-enum' for nested or mismatched copies.",
    );
  }
};

/**
 * Clears recorded copies. Primarily useful for tests.
 */
export const resetDuplicateLoadDetection = (): void => {
  loadedCopies.length = 0;
};

registerLibraryCopy({ version: LIBRARY_VERSION, location: getOwnLocation() });
