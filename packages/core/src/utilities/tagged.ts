import type { StandardEnumItem } from '../types.js';

import { enumItemsEqual } from './enumItemsEqual.js';

/**
 * True when `a` is the same logical enum member as `b`.
 *
 * Comparison is package-resistant (delegates to {@link enumItemsEqual}): it
 * keys on the string identity `__smart_enum_type` + `value`, so it holds
 * across duplicate copies of `@reharik/smart-enum` and across separate
 * `enumeration()` calls, where `===` would fail. Anything that is not a
 * smart-enum member — `null`, a plain string, a serialized wire shape without
 * the brand — is simply `false`, never a throw.
 *
 * @param a The value to test — may be anything.
 * @param b The known member to compare against.
 * @returns Whether `a` represents the same member as `b`.
 */
export const sameMember = (a: unknown, b: StandardEnumItem): boolean =>
  enumItemsEqual(a, b);

/**
 * Type guard that narrows the **containing object** by the member held at
 * `prop` — where the enum object's `has` narrows the value you pass to it,
 * `isTagged` narrows `obj` itself, in both the true *and* false branches. That
 * makes an exhaustive `if` chain ending in `assertNever` compile.
 *
 * Branching over every member at once? Use the enum object's `switchOn`
 * instead.
 *
 * @param obj The object whose variant you want narrowed.
 * @param prop The property holding the member.
 * @param member The member to test against (compared via {@link sameMember},
 *   so duplicate-package copies still match).
 * @returns Whether `obj[prop]` is that member; narrows `obj` accordingly.
 * @example
 * ```ts
 * const assertNever = (x: never): never => {
 *   throw new Error('unreachable');
 * };
 * const route = (n: Notification): string => {
 *   if (isTagged(n, 'kind', Channel.email)) return n.to;
 *   if (isTagged(n, 'kind', Channel.push)) return n.device;
 *   if (isTagged(n, 'kind', Channel.sms)) return n.number;
 *   return assertNever(n); // compiles: every variant handled above
 * };
 * ```
 */
export function isTagged<
  const P extends string,
  T extends Record<P, StandardEnumItem>,
  M extends T[P],
>(obj: T, prop: P, member: M): obj is Extract<T, Record<P, M>> {
  return sameMember(obj[prop], member);
}

/**
 * Curried {@link isTagged}: fix `prop` once, get back a guard over
 * `(obj, member)` that narrows the **containing object** — where the enum
 * object's `has` narrows the value you pass to it. Handy when one discriminant
 * property is tested all over a module.
 *
 * @param prop The property holding the member.
 * @returns A guard `(obj, member) => obj is <variant>` narrowing `obj` in both
 *   branches, exactly like {@link isTagged}.
 * @example
 * ```ts
 * const byKind = taggedBy('kind');
 * if (byKind(n, Channel.email)) sendEmail(n.to);
 * ```
 */
export function taggedBy<const P extends string>(prop: P) {
  return <T extends Record<P, StandardEnumItem>, M extends T[P]>(
    obj: T,
    member: M,
  ): obj is Extract<T, Record<P, M>> => sameMember(obj[prop], member);
}
