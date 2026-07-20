import { enumeration } from '../index.js';
import type { Enumeration, SmartEnumItem } from '../types.js';

/**
 * Regression guard for the *display shape* of enum members.
 *
 * Enum members are deliberately typed as references to the generic interface
 * {@link SmartEnumItem} rather than an intersection of anonymous object types, so
 * editors show a single named line on hover — e.g.
 * `SmartEnumItem<"EventType", "commentPosted", "COMMENT_POSTED", "Comment Posted">`
 * — with the enum name first, instead of expanding every field.
 *
 * These are compile-time assertions: if a refactor makes a member resolve to a
 * bare intersection / anonymous object again (reintroducing the hover noise),
 * the strict `Equal` checks below stop compiling and this suite fails to build.
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

describe('enum member type display', () => {
  const EventType = enumeration('EventType', {
    input: {
      commentPosted: { value: 'COMMENT_POSTED', display: 'Comment Posted' },
      replyPosted: { value: 'REPLY_POSTED', display: 'Reply Posted' },
    },
  });
  type EventType = Enumeration<typeof EventType>;

  it('resolves a concrete member to a named SmartEnumItem reference', () => {
    type Member = typeof EventType.commentPosted;
    type _member = Expect<
      Equal<
        Member,
        SmartEnumItem<
          'EventType',
          'commentPosted',
          'COMMENT_POSTED',
          'Comment Posted'
        >
      >
    >;
    // touch the type-only symbol so it is not reported as unused
    const _keep: _member = true;
    expect(_keep).toBe(true);
  });

  it('resolves the member union to a union of SmartEnumItem references', () => {
    type _union = Expect<
      Equal<
        EventType,
        | SmartEnumItem<
            'EventType',
            'commentPosted',
            'COMMENT_POSTED',
            'Comment Posted'
          >
        | SmartEnumItem<
            'EventType',
            'replyPosted',
            'REPLY_POSTED',
            'Reply Posted'
          >
      >
    >;
    const _keep: _union = true;
    expect(_keep).toBe(true);
  });

  it('derives value/display literals for string-array input', () => {
    const Status = enumeration('Status', {
      input: ['active', 'inactive'] as const,
    });

    type _active = Expect<
      Equal<
        typeof Status.active,
        SmartEnumItem<'Status', 'active', 'ACTIVE', 'Active'>
      >
    >;
    const _keep: _active = true;
    expect(_keep).toBe(true);
    expect(Status.active.value).toBe('ACTIVE');
    expect(Status.active.display).toBe('Active');
  });

  it('keeps the name and appends only extra fields when a member has extras', () => {
    const Weighted = enumeration('Weighted', {
      input: {
        low: { weight: 1 },
        high: { weight: 9 },
      },
    });

    // The extra field is intersected on top of the named interface, so the
    // identity stays visible on hover: `SmartEnumItem<...> & { weight: 1 }`.
    type Low = typeof Weighted.low;
    type _hasName = Expect<
      Equal<
        Low,
        SmartEnumItem<'Weighted', 'low', 'LOW', 'Low'> & { readonly weight: 1 }
      >
    >;
    const _keep: _hasName = true;
    expect(_keep).toBe(true);
    expect(Weighted.low.weight).toBe(1);
    expect(Weighted.high.weight).toBe(9);
  });
});
