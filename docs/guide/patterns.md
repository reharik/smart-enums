# Patterns & recipes

The pitch is abstract until you see the pattern carrying real weight. Here are the uses that come up over and over, each one leaning on a different virtue: metadata, ordering, subsetting, lookup, identity. Steal them.

## Sortable columns that carry their SQL

A sort dropdown needs three things that usually live apart: the option label, the API value, and the actual database column. Put them on the member:

```typescript
const AlbumSortBy = enumeration('AlbumSortBy', {
  input: {
    newest:    { display: 'Newest first', column: 'created_at', dir: 'desc' },
    oldest:    { display: 'Oldest first', column: 'created_at', dir: 'asc' },
    title:     { display: 'Title A–Z',    column: 'title',      dir: 'asc' },
  } as const,
});

// In the UI: options + labels straight off the enum
AlbumSortBy.items().map(s => ({ value: s.value, label: s.display }));

// In the query: the column and direction travel with the choice
const sort = AlbumSortBy.fromValue(req.query.sortBy);
db('album').orderBy(sort.column, sort.dir);
```

The "newest" option can never point at the wrong column, because the label and the column are the same object. A typo in the request becomes a clean `fromValue` throw, not a silent `ORDER BY undefined`.

## A state machine with the transitions attached

Allowed transitions are domain rules. Attach them and the machine validates itself:

```typescript
const OrderState = enumeration('OrderState', {
  input: {
    cart:      { display: 'In cart',   next: ['placed'] },
    placed:    { display: 'Placed',    next: ['paid', 'canceled'] },
    paid:      { display: 'Paid',      next: ['shipped', 'refunded'] },
    shipped:   { display: 'Shipped',   next: ['delivered'] },
    delivered: { display: 'Delivered', next: [] },
    canceled:  { display: 'Canceled',  next: [] },
    refunded:  { display: 'Refunded',  next: [] },
  } as const,
});

function canTransition(from: OrderState, toKey: string): boolean {
  return (from.next as readonly string[]).includes(toKey);
}

canTransition(OrderState.placed, 'paid');     // true
canTransition(OrderState.delivered, 'paid');  // false
```

The transition table isn't a separate `Record` you maintain alongside the states — it *is* the states. A terminal state is one whose `next` is empty, and you can find them all without a hand-kept list (see subsetting below).

## Permission sets via subsetting

[`getSubsetByProp`](/core/lookup#subsetting-by-a-custom-field) filters an enum into a smaller enum-like view that keeps its own `fromValue`/`items`. Perfect for "all the X-flavored members":

```typescript
const Operation = enumeration('Operation', {
  input: {
    viewAlbum:   { scope: 'read'  },
    listAlbums:  { scope: 'read'  },
    editAlbum:   { scope: 'write' },
    deleteAlbum: { scope: 'write' },
  } as const,
});

const readOps  = getSubsetByProp(Operation, 'scope', 'read' as const);
const writeOps = getSubsetByProp(Operation, 'scope', 'write' as const);

readOps.items();          // only the read operations
readOps.viewAlbum;        // === Operation.viewAlbum (same object)
readOps.fromValue('LIST_ALBUMS'); // scoped lookup
```

The read/write split is derived from the data, not duplicated as two arrays. Add `archiveAlbum: { scope: 'write' }` and `writeOps` includes it automatically.

## An API error catalog

Errors have a status code, a client-facing message, a log level, and a retry hint. That's four facts begging to live together:

```typescript
const ApiError = enumeration('ApiError', {
  input: {
    notFound:    { status: 404, retryable: false, level: 'info',  display: 'Not found' },
    conflict:    { status: 409, retryable: false, level: 'warn',  display: 'Already exists' },
    rateLimited: { status: 429, retryable: true,  level: 'warn',  display: 'Too many requests' },
    upstream:    { status: 502, retryable: true,  level: 'error', display: 'Upstream failure' },
  } as const,
});

function send(res, err: ApiError) {
  logger[err.level](err.key);
  res.status(err.status).json({ error: err.value, message: err.display, retryable: err.retryable });
}

send(res, ApiError.rateLimited);
```

The handler reads policy off the member instead of switching on a code. New error, one definition, every consumer current.

## Feature flags / variants with metadata

```typescript
const Plan = enumeration('Plan', {
  input: {
    free: { display: 'Free', seats: 1,  priceId: null },
    pro:  { display: 'Pro',  seats: 10, priceId: 'price_pro' },
    team: { display: 'Team', seats: 50, priceId: 'price_team' },
  } as const,
});

Plan.items().filter(p => p.priceId);   // billable plans
Plan.fromValue(user.planValue).seats;  // entitlement, no lookup table
```

## Comparing without `===` traps

Once values cross a boundary you can end up with two *copies* of the same member — one fresh from the database, one a constant in your code. `===` on objects fails there. `equals` compares by identity-of-value and survives the round trip:

```typescript
const stored = Status.fromValue(row.status); // freshly built from a string
stored.equals(Status.active);                // true
stored === Status.active;                    // also true here (interned),
                                             // but equals is the safe habit across boundaries
```

Reach for `.equals()` in any code that might see revived or re-parsed members — request handlers, cache reads, anything post-transport. Details in [Comparing members](/core/lookup#comparing-members).

## The throughline

Notice what every recipe has in common: a fact that *belongs* to a value — its column, its allowed transitions, its HTTP status, its price — stops living in a parallel structure and moves onto the value itself. That's the whole pattern. Everything else (lookup, iteration, serialization) is plumbing that makes it practical.

## Next

- [Creating enums](/core/creating-enums) — every input form in detail.
- [GraphQL overview](/graphql/overview) — the same members, flowing through an API end to end.
