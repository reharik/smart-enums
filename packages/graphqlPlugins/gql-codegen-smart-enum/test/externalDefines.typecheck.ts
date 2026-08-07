/**
 * Compile-time assertions for the `emit: 'externalDefines'` output. This file
 * is typechecked (`npm run typecheck`) but never executed — the failure mode
 * for everything below is silent, so each case is pinned with either
 * `@ts-expect-error` or a `never` probe.
 */
import { enumeration } from '@reharik/smart-enum';

import {
  defineEntityTypeInput,
  type EntityTypeKeys,
} from './fixtures/entityTypeDefines.js';

const input = defineEntityTypeInput({
  album: { table: 'albums', soft: true },
  authorization: { table: 'auth', soft: false },
  comment: { table: 'comments', soft: true },
  mediaItem: { table: 'media', soft: false },
  reaction: { table: 'reactions', soft: true },
  user: { table: 'users', soft: false },
});
export const EntityType = enumeration<typeof input>('EntityType', { input });

// -- the pinned input keeps its literal types without `as const` --------------

declare const excessInputTable: Exclude<typeof input.album.table, 'albums'>;
export const inputTableIsLiteral: never = excessInputTable;

// -- member types carry the derived value/display and literal extras ----------

// `value` includes the derived literal...
declare const derivedValue: 'MEDIA_ITEM';
export const valueAccepts: typeof EntityType.mediaItem.value = derivedValue;
// ...and nothing else (if `value` widened to `string`, Exclude leaves `string`).
declare const excessValue: Exclude<
  typeof EntityType.mediaItem.value,
  'MEDIA_ITEM'
>;
export const valueIsExact: never = excessValue;

declare const derivedDisplay: 'Media Item';
export const displayAccepts: typeof EntityType.mediaItem.display =
  derivedDisplay;
declare const excessDisplay: Exclude<
  typeof EntityType.mediaItem.display,
  'Media Item'
>;
export const displayIsExact: never = excessDisplay;

// extras stay literal without the consumer writing `as const`
declare const excessTable: Exclude<typeof EntityType.album.table, 'albums'>;
export const tableIsLiteral: never = excessTable;
declare const excessSoft: Exclude<typeof EntityType.album.soft, true>;
export const softIsLiteral: never = excessSoft;

// -- missing key is a compile error -------------------------------------------

// @ts-expect-error `mediaItem` is missing
export const missingKeyInput = defineEntityTypeInput({
  album: { table: 'albums' },
  authorization: { table: 'auth' },
  comment: { table: 'comments' },
  reaction: { table: 'reactions' },
  user: { table: 'users' },
});

// -- unknown key is a compile error (the case a naive constraint misses) ------

export const unknownKeyInput = defineEntityTypeInput({
  album: { table: 'albums' },
  authorization: { table: 'auth' },
  comment: { table: 'comments' },
  mediaItem: { table: 'media' },
  reaction: { table: 'reactions' },
  user: { table: 'users' },
  // @ts-expect-error `ghost` is not a schema value
  ghost: {},
});

// -- explicit `value` override wins over the derived value --------------------

const overriddenInput = defineEntityTypeInput({
  album: { value: 'OVERRIDE' },
  authorization: {},
  comment: {},
  mediaItem: {},
  reaction: {},
  user: {},
});
export const Overridden = enumeration<typeof overriddenInput>('EntityType', {
  input: overriddenInput,
});
declare const excessOverride: Exclude<
  typeof Overridden.album.value,
  'OVERRIDE'
>;
export const overrideWins: never = excessOverride;

// -- the keys type matches the schema key set exactly -------------------------

declare const excessKey: Exclude<
  EntityTypeKeys,
  'album' | 'authorization' | 'comment' | 'mediaItem' | 'reaction' | 'user'
>;
export const keysAreExact: never = excessKey;
