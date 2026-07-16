# Investigation: is `.equals` actually package-resistant?

**Scope:** investigation only. No source or tests were modified. Repro files were
created outside the repo (see [Repro files](#repro-files)).

**Verdict up front:** The hypothesis is **correct**. `.equals` is *not*
package-resistant. It fails across duplicate copies for the same reasons `===`
does, and it additionally fails across two `enumeration()` calls of "the same"
enum *within a single library copy*. Within a single deduped install, `.equals`
is **behaviorally identical to `===`** on every input tested — the migration and
lint rule buy **no intrinsic safety**. Today's safety is **extrinsic** (npm
dedupe + syncpack collapsing everything to one copy), not a property of the
equality logic.

---

## 1. Symbol inventory

| Symbol | Declared | Kind | Scope (how many exist) | Written to items at | Read for detection/equality at |
|---|---|---|---|---|---|
| `SMART_ENUM_ITEM` | [types.ts:14](packages/core/src/types.ts#L14) | `Symbol('smart-enum-item')` | **module-level** — one per *library copy* | [enumerations.ts:47](packages/core/src/enumerations.ts#L47) (non-enumerable, on every item) | [typeGuards.ts:32](packages/core/src/utilities/typeGuards.ts#L32) (`isSmartEnumItem` — the **guard**) |
| `SMART_ENUM_ID` | [types.ts:15](packages/core/src/types.ts#L15) | `Symbol('smart-enum-id')` | **module-level** — one *key* per library copy | [enumerations.ts:52](packages/core/src/enumerations.ts#L52) (key; the **value** stored is `enumInstanceId`, below) | [enumItemsEqual.ts:12](packages/core/src/utilities/enumItemsEqual.ts#L12) (the **comparison**) |
| `enumInstanceId` (value under `SMART_ENUM_ID`) | [enumerations.ts:139](packages/core/src/enumerations.ts#L139) | `Symbol('smart-enum-instance')` | **per-`enumeration()`-call** — one per *enum instance* | [enumerations.ts:52](packages/core/src/enumerations.ts#L52) (as the value) | [enumItemsEqual.ts:12](packages/core/src/utilities/enumItemsEqual.ts#L12) (compared with `===`) |
| `SMART_ENUM` | [types.ts:16](packages/core/src/types.ts#L16) | `Symbol('smart-enum')` | **module-level** — one per library copy | [enumerations.ts:176](packages/core/src/enumerations.ts#L176) (on the enum object) | [typeGuards.ts:48](packages/core/src/utilities/typeGuards.ts#L48) (`isSmartEnum`) |

**None** are `Symbol.for()`. Every one is a reference-unique `Symbol()`. Key
consequences:

- The three **module-level** symbols (`SMART_ENUM_ITEM`, `SMART_ENUM_ID` key,
  `SMART_ENUM`) are **different objects in two different copies of
  `@reharik/smart-enum`**. Any cross-copy `Reflect.get(x, THAT_SYMBOL)` misses.
- The **per-call** `enumInstanceId` is a **different object for every
  `enumeration()` call** — even two calls in the *same* module with identical
  name and values. This is what equality actually compares.

So equality has **two independent identity axes**, both fragile:
1. the guard, keyed on the module-level `SMART_ENUM_ITEM` (breaks across library copies), and
2. the comparison, keyed on the per-call `enumInstanceId` (breaks across enum definitions).

---

## 2. Dependency map — what rides on the guard and the comparison

```
isSmartEnumItem  (guard, SMART_ENUM_ITEM)          enumItemsEqual (comparison, SMART_ENUM_ID → enumInstanceId)
 ├─ enumItemsEqual.ts:7  (gate before comparison)   ├─ item.equals()        enumerations.ts:84
 ├─ serializeSmartEnums  transformation.ts:41        └─ Enum.equals()        extensionMethods.ts:29
 ├─ prepareForDatabase   db/prepareForDatabase.ts:19       └─ also the equals on pickEnum / getSubsetByProp / subsetByProp views
 ├─ pickEnum             pickEnum.ts:51                        (they call addExtensionMethods → same enumItemsEqual)
 ├─ getSubsetByProp      getSubsetByProp.ts:51
 └─ (re-exported publicly) index.ts:22, core.ts:21, transport.ts:15, database.ts:19, transformation.ts:2
```

Public surfaces that break if the underlying identity check fails across copies:

- **`item.equals(other)`** and **`Enum.equals(a, b)`** — the migration target.
- **`pickEnum` / `getSubsetByProp` / `subsetByProp`** — they *filter* members with
  `isSmartEnumItem` ([pickEnum.ts:51](packages/core/src/utilities/pickEnum.ts#L51),
  [getSubsetByProp.ts:51](packages/core/src/utilities/getSubsetByProp.ts#L51)). A
  foreign-copy enum passed in yields an **empty view** (silent), because every
  member is rejected by the guard. Their returned `.equals` inherits the same flaw.
- **`serializeSmartEnums`** ([transformation.ts:41](packages/core/src/utilities/transformation.ts#L41))
  and **`prepareForDatabase`** ([prepareForDatabase.ts:19](packages/core/src/db/prepareForDatabase.ts#L19))
  — a foreign-copy item is **not recognized as an enum**, so it is walked as a
  plain object and serialized wrong (see Scenario B output below).

Surfaces that do **not** depend on the symbol identity (package-resistant today):

- **`fromValue` / `tryFromValue` / `fromKey` / `tryFromKey`** — plain string
  `.find` on `value`/`key` ([extensionMethods.ts:6-27](packages/core/src/extensionMethods.ts#L6-L27)).
- **`reviveSmartEnums` / `reviveEnumField`** — detect the wire shape with
  **`isSerializedSmartEnumItem`** ([typeGuards.ts:65](packages/core/src/utilities/typeGuards.ts#L65)),
  which is **structural** (`Reflect.has(x, '__smart_enum_type')` + `value`), not
  symbol-based. Revival *emits* an item branded by whichever copy owns the
  registry enum — so a revived item then fails `.equals` against a
  different-copy item of the same logical member.
- **`toJSON` / `toPostgres`** — closures set per item; independent of symbols.
- **`patchSchemaEnumSerializers`** (GraphQL) — reads `.value` / calls
  `fromValue`; no symbol dependency.

`SMART_ENUM_ID` (the comparison axis) is read in **exactly one place**:
`enumItemsEqual`. `SMART_ENUM_ITEM` (the guard) fans out to everything above.

---

## 3. Reproductions (runnable, against the real bundled source)

Method: the library source (`packages/core/src/index.ts`) was bundled into one
self-contained ESM file with esbuild. Importing it with distinct query strings
(`?copy=1`, `?copy=2`) yields two fully-independent module instances — a
faithful stand-in for two on-disk copies, because every module-level `Symbol()`
is re-minted per instance. Run: `node repro.mjs`.

### Scenario A — duplicate enum *definition* (one library copy)

Two `enumeration('EntityType', …)` calls, identical name and values.

```
   a.value=COMMENT  b.value=COMMENT  (logically identical member)
   PASS  a === b (reference eq): false
   PASS  a.equals(b): false
   PASS  A.equals(a, b): false
```

- **`.equals` returns `false` for logically-identical members — same as `===`.**
- **Failing line:** [enumItemsEqual.ts:12](packages/core/src/utilities/enumItemsEqual.ts#L12)
  — `Reflect.get(a, SMART_ENUM_ID) === Reflect.get(b, SMART_ENUM_ID)` is `false`
  because each `enumeration()` call minted its own `enumInstanceId`
  ([enumerations.ts:139](packages/core/src/enumerations.ts#L139)). The **guard at
  line 7 passes** (same library copy → same `SMART_ENUM_ITEM`).
- Note this needs **no duplicate package at all** — just constructing "the same"
  enum twice. It is reachable in ordinary code today.

### Scenario B — duplicate *library copy* (two module instances)

```
   copy1.enumeration === copy2.enumeration ? false   (truly separate copies)
   PASS  copy1.isSmartEnumItem(copy2's item): false
   PASS  copy2.isSmartEnumItem(copy1's item): false
   PASS  a === b (reference eq): false
   PASS  a.equals(b)  [copy1 equals over copy2 item]: false
   PASS  b.equals(a)  [copy2 equals over copy1 item]: false
   copy1.serializeSmartEnums({x: copy2Item}).x =
        {"index":0,"key":"comment","value":"COMMENT","display":"Comment"}   ← NOT serialized as an enum
```

- **`.equals` returns `false` across copies — same as `===`.**
- **Failing line:** the **guard**, [enumItemsEqual.ts:7](packages/core/src/utilities/enumItemsEqual.ts#L7)
  → [typeGuards.ts:32](packages/core/src/utilities/typeGuards.ts#L32).
  `Reflect.get(b, SMART_ENUM_ITEM) === true` is `false` because copy1's
  `SMART_ENUM_ITEM` symbol ≠ the symbol copy2 branded `b` with. It
  **short-circuits to `false` before** the `SMART_ENUM_ID` comparison is ever
  reached.
- Collateral: `serializeSmartEnums` (and by the same mechanism
  `prepareForDatabase`, `pickEnum`, `getSubsetByProp`) also fails to recognize
  the foreign item — here it leaked the raw item instead of `{__smart_enum_type, value}`.

**The two modes fail at different layers:** A at the *comparison*
(`enumInstanceId`), B at the *guard* (`SMART_ENUM_ITEM`).

---

## 4. What `.equals` actually buys over `===`

Probe (`node equals-vs-eq.mjs`) — every candidate against a live member, within one instance:

```
candidate            a.equals  a===   agree?
self                 true      true   yes
fromValue(same)      true      true   yes
other member         false     false  yes
spread {...a}        false     false  yes
structuredClone(a)   false     false  yes
JSON round-trip      false     false  yes
plain wire obj       false     false  yes
revived from wire    true      true   yes
null                 false     false  yes
string value         false     false  yes

Inputs where .equals and === DISAGREE: 0
```

**They never disagree.** This is not incidental: within one `enumeration()`
call each value maps to exactly one frozen object, and `enumInstanceId` is
unique per call, so `(enumInstanceId, value)` identifies a member **iff** it is
that one object reference. Therefore `a.equals(b) ⇔ a === b` for all inputs in a
single instance. `.equals` even returns `false` for a plain wire object
`{__smart_enum_type:'Status', value:'ACTIVE'}` (the guard rejects it) — so it
buys nothing for serialized/plain values either. Cross-instance,
`.equals` returns `false` for logically-equal members — strictly no better
than `===`, and it costs a method call plus the *false belief* that it is safe.

---

## 5. Is dedupe holding it up?

**Yes.** The equality logic has **no intrinsic** cross-copy or cross-instance
robustness (Sections 3–4). It works in practice only because:

- npm dedupe + syncpack collapse `@reharik/smart-enum` to **one physical copy**
  → one set of module-level symbols → the guard always matches (kills Mode B), and
- application code imports each enum from **one module** and constructs it
  **once** → one `enumInstanceId` per enum → the comparison always matches
  (avoids Mode A).

Both are **build-hygiene / usage** properties, external to `enumItemsEqual`. The
moment either regresses (a second copy survives resolution, or "the same" enum
is defined twice), `.equals` degrades to exactly `===`. The historical
duplicate-package bugs were fixed by the **dedupe**, not by `.equals`; `.equals`
has been riding on that dedupe ever since.

---

## 6. Fix options (not implemented)

The guard (`isSmartEnumItem` / `SMART_ENUM_ITEM`) and the comparison
(`enumItemsEqual` / `enumInstanceId`) are **separate layers** and fail in
different modes. A real fix must address **both**.

| Option | Mechanism | Fixes Mode A (dup definition)? | Fixes Mode B (dup copy)? | Cost / risk |
|---|---|---|---|---|
| **(a) Compare on strings `__smart_enum_type + value`** | Replace the `SMART_ENUM_ID` comparison with `a.__smart_enum_type === b.__smart_enum_type && a.value === b.value`; **also** make the guard structural (`__smart_enum_brand === true`, or presence of `__smart_enum_type`+`value`+`key`) instead of symbol-based | **Yes** (strings are instance-independent) | **Yes — but only if the guard is also destructured off symbols**; otherwise the guard still rejects the foreign item first | Relies on **enum-name uniqueness**. That invariant is **already de-facto required**: wire revival looks up `registry[__smart_enum_type]` ([transformation.ts:99](packages/core/src/utilities/transformation.ts#L99)) and the global registry is keyed by name ([transportRegistry.ts:51](packages/core/src/utilities/transport/transportRegistry.ts#L51)) — two enums with the same name already break revival. Not *enforced* at `enumeration()` time, though. False-positive risk: two distinct enums sharing a name **and** a value string compare equal. |
| **(b) Module-level symbols → `Symbol.for('@reharik/smart-enum/…')`** | `SMART_ENUM_ITEM`, `SMART_ENUM`, and the `SMART_ENUM_ID` **key** become process-global via the runtime symbol registry | **No** — `enumInstanceId` (the compared *value*) is still a per-call `Symbol()`; equality still fails | **Guard: yes** (foreign items now recognized). **Equality: no** — the two copies still minted different `enumInstanceId` values, so `enumItemsEqual` still returns `false` | Cheap, low-risk for *detection* (`serialize`, `prepareForDatabase`, `pickEnum`, `getSubsetByProp` start recognizing foreign items). But **insufficient for `.equals` on its own.** |
| **(c) Per-instance id → `Symbol.for('@reharik/smart-enum/instance/'+enumType)`** | Make `enumInstanceId` deterministic by enum name instead of `Symbol('smart-enum-instance')` | **Yes** (both definitions resolve to the same keyed symbol) | **Equality: yes**; **guard: still needs (b)** to pass the foreign item into the comparison | Same **name-collision** hazard as (a), plus it moves per-instance identity into **process-global mutable state** (the symbol registry) — surprising if two unrelated enums legitimately share a name. |

**Recommended shape:** combine a **structural guard** with a **string-based
comparison** — essentially **(a)** done at both layers, or **(b)+(c)** together.
Either way, do both layers. Independent of choice, consider **enforcing
name-uniqueness** at `enumeration()` (throw on duplicate registration), since
every string/name-keyed fix — and existing wire revival — depends on it.

---

## 7. Why existing tests pass while the bug exists

- **Single module instance.** The whole Jest suite runs in one process with one
  copy of the library, so `SMART_ENUM_ITEM` and friends are unique and shared —
  Mode B is structurally impossible to hit.
- **Reflexive equality only.** The equality test compares an item to *itself*:
  `oneAgain = TestEnum.fromValue('ONE')` returns the **same frozen object** as
  `TestEnum.one` ([coreEnumMethods.test.ts:44-48](packages/core/src/__tests__/coreEnumMethods.test.ts#L44-L48)),
  so `.equals` there is just `a.equals(a)`. Every `.equals`/`pickEnum` test
  ([equalsPredicate.test.ts](packages/core/src/__tests__/equalsPredicate.test.ts),
  [pickEnum.test.ts:41-43](packages/core/src/__tests__/pickEnum.test.ts#L41-L43))
  uses members from **one** `enumeration()` call — Mode A is never constructed.
- **A test that would catch it** must break the single-instance assumption:
  1. **Mode A test** — call `enumeration('X', …)` **twice** and assert
     `A.member.equals(B.member) === true`. Fails today. No duplicate package
     needed; this is the cheap regression test.
  2. **Mode B test** — load the built module **twice** with cache-busting
     (`import(url+'?a')` / `?b'`, or two copied dist dirs) and assert an item
     from copy 1 `.equals` the same member from copy 2, and that
     `copy1.isSmartEnumItem(copy2Item) === true`. Fails today.

---

## 8. Bottom line — severity

**Latent, currently masked by dedupe — not on fire *as long as* dedupe holds,
but the guarantee the codebase is relying on is illusory.**

- The `=== → .equals` migration and the lint rule enforce a **false guarantee**:
  `.equals` is provably identical to `===` in the single-copy case (0
  disagreements) and fails identically to `===` when copies/definitions diverge.
  It bought **no real robustness**.
- **Mode A is reachable today with zero duplicate packages** — any code path
  that constructs "the same" enum twice already gets silent `false`. That makes
  this more than a pure duplicate-package concern.
- **Mode B** re-arms the instant dedupe regresses (a stray second copy of
  `@reharik/smart-enum`), and would fail **silently**: not just `.equals`, but
  `serialize`/`prepareForDatabase`/`pickEnum`/`getSubsetByProp` quietly
  mis-handle foreign items.
- Fixing it needs changes at **both** layers (guard + comparison) and a decision
  on the **name-uniqueness** invariant. Priority: high for correctness of the
  stated guarantee, even though no live incident is implied while dedupe stands.

---

## Repro files

Created outside the repo, under the session scratchpad
(`…/33bd61b3-…/scratchpad/`); none committed:

- `bundle.mjs` — esbuild driver (also runnable directly as
  `./node_modules/.bin/esbuild packages/core/src/index.ts --bundle --format=esm --platform=node --outfile=lib-bundle.mjs`).
- `lib-bundle.mjs` — the library source bundled to one self-contained ESM file.
- `repro.mjs` — Scenarios A, B, and the single-instance control. `node repro.mjs`.
- `equals-vs-eq.mjs` — the `.equals`-vs-`===` disagreement probe. `node equals-vs-eq.mjs`.

`packages/core/dist/` was rebuilt (`npm run build`) during setup — build
artifact only; no source or test files were changed.
