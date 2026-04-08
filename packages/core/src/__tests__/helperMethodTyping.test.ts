import {
  type Enumeration,
  enumeration,
  getSubsetByProp,
  subsetByProp,
} from '../index.js';
import type { SmartEnumLike } from '../types.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

describe('Helper method typing', () => {
  describe('When using helper lookup methods', () => {
    it('should return the enum member union type', () => {
      const MediaItemStatus = enumeration('MediaItemStatus', {
        input: {
          failed: { value: 'FAILED' },
          pending: { value: 'PENDING' },
          ready: { value: 'READY' },
        } as const,
      });

      type MediaItemStatusItem = Enumeration<typeof MediaItemStatus>;
      type FromValue = ReturnType<typeof MediaItemStatus.fromValue>;
      type TryFromValue = ReturnType<typeof MediaItemStatus.tryFromValue>;
      type FromKey = ReturnType<typeof MediaItemStatus.fromKey>;
      type TryFromKey = ReturnType<typeof MediaItemStatus.tryFromKey>;
      type Items = ReturnType<typeof MediaItemStatus.items>;

      const status: MediaItemStatusItem = MediaItemStatus.fromValue('READY');
      const maybeStatus: MediaItemStatusItem | undefined =
        MediaItemStatus.tryFromValue('READY');
      const byKey: MediaItemStatusItem = MediaItemStatus.fromKey('ready');
      const items: readonly MediaItemStatusItem[] = MediaItemStatus.items();

      expect(status.value).toBe('READY');
      expect(maybeStatus?.value).toBe('READY');
      expect(byKey.key).toBe('ready');
      expect(items).toHaveLength(3);

      type FromValueIsUnion = Expect<Equal<FromValue, MediaItemStatusItem>>;
      type TryFromValueIsUnion = Expect<
        Equal<TryFromValue, MediaItemStatusItem | undefined>
      >;
      type FromKeyIsUnion = Expect<Equal<FromKey, MediaItemStatusItem>>;
      type TryFromKeyIsUnion = Expect<
        Equal<TryFromKey, MediaItemStatusItem | undefined>
      >;
      type ItemsAreUnionArray = Expect<
        Equal<Items, readonly MediaItemStatusItem[]>
      >;

      // compile-time only assertions
      expect(true).toBe(true as FromValueIsUnion);
      expect(true).toBe(true as TryFromValueIsUnion);
      expect(true).toBe(true as FromKeyIsUnion);
      expect(true).toBe(true as TryFromKeyIsUnion);
      expect(true).toBe(true as ItemsAreUnionArray);
    });

    it('should preserve per-member extras and allow Extract by extra field', () => {
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

      type ItemUnion = ReturnType<typeof AppErrorEnum.items>[number];
      type MediaOnly = Extract<ItemUnion, { source: 'mediaItem' }>;

      type AlbumKey = Expect<
        Equal<(typeof AppErrorEnum)['albumNotFound']['key'], 'albumNotFound'>
      >;
      type AlbumValue = Expect<
        Equal<
          (typeof AppErrorEnum)['albumNotFound']['value'],
          'ALBUM_NOT_FOUND'
        >
      >;
      type AlbumSource = Expect<
        Equal<(typeof AppErrorEnum)['albumNotFound']['source'], 'album'>
      >;
      type MediaSource = Expect<
        Equal<(typeof AppErrorEnum)['mediaItemNotFound']['source'], 'mediaItem'>
      >;
      type MediaExtractKey = Expect<
        Equal<MediaOnly['key'], 'mediaItemNotFound'>
      >;
      type MediaExtractNotNever = Expect<
        Equal<[MediaOnly] extends [never] ? false : true, true>
      >;

      expect(AppErrorEnum.albumNotFound.source).toBe('album');
      expect(AppErrorEnum.mediaItemNotFound.source).toBe('mediaItem');
      expect(true).toBe(true as AlbumKey);
      expect(true).toBe(true as AlbumValue);
      expect(true).toBe(true as AlbumSource);
      expect(true).toBe(true as MediaSource);
      expect(true).toBe(true as MediaExtractKey);
      expect(true).toBe(true as MediaExtractNotNever);
    });

    it('should preserve literal value inference for array-input enums', () => {
      const ArrayTestEnum = enumeration('ArrayTest', {
        input: ['one', 'two'] as const,
      });

      type Item = ReturnType<typeof ArrayTestEnum.items>[number];

      type OneValue = Expect<
        Equal<Extract<Item, { key: 'one' }>['value'], 'ONE'>
      >;
      type TwoValue = Expect<
        Equal<Extract<Item, { key: 'two' }>['value'], 'TWO'>
      >;

      expect(ArrayTestEnum.one.value).toBe('ONE');
      expect(ArrayTestEnum.two.value).toBe('TWO');
      expect(true).toBe(true as OneValue);
      expect(true).toBe(true as TwoValue);
    });

    it('should narrow getSubsetByProp by extra field and exclude other member keys', () => {
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

      const mediaItemErrors = getSubsetByProp(
        AppErrorEnum,
        'source',
        'mediaItem' as const,
      );

      type Sub = typeof mediaItemErrors;
      type FullItem = Enumeration<typeof AppErrorEnum>;
      type MediaItem = Extract<FullItem, { source: 'mediaItem' }>;

      type AlbumKeyAbsent = Expect<
        Equal<'albumNotFound' extends keyof Sub ? true : false, false>
      >;
      type MediaKeyPresent = Expect<
        Equal<'mediaItemNotFound' extends keyof Sub ? true : false, true>
      >;
      type FromValueIsMediaOnly = Expect<
        Equal<ReturnType<Sub['fromValue']>, MediaItem>
      >;
      type FromKeyIsMediaOnly = Expect<
        Equal<ReturnType<Sub['fromKey']>, MediaItem>
      >;
      type TryFromValueIsMediaOnly = Expect<
        Equal<ReturnType<Sub['tryFromValue']>, MediaItem | undefined>
      >;
      type ItemsElement = Expect<
        Equal<ReturnType<Sub['items']>[number], MediaItem>
      >;

      expect(mediaItemErrors.mediaItemNotFound).toBe(
        AppErrorEnum.mediaItemNotFound,
      );
      expect(true).toBe(true as AlbumKeyAbsent);
      expect(true).toBe(true as MediaKeyPresent);
      expect(true).toBe(true as FromValueIsMediaOnly);
      expect(true).toBe(true as FromKeyIsMediaOnly);
      expect(true).toBe(true as TryFromValueIsMediaOnly);
      expect(true).toBe(true as ItemsElement);
    });

    it('should produce the same narrowed type for curried subsetByProp as getSubsetByProp', () => {
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

      const direct = getSubsetByProp(
        AppErrorEnum,
        'source',
        'mediaItem' as const,
      );
      const bySource = subsetByProp('source');
      const curried = bySource(AppErrorEnum, 'mediaItem' as const);

      type SameShape = Expect<Equal<typeof direct, typeof curried>>;

      expect(direct.mediaItemNotFound).toBe(curried.mediaItemNotFound);
      expect(true).toBe(true as SameShape);
    });

    it('should reject invalid curried value for a known prop', () => {
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

      const bySource = subsetByProp('source');
      // @ts-expect-error — source is only 'album' | 'mediaItem' on these items
      bySource(AppErrorEnum, 'invalidSource' as const);

      expect(true).toBe(true);
    });

    it('should reject non-never value when curried prop is not an item field', () => {
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

      const byUnknown = subsetByProp('notAField' as const);
      // @ts-expect-error — V extends never; no string is assignable
      byUnknown(AppErrorEnum, 'x' as const);

      expect(true).toBe(true);
    });

    it('should derive literal value and display from member key when built-ins omitted', () => {
      const ContractError = enumeration('ContractError', {
        input: {
          MediaItemNotReady: {
            code: 'MEDIA_ITEM_NOT_READY',
            category: 'domain',
            area: 'mediaItem',
            retryable: false,
          },
        } as const,
      });

      type M = (typeof ContractError)['MediaItemNotReady'];

      type KeyOk = Expect<Equal<M['key'], 'MediaItemNotReady'>>;
      type ValueOk = Expect<Equal<M['value'], 'MEDIA_ITEM_NOT_READY'>>;
      type DisplayOk = Expect<Equal<M['display'], 'Media Item Not Ready'>>;
      type CodeOk = Expect<Equal<M['code'], 'MEDIA_ITEM_NOT_READY'>>;

      expect(ContractError.MediaItemNotReady.value).toBe(
        'MEDIA_ITEM_NOT_READY',
      );
      expect(ContractError.MediaItemNotReady.display).toBe(
        'Media Item Not Ready',
      );
      expect(true).toBe(true as KeyOk);
      expect(true).toBe(true as ValueOk);
      expect(true).toBe(true as DisplayOk);
      expect(true).toBe(true as CodeOk);
    });

    it('should keep explicit value and display literals when provided on object input', () => {
      const E = enumeration('E', {
        input: {
          a: {
            value: 'CUSTOM_VALUE',
            display: 'Custom Label',
            extra: 1,
          },
        } as const,
      });
      type A = (typeof E)['a'];
      type V = Expect<Equal<A['value'], 'CUSTOM_VALUE'>>;
      type D = Expect<Equal<A['display'], 'Custom Label'>>;
      expect(E.a.value).toBe('CUSTOM_VALUE');
      expect(E.a.display).toBe('Custom Label');
      expect(true).toBe(true as V);
      expect(true).toBe(true as D);
    });

    it('should type enumeration results as SmartEnumLike with narrowed values() and keys()', () => {
      const LetterEnum = enumeration('LetterEnum', {
        input: ['a', 'b'] as const,
      });

      type Item = Enumeration<typeof LetterEnum>;

      type IsSmartEnumLike = Expect<
        Equal<
          typeof LetterEnum extends SmartEnumLike<Item> ? true : false,
          true
        >
      >;
      type ValuesTuple = Expect<
        Equal<ReturnType<(typeof LetterEnum)['values']>, readonly ('A' | 'B')[]>
      >;
      type KeysTuple = Expect<
        Equal<ReturnType<(typeof LetterEnum)['keys']>, readonly ('a' | 'b')[]>
      >;

      expect(LetterEnum.values()).toEqual(['A', 'B']);
      expect(LetterEnum.keys()).toEqual(['a', 'b']);
      expect(true).toBe(true as IsSmartEnumLike);
      expect(true).toBe(true as ValuesTuple);
      expect(true).toBe(true as KeysTuple);
    });
  });
});
