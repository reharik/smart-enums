import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { enumeration } from '@reharik/smart-enum';

import {
  defineEntityTypeInput,
  entityTypeKeys,
} from './fixtures/entityTypeDefines.js';

describe('externalDefines consumer round-trip', () => {
  describe('When a hand-written enum is built from the pinned input', () => {
    // This mirrors the documented consumer pattern: the emitted function pins
    // the input's key set, then the enum is declared like any other smart
    // enum. The fixture is the enums output for an all-external schema, which
    // imports nothing — so everything runs at module scope without a TDZ crash.
    const input = defineEntityTypeInput({
      album: { table: 'albums', soft: true },
      authorization: { table: 'auth', soft: false },
      comment: { table: 'comments', soft: true },
      mediaItem: { table: 'media', soft: false },
      reaction: { table: 'reactions', soft: true },
      user: { table: 'users', soft: false },
    });
    const EntityType = enumeration<typeof input>('EntityType', { input });

    it('should expose the schema key list in schema order', () => {
      expect(entityTypeKeys).toEqual([
        'album',
        'authorization',
        'comment',
        'mediaItem',
        'reaction',
        'user',
      ]);
    });

    it('should return the input unchanged', () => {
      expect(input.album).toEqual({ table: 'albums', soft: true });
    });

    it('should derive wire values and displays from the key', () => {
      expect(EntityType.mediaItem.value).toBe('MEDIA_ITEM');
      expect(EntityType.mediaItem.display).toBe('Media Item');
      expect(EntityType.album.value).toBe('ALBUM');
    });

    it('should carry per-member extras through to the enum items', () => {
      expect(EntityType.album.table).toBe('albums');
      expect(EntityType.album.soft).toBe(true);
      expect(EntityType.user.table).toBe('users');
    });

    it('should behave as a full smart enum', () => {
      expect(EntityType.keys()).toContain('mediaItem');
      expect(EntityType.fromValue('REACTION')).toBe(EntityType.reaction);
    });
  });

  describe('When inspecting the emitted defines module source', () => {
    it('should import nothing at all', () => {
      const source = readFileSync(
        path.resolve(process.cwd(), 'test/fixtures/entityTypeDefines.ts'),
        'utf8',
      );

      const importSpecifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map(
        match => match[1],
      );

      // The @example JSDoc mentions '@reharik/smart-enum'; only real import
      // statements count.
      const realImports = [
        ...source.matchAll(/^import .+ from '([^']+)';$/gm),
      ].map(match => match[1]);

      expect(realImports).toEqual([]);
      expect(importSpecifiers).toEqual(['@reharik/smart-enum']);
    });
  });
});
