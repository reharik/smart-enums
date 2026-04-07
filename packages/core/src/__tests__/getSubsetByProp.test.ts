import { enumeration, getSubsetByProp, subsetByProp } from '../index.js';

describe('getSubsetByProp', () => {
  const AppErrorEnum = enumeration('AppError', {
    input: {
      albumNotFound: {
        value: 'ALBUM_NOT_FOUND',
        display: 'Album not found',
        source: 'album',
      },
      mediaItemNotFound: {
        value: 'MEDIA_ITEM_NOT_FOUND',
        display: 'Media item not found',
        source: 'mediaItem',
      },
    } as const,
  });

  describe('When filtering by source', () => {
    it('should expose only matching members by key and reuse item references', () => {
      const mediaOnly = getSubsetByProp(
        AppErrorEnum,
        'source',
        'mediaItem' as const,
      );

      expect(Object.keys(mediaOnly).sort()).toEqual(
        [
          'fromKey',
          'fromValue',
          'items',
          'keys',
          'mediaItemNotFound',
          'tryFromKey',
          'tryFromValue',
          'values',
        ].sort(),
      );
      expect(mediaOnly.mediaItemNotFound).toBe(AppErrorEnum.mediaItemNotFound);
      expect(
        Object.prototype.hasOwnProperty.call(mediaOnly, 'albumNotFound'),
      ).toBe(false);
    });

    it('should resolve lookups only within the subset', () => {
      const mediaOnly = getSubsetByProp(
        AppErrorEnum,
        'source',
        'mediaItem' as const,
      );

      expect(mediaOnly.fromValue('MEDIA_ITEM_NOT_FOUND')).toBe(
        AppErrorEnum.mediaItemNotFound,
      );
      expect(mediaOnly.fromKey('mediaItemNotFound')).toBe(
        AppErrorEnum.mediaItemNotFound,
      );
      expect(() => mediaOnly.fromValue('ALBUM_NOT_FOUND')).toThrow();
      expect(mediaOnly.tryFromValue('ALBUM_NOT_FOUND')).toBeUndefined();
      expect(mediaOnly.tryFromKey('albumNotFound')).toBeUndefined();
    });

    it('should list values and keys for the subset only', () => {
      const albumOnly = getSubsetByProp(
        AppErrorEnum,
        'source',
        'album' as const,
      );

      expect(albumOnly.items()).toHaveLength(1);
      expect(albumOnly.items()[0]).toBe(AppErrorEnum.albumNotFound);
      expect(albumOnly.values()).toEqual(['ALBUM_NOT_FOUND']);
      expect(albumOnly.keys()).toEqual(['albumNotFound']);
    });

    it('should support subsetByProp curried form with same behavior as getSubsetByProp', () => {
      const bySource = subsetByProp('source');
      const mediaOnly = bySource(AppErrorEnum, 'mediaItem' as const);

      expect(mediaOnly.mediaItemNotFound).toBe(AppErrorEnum.mediaItemNotFound);
      expect(mediaOnly.fromValue('MEDIA_ITEM_NOT_FOUND')).toBe(
        AppErrorEnum.mediaItemNotFound,
      );
    });
  });
});
