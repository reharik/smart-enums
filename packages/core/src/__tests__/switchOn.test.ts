import {
  type Enumeration,
  enumeration,
  getSubsetByProp,
  omitEnum,
  pickEnum,
} from '../index.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

const Kind = enumeration('SwitchOnKind', {
  input: ['comment', 'mediaItem', 'album'] as const,
});
type KindItem = Enumeration<typeof Kind>;

const Status = enumeration('SwitchOnStatus', {
  input: ['draft', 'sent'] as const,
});
type StatusItem = Enumeration<typeof Status>;

// Interface-based (not type-literal) union on purpose: guards against the
// `T extends Record<string, unknown>` regression — interfaces have no implicit
// index signature, so that constraint would reject every one of these.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface CommentRow {
  kind: typeof Kind.comment;
  body: string;
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface MediaRow {
  kind: typeof Kind.mediaItem;
  url: string;
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface AlbumRow {
  kind: typeof Kind.album;
  photoCount: number;
}
type Row = CommentRow | MediaRow | AlbumRow;

const commentRow: CommentRow = { kind: Kind.comment, body: 'hi' };
const mediaRow: MediaRow = { kind: Kind.mediaItem, url: 'http://x' };
const albumRow: AlbumRow = { kind: Kind.album, photoCount: 3 };

const label = (row: Row): string =>
  Kind.switchOn(row, 'kind', {
    comment: v => `comment:${v.body}`,
    mediaItem: v => `media:${v.url}`,
    album: v => `album:${v.photoCount}`,
  });

// Loosened alias for forging invalid calls in runtime-failure tests.
// switchOn's runtime never touches `this`, so taking it unbound is safe.
// eslint-disable-next-line @typescript-eslint/unbound-method
const unsafeSwitchOn = Kind.switchOn as (
  obj: unknown,
  prop: string,
  handlers: Record<string, (v: unknown) => unknown>,
) => unknown;

// Compile-only (never invoked): both calls are type errors, and would also
// throw at runtime.
const rejectedPropsCompileOnly = () => {
  // prettier-ignore
  // @ts-expect-error — 'body' holds a string, not a member of Kind
  Kind.switchOn(commentRow, 'body', {} as never);

  const mixed: { kind: KindItem; status: StatusItem } = {
    kind: Kind.comment,
    status: Status.draft,
  };

  // prettier-ignore
  // @ts-expect-error — 'status' holds a member of a *different* enum
  Kind.switchOn(mixed, 'status', {} as never);
};

describe('switchOn', () => {
  describe('runtime', () => {
    it('dispatches the arm matching the member held at prop', () => {
      expect(label(commentRow)).toBe('comment:hi');
      expect(label(mediaRow)).toBe('media:http://x');
      expect(label(albumRow)).toBe('album:3');
    });

    it('passes the object (not the member) to the arm', () => {
      let received: unknown;
      Kind.switchOn(commentRow as Row, 'kind', {
        comment: v => {
          received = v;
          return 0;
        },
        mediaItem: () => 0,
        album: () => 0,
      });

      expect(received).toBe(commentRow);
    });

    it('throws with the member key and prop name when an arm is missing (wire-lie guard)', () => {
      expect(() =>
        unsafeSwitchOn(albumRow, 'kind', { comment: () => 1 }),
      ).toThrow("switchOn: no arm for 'album' on 'kind'");
    });

    it('throws a TypeError when prop does not hold a smart-enum member', () => {
      expect(() => unsafeSwitchOn({ kind: 'comment' }, 'kind', {})).toThrow(
        TypeError,
      );
      expect(() => unsafeSwitchOn({ kind: 'comment' }, 'kind', {})).toThrow(
        "switchOn: 'kind' does not hold a smart-enum member",
      );
      expect(() => unsafeSwitchOn(undefined, 'kind', {})).toThrow(TypeError);
    });

    it('dispatches for a foreign-but-branded member (duplicate-package simulation)', () => {
      const foreign = {
        __smart_enum_brand: true,
        __smart_enum_type: 'SwitchOnKind',
        key: 'comment',
        value: 'COMMENT',
      };

      const out = unsafeSwitchOn({ kind: foreign }, 'kind', {
        comment: () => 'hit',
      });

      expect(out).toBe('hit');
    });
  });

  describe('type-level', () => {
    it('narrows each arm to the exact variant of the union', () => {
      // `as Row` defeats assignment narrowing, which would otherwise collapse
      // the union (and the required arm set) to just CommentRow.
      const row = commentRow as Row;

      Kind.switchOn(row, 'kind', {
        comment: v => {
          const exact: Expect<Equal<typeof v, CommentRow>> = true;
          void exact;
          const body: string = v.body;
          return body;
        },
        mediaItem: v => {
          const exact: Expect<Equal<typeof v, MediaRow>> = true;
          void exact;
          return v.url;
        },
        album: v => {
          const exact: Expect<Equal<typeof v, AlbumRow>> = true;
          void exact;
          return String(v.photoCount);
        },
      });

      Kind.switchOn(row, 'kind', {
        comment: v => {
          // @ts-expect-error — v is CommentRow, not never
          const probe: never = v;
          return probe;
        },
        mediaItem: () => 0,
        album: () => 0,
      });

      expect(true).toBe(true);
    });

    it('requires every arm and rejects extras', () => {
      const row = commentRow as Row;

      // prettier-ignore
      // @ts-expect-error — missing the 'album' arm
      Kind.switchOn(row, 'kind', { comment: () => 1, mediaItem: () => 2 });

      Kind.switchOn(row, 'kind', {
        comment: () => 1,
        mediaItem: () => 2,
        album: () => 3,
        // @ts-expect-error — 'bogus' is not a member key
        bogus: () => 4,
      });

      expect(true).toBe(true);
    });

    it('rejects a prop that does not hold a member of this enum', () => {
      void rejectedPropsCompileOnly;
      expect(true).toBe(true);
    });

    it('types arms as T (not never) for a single-shape object', () => {
      type Mixed = { kind: KindItem; status: StatusItem };
      const mixed: Mixed = { kind: Kind.comment, status: Status.draft };

      const out = Kind.switchOn(mixed, 'kind', {
        comment: v => {
          const fallsBackToT: Expect<Equal<typeof v, Mixed>> = true;
          void fallsBackToT;
          return v.status.key;
        },
        mediaItem: v => v.status.key,
        album: v => v.status.key,
      });

      expect(out).toBe('draft');
    });

    it('gives a loud property error (not silent never) for a base interface with subtypes', () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
      interface BaseNode {
        kind: KindItem;
      }
      const base: BaseNode = commentRow;

      Kind.switchOn(base, 'kind', {
        comment: v => {
          const fallsBackToBase: Expect<Equal<typeof v, BaseNode>> = true;
          void fallsBackToBase;
          // @ts-expect-error — 'body' does not exist on BaseNode
          return v.body;
        },
        mediaItem: () => 0,
        album: () => 0,
      });

      expect(true).toBe(true);
    });

    it('scopes subset-view arms to the subset (pickEnum)', () => {
      const Picked = pickEnum(Kind, ['comment', 'mediaItem'] as const);
      type PickedRow = CommentRow | MediaRow;
      const row = commentRow as PickedRow;

      const out = Picked.switchOn(row, 'kind', {
        comment: v => v.body,
        mediaItem: v => v.url,
      });
      expect(out).toBe('hi');

      Picked.switchOn(row, 'kind', {
        comment: () => 1,
        mediaItem: () => 2,
        // @ts-expect-error — 'album' is not in the picked subset
        album: () => 3,
      });
    });

    it('scopes subset-view arms to the subset (omitEnum)', () => {
      const NonAlbum = omitEnum(Kind, ['album'] as const);
      type NonAlbumRow = CommentRow | MediaRow;
      const row = mediaRow as NonAlbumRow;

      const out = NonAlbum.switchOn(row, 'kind', {
        comment: v => v.body,
        mediaItem: v => v.url,
      });
      expect(out).toBe('http://x');

      NonAlbum.switchOn(row, 'kind', {
        comment: () => 1,
        mediaItem: () => 2,
        // @ts-expect-error — 'album' was omitted from this view
        album: () => 3,
      });
    });

    it('exposes a working switchOn on getSubsetByProp views', () => {
      const AppError = enumeration('SwitchOnAppError', {
        input: {
          albumNotFound: { source: 'album' },
          mediaItemNotFound: { source: 'mediaItem' },
        } as const,
      });
      const MediaErrors = getSubsetByProp(AppError, 'source', 'mediaItem');

      const failure: {
        err: typeof AppError.mediaItemNotFound;
        detail: string;
      } = { err: AppError.mediaItemNotFound, detail: 'boom' };

      const out = MediaErrors.switchOn(failure, 'err', {
        mediaItemNotFound: v => v.detail,
      });

      expect(out).toBe('boom');
    });
  });
});
