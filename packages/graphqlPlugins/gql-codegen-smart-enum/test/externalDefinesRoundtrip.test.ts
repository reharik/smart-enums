import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  defineEntityType,
  entityTypeKeys,
} from './fixtures/entityTypeDefines.js';

describe('externalDefines consumer round-trip', () => {
  describe('When a hand-written enum is defined through the emitted factory', () => {
    // Imports resolve and the factory runs at module scope without a TDZ
    // crash because the defines output imports no user code.
    const EntityType = defineEntityType({
      album: { table: 'albums', soft: true },
      authorization: { table: 'auth', soft: false },
      comment: { table: 'comments', soft: true },
      mediaItem: { table: 'media', soft: false },
      reaction: { table: 'reactions', soft: true },
      user: { table: 'users', soft: false },
    });

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
    it('should import nothing but @reharik/smart-enum', () => {
      const source = readFileSync(
        path.resolve(process.cwd(), 'test/fixtures/entityTypeDefines.ts'),
        'utf8',
      );

      const importSpecifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map(
        match => match[1],
      );

      expect(importSpecifiers).toEqual(['@reharik/smart-enum']);
    });
  });
});
