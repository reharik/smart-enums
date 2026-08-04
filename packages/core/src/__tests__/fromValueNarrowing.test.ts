import { type Enumeration, enumeration, omitEnum, pickEnum } from '../index.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

const Kind = enumeration('FromValueKind', {
  input: ['comment', 'mediaItem', 'album'] as const,
});
type KindItem = Enumeration<typeof Kind>;

// Compile-only (never invoked): an unknown literal falls back to the full
// union rather than erroring or typing as never — the runtime throw below is
// the only signal for a bad literal.
const unknownLiteralFallsBack = () => {
  const item = Kind.fromValue('NOT_A_VALUE');
  const fallsBack: Expect<Equal<typeof item, KindItem>> = true;
  void fallsBack;
  return item;
};
void unknownLiteralFallsBack;

describe('fromValue literal narrowing', () => {
  it('returns the exact member type for a string literal', () => {
    const item = Kind.fromValue('COMMENT');

    const exact: Expect<Equal<typeof item, typeof Kind.comment>> = true;
    const key: 'comment' = item.key;

    expect(exact).toBe(true);
    expect(key).toBe('comment');
    expect(item).toBe(Kind.comment);
  });

  it('returns the full member union for a widened string (revival/wire call sites)', () => {
    const wire: string = 'MEDIA_ITEM';
    const item = Kind.fromValue(wire);

    const union: Expect<Equal<typeof item, KindItem>> = true;

    expect(union).toBe(true);
    expect(item).toBe(Kind.mediaItem);
  });

  it('still throws at runtime for an unknown value', () => {
    expect(() => Kind.fromValue('NOT_A_VALUE')).toThrow(
      "No enum value found for 'NOT_A_VALUE'",
    );
  });

  it('narrows on subset views too, scoped to the subset', () => {
    const Picked = pickEnum(Kind, ['comment', 'mediaItem'] as const);
    const picked = Picked.fromValue('COMMENT');
    const pickedExact: Expect<Equal<typeof picked, typeof Kind.comment>> = true;
    expect(pickedExact).toBe(true);
    expect(picked).toBe(Kind.comment);

    const NonAlbum = omitEnum(Kind, ['album'] as const);
    const wire: string = 'MEDIA_ITEM';
    const fromWire = NonAlbum.fromValue(wire);
    const subsetUnion: Expect<
      Equal<typeof fromWire, typeof Kind.comment | typeof Kind.mediaItem>
    > = true;
    expect(subsetUnion).toBe(true);
    expect(fromWire).toBe(Kind.mediaItem);
  });
});
