import { SerializationMode } from '../types.js';

import { globalSlot } from './globalState.js';

// Keyed on globalThis so every loaded copy of the library resolves the same
// default. With a module-level `let`, an enum built by one copy serialized
// with that copy's default, and setDefaultSerializationMode called on another
// copy silently had no effect. See globalState.ts.
const state = globalSlot<{ mode: SerializationMode | undefined }>(
  'serializationMode',
  () => ({ mode: undefined }),
);

/**
 * Set the global default serialization mode for all smart-enum items
 * that don't have a per-enum serializeAs option.
 *
 * Call once at app startup, before any JSON.stringify happens on enum items.
 *
 * @example
 * setDefaultSerializationMode('value');
 */
export const setDefaultSerializationMode = (mode: SerializationMode): void => {
  state.mode = mode;
};

/**
 * Reset the global default to its initial unset state.
 * Primarily useful for tests.
 */
export const resetDefaultSerializationMode = (): void => {
  state.mode = undefined;
};

/**
 * Resolve the effective serialization mode for an enum item.
 * Per-enum option wins, then global, then 'wrapped'.
 */
export const resolveSerializationMode = (
  perEnum: SerializationMode | undefined,
): SerializationMode => perEnum ?? state.mode ?? 'wrapped';
