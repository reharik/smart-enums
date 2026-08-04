import {
  type Enumeration,
  enumeration,
  isTagged,
  sameMember,
  taggedBy,
} from '../index.js';

const Channel = enumeration('TaggedChannel', {
  input: ['email', 'push', 'sms'] as const,
});
type ChannelItem = Enumeration<typeof Channel>;

const Status = enumeration('TaggedStatus', {
  input: ['draft', 'sent'] as const,
});

// Interface-based union on purpose — mirrors the switchOn fixtures and guards
// the same implicit-index-signature pitfall.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface EmailNotification {
  kind: typeof Channel.email;
  to: string;
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface PushNotification {
  kind: typeof Channel.push;
  device: string;
}
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
interface SmsNotification {
  kind: typeof Channel.sms;
  number: string;
}
type Notification = EmailNotification | PushNotification | SmsNotification;

const email: EmailNotification = { kind: Channel.email, to: 'a@b.c' };
const push: PushNotification = { kind: Channel.push, device: 'pixel' };
const sms: SmsNotification = { kind: Channel.sms, number: '555' };

const assertNever = (x: never): never => {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
};

// The point of isTagged narrowing in *both* branches: an exhaustive if-chain
// can end in assertNever and still compile.
const route = (n: Notification): string => {
  if (isTagged(n, 'kind', Channel.email)) return n.to;
  if (isTagged(n, 'kind', Channel.push)) return n.device;
  if (isTagged(n, 'kind', Channel.sms)) return n.number;
  return assertNever(n); // compiles: every variant is handled above
};

// Compile-only (never invoked): constraint violations are loud.
const rejectedTagsCompileOnly = (n: Notification) => {
  // prettier-ignore
  // @ts-expect-error — Status.draft is not a member of Channel
  isTagged(n, 'kind', Status.draft);

  // prettier-ignore
  // @ts-expect-error — 'to' does not hold a smart-enum member
  isTagged(n, 'to', Channel.email);
};

describe('sameMember', () => {
  it('is true for the same member and false for a different one', () => {
    expect(sameMember(Channel.email, Channel.email)).toBe(true);
    expect(sameMember(Channel.push, Channel.email)).toBe(false);
  });

  it('is false (not a throw) for non-members', () => {
    expect(sameMember('EMAIL', Channel.email)).toBe(false);
    // eslint-disable-next-line unicorn/no-null
    expect(sameMember(null, Channel.email)).toBe(false);
    expect(sameMember(undefined, Channel.email)).toBe(false);
    expect(
      sameMember(
        { __smart_enum_type: 'TaggedChannel', value: 'EMAIL' },
        Channel.email,
      ),
    ).toBe(false); // serialized shape without the brand
  });

  it('is true for a foreign-but-branded duplicate-package member', () => {
    const foreign = {
      __smart_enum_brand: true,
      __smart_enum_type: 'TaggedChannel',
      key: 'email',
      value: 'EMAIL',
    };
    expect(sameMember(foreign, Channel.email)).toBe(true);
  });
});

describe('isTagged / taggedBy', () => {
  describe('runtime', () => {
    it('tests the member held at prop', () => {
      expect(isTagged(email as Notification, 'kind', Channel.email)).toBe(true);
      expect(isTagged(email as Notification, 'kind', Channel.push)).toBe(false);
    });

    it('taggedBy behaves identically with prop fixed once', () => {
      const byKind = taggedBy('kind');
      expect(byKind(push as Notification, Channel.push)).toBe(true);
      expect(byKind(push as Notification, Channel.sms)).toBe(false);
    });

    it('matches a foreign-but-branded member (duplicate-package simulation)', () => {
      const foreignEmail = {
        __smart_enum_brand: true,
        __smart_enum_type: 'TaggedChannel',
        key: 'email',
        value: 'EMAIL',
      } as unknown as typeof Channel.email;

      const n: Notification = { kind: foreignEmail, to: 'a@b.c' };
      expect(isTagged(n, 'kind', Channel.email)).toBe(true);
    });
  });

  describe('type-level', () => {
    it('narrows the containing object in the true branch', () => {
      const n = email as Notification;
      if (isTagged(n, 'kind', Channel.email)) {
        const to: string = n.to; // only exists on EmailNotification
        expect(to).toBe('a@b.c');
      } else {
        throw new Error('expected the email branch');
      }
    });

    it('narrows in the false branch too: exhaustive if-chain ends in assertNever', () => {
      expect(route(email)).toBe('a@b.c');
      expect(route(push)).toBe('pixel');
      expect(route(sms)).toBe('555');
    });

    it('taggedBy narrows the same way', () => {
      const byKind = taggedBy('kind');
      const routeCurried = (n: Notification): string => {
        if (byKind(n, Channel.email)) return n.to;
        if (byKind(n, Channel.push)) return n.device;
        if (byKind(n, Channel.sms)) return n.number;
        return assertNever(n);
      };

      expect(routeCurried(sms)).toBe('555');
    });

    it("rejects a different enum's member and a non-enum prop", () => {
      void rejectedTagsCompileOnly;
      expect(true).toBe(true);
    });
  });
});

// Keep the item alias referenced so the fixture reads as documentation.
void (undefined as unknown as ChannelItem);
