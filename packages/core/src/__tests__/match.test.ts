import { Enumeration, enumeration, pickEnum } from '../index.js';

describe('match', () => {
  const Media = enumeration('MediaEvent', {
    input: ['comment', 'mediaItem', 'album'] as const,
  });
  type MediaItem = Enumeration<typeof Media>;

  describe('runtime', () => {
    it('dispatches to the correct arm by key', () => {
      const dispatch = (item: MediaItem) =>
        item.match({
          comment: () => 'C',
          mediaItem: () => 'M',
          album: () => 'A',
        });

      expect(dispatch(Media.comment)).toBe('C');
      expect(dispatch(Media.mediaItem)).toBe('M');
      expect(dispatch(Media.album)).toBe('A');
    });

    it('passes the item to the matched handler', () => {
      let received: unknown;
      Media.comment.match({
        comment: i => {
          received = i;
          return i.key;
        },
      });

      expect(received).toBe(Media.comment);
    });

    it("returns the matched arm's return value", () => {
      const out = Media.mediaItem.match({
        mediaItem: () => ({ tag: 'media' }),
      });

      expect(out).toEqual({ tag: 'media' });
    });

    it('returns a promise when the matched arm is async', async () => {
      const result = Media.comment.match({
        comment: async () => 42,
      });

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBe(42);
    });

    it("throws when called on an item whose key has no handler (wire-lie guard)", () => {
      // Force a handler set missing the 'album' arm onto an album item — the
      // shape a deserialized/forged item would produce at a trust boundary.
      const handlers = {
        comment: () => 1,
        mediaItem: () => 2,
      } as unknown as Parameters<typeof Media.album.match>[0];

      expect(() => Media.album.match(handlers)).toThrow(
        "match: no handler for 'album' on enum 'MediaEvent'",
      );
    });
  });

  describe('type-level', () => {
    it('requires every arm for a full enum item', () => {
      const item: MediaItem = Media.fromKey('comment');

      // @ts-expect-error — missing the 'album' arm
      item.match({ comment: () => 1, mediaItem: () => 2 });

      // exhaustive form compiles
      item.match({ comment: () => 1, mediaItem: () => 2, album: () => 3 });

      expect(true).toBe(true);
    });

    it('rejects an unknown/extra arm', () => {
      const item: MediaItem = Media.fromKey('comment');

      item.match({
        comment: () => 1,
        mediaItem: () => 2,
        album: () => 3,
        // @ts-expect-error — 'bogus' is not a member key
        bogus: () => 4,
      });

      expect(true).toBe(true);
    });

    it("narrows each handler's item argument to that member", () => {
      const item: MediaItem = Media.fromKey('comment');

      item.match({
        comment: i => {
          // compiles only if i.key is narrowed to the literal 'comment'
          const key: 'comment' = i.key;
          void key;
        },
        mediaItem: i => {
          const key: 'mediaItem' = i.key;
          void key;
        },
        album: i => {
          const key: 'album' = i.key;
          void key;
        },
      });

      expect(true).toBe(true);
    });

    it('over a pickEnum view requires exactly the picked arms (pick ∘ match)', () => {
      const view = pickEnum(Media, ['comment', 'mediaItem'] as const);
      const pItem = view.fromKey('comment');

      // @ts-expect-error — missing the picked 'mediaItem' arm
      pItem.match({ comment: () => 1 });

      pItem.match({
        comment: () => 1,
        mediaItem: () => 2,
        // @ts-expect-error — 'album' is not in the picked subset
        album: () => 3,
      });

      // exactly the picked arms compiles
      pItem.match({ comment: () => 1, mediaItem: () => 2 });

      expect(true).toBe(true);
    });
  });
});
