import { SerializationMode } from '../types.js';

let globalDefault: SerializationMode | undefined;

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
  globalDefault = mode;
};

/**
 * Reset the global default to its initial unset state.
 * Primarily useful for tests.
 */
export const resetDefaultSerializationMode = (): void => {
  globalDefault = undefined;
};

/**
 * Resolve the effective serialization mode for an enum item.
 * Per-enum option wins, then global, then 'wrapped'.
 */
export const resolveSerializationMode = (
  perEnum: SerializationMode | undefined,
): SerializationMode => perEnum ?? globalDefault ?? 'wrapped';
