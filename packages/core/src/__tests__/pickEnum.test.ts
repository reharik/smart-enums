import { enumeration, EnumFromNormalizedObject, pickEnum } from '../index.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

describe('pickEnum', () => {
  const EntityType = enumeration('EntityType', {
    input: ['comment', 'mediaItem', 'album'] as const,
  });
  describe('runtime', () => {
    it('reuses parent item references (not clones)', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

      expect(view.comment).toBe(EntityType.comment);
      expect(view.mediaItem).toBe(EntityType.mediaItem);
    });

    it('scopes items()/keys()/values() to the subset', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

      expect(view.items()).toHaveLength(2);
      expect(view.items()).toEqual([EntityType.comment, EntityType.mediaItem]);
      expect(view.keys()).toEqual(['comment', 'mediaItem']);
      expect(view.values()).toEqual(['COMMENT', 'MEDIA_ITEM']);
    });

    it('resolves lookups only within the subset', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

      expect(view.fromKey('mediaItem')).toBe(EntityType.mediaItem);
      expect(view.tryFromKey('album')).toBeUndefined();
      expect(() => view.fromValue('ALBUM')).toThrow();
    });

    it('equals works across parent and view', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

      expect(view.comment.equals(EntityType.comment)).toBe(true);
      expect(view.equals(view.comment, EntityType.comment)).toBe(true);
      expect(view.comment.equals(EntityType.mediaItem)).toBe(false);
    });

    it('leaves the parent enum unchanged', () => {
      pickEnum(EntityType, ['comment', 'mediaItem'] as const);

      expect(EntityType.items()).toHaveLength(3);
      expect(EntityType.keys()).toEqual(['comment', 'mediaItem', 'album']);
    });

    it("keeps the parent's __smart_enum_type on a picked item (identity not forked)", () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

      expect(view.comment.toJSON()).toEqual({
        __smart_enum_type: 'EntityType',
        value: 'COMMENT',
      });
    });
  });

  describe('type-level', () => {
    it('produces a discriminated union that excludes unpicked members', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);
      type Picked = ReturnType<typeof view.fromKey>;
      type AlbumItem = typeof EntityType.album;

      // an unpicked member is not assignable to the picked union
      type AlbumExcluded = Expect<
        Equal<AlbumItem extends Picked ? true : false, false>
      >;
      // ...while a picked member is
      type CommentIncluded = Expect<
        Equal<typeof EntityType.comment extends Picked ? true : false, true>
      >;

      expect(true).toBe(true as AlbumExcluded);
      expect(true).toBe(true as CommentIncluded);
    });

    it('carries literal key/value types on picked items', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);
      type Picked = ReturnType<typeof view.fromKey>;
      type CommentItem = Extract<Picked, { key: 'comment' }>;

      type KeyIsLiteral = Expect<Equal<CommentItem['key'], 'comment'>>;
      type ValueIsLiteral = Expect<Equal<CommentItem['value'], 'COMMENT'>>;

      expect(true).toBe(true as KeyIsLiteral);
      expect(true).toBe(true as ValueIsLiteral);
    });

    it('rejects a typo in the key list', () => {
      // @ts-expect-error — 'commnet' is not a member key of EntityType
      pickEnum(EntityType, ['commnet'] as const);

      expect(true).toBe(true);
    });

    it('makes a switch over the picked union exhaustive with only picked arms', () => {
      const view = pickEnum(EntityType, ['comment', 'mediaItem'] as const);
      type Picked = ReturnType<typeof view.fromKey>;

      const label = (item: Picked): string => {
        switch (item.key) {
          case 'comment':
            return 'c';
          case 'mediaItem':
            return 'm';
          default: {
            // reached only if the union were wider than the picked arms
            const unreachable: never = item;
            return unreachable;
          }
        }
      };

      expect(label(view.comment)).toBe('c');
      expect(label(view.mediaItem)).toBe('m');
    });
  });
});
