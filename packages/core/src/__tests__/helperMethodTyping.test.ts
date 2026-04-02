import { type Enumeration, enumeration } from '../index.js';

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
  });
});
