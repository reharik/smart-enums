# Smart Enumerations

Instead of using a hash `{ME: "me", YOU: "you"}`, or a couple constants `const ME = "me"; const YOU = "you";` or an array `["me", "you"]` or a string union `type No = "please" | "Pretty please";` use a new Smart Enum.

a smart enum looks like this

```typescript
{
  red: {key: "red", value: "RED", display: "Red", index: 0}
  blue: {key: "blue", value: "BLUE", display: "Blue", index: 1}
  green: {key: "green", value: "GREEN", display: "Green", index: 2}
}
```

A Smart Enum can be created ala carte or from an existing enum like a prisma or gql enum. The implementation is just slightly different but the end result is exactly the same.

There are two different way of creating your own ala carte enum.

**A)** from a straight string array e.g.

```typescript
import { enumeration } from '@assured/enumerations/src';
import { fromArray } from '@assured/enumerations/src';

const vehicleDamageMeshType_ = [
  'car4Door',
  'car2Door',
  'pickup4Door',
  'pickup2Door',
  'boxTruck',
  'SUV4Door',
  'legacyCar4Door',
] as const;

const enumValues = fromArray<typeof vehicleDamageMeshType_>(
  vehicleDamageMeshType_,
);

export type TVehicleDamageMeshTypeEnum = typeof enumValues;
export const vehicleDamageMeshTypeEnum = enumeration({
  input: enumValues,
});
```

Here have an array of strings. Notice that it is suffixed with `as const` which is some TypeScript voodoo, it's best not to ask.

Next we transform our array in to a hash using the helper function `fromArray<T>` The result of this call will be

```typescript
{
  car4Door: { value: "CAR_4_DOOR" },
  car2Door: { value: "CAR_2_DOOR" },
  // ...
}
```

With this object in hand we create a type for use later on via `typeof enumValues`.
We then pass the `enumValues` to the enumeration factory meathod and we are done.

**B)**

```typescript
import { enumeration } from '@assured/enumerations/src';

const vehicleDamageMeshTypeEnum_ = {
  car4Door: { value: 'CAR_4_DOOR' },
  car2Door: { value: 'CAR_2_DOOR' },
  pickup4Door: { value: 'PICKUP_4_DOOR' },
  pickup2Door: { value: 'PICKUP_2_DOOR' },
  boxTruck: { value: 'BOX_TRUCK' },
  SUV4Door: { value: 'SUV_4_DOOR' },
  legacyCar4Door: { value: 'SUV_4_DOOR' },
};

export type TVehicleDamageMeshTypeEnum = typeof vehicleDamageMeshTypeEnum_;
export const vehicleDamageMeshTypeEnum = enumeration({
  input: vehicleDamageMeshTypeEnum_,
});
```

In this case we construct our inital object manually and passit directly to enumeration factory.  
While the two methods are very much the same, method B can be useful if you would like to have some additional values on your enum. For instance Let's say you have a color enum, you may wish to do this

```typescript
const colors_ = {
  red: { value: 'RED', hex: '#1234', rgb: 'blah' },
  blue: { value: 'Blue', hex: '#4321', rgb: 'blahblah' },
};
```

These additional properties would be carried through to your enumeration values.

One can also construct an enum from an existing stupid enum such as one you may get from Prisma or GQL. The syntax for creating one of these is even easier.

```typescript
import { Enum, enumeration } from './lib/enumeration';
import { ClaimStatus } from '@prisma/client';

export type TClaimStatus = Enum<typeof ClaimStatus>;
export const claimStatus = enumeration({
  input: ClaimStatus,
});
```

That's all there is to it.

## `fromValue`

Every Smart Enum is bestowed a number of helper functions that in fact are quite helpful. looks like this:

```typescript
type FromValue = (target?: string) => EnumItemOf<T> | undefined;
```

Takes in a string that may or may not be a value on your enum and returns and `EnumItemOf<T>`.

```typescript
// returns the EnumItem bubba: {key: "bubba", value: "BUBBA", display: "Bubba" index:3 }
myBuddies.fromValue('BUBBA');
```

## `fromDisplay`

```typescript
type FromDisplay = (target?: string) => EnumItemOf<T> | undefined;
```

Similar to `fromValue`. It is useful when you need an EnumItem from say a select option.

## `tryFromCustomField`

```typescript
type TryFromCustomField = (
  field: keyof EnumItemOf<T, U>,
  target?: string | null,
) => EnumItemOf<T, U> | undefined;
```

Similar to `tryFromValue`, `tryFromDisplay`, there may be custom fields in which we may want to find and enum item by. For example, perhaps we have an enum of page types and want to get an enum item by a `slug` custom field. We could do something like the below.

```typescript
const pageEnumItem = pageEnum.tryFromCustomField('slug', 'this-is-some-slug');
```

## `toOptions`

```typescript
type ToOptions = () => DropdownOption[];
```

A frontend helper that provides you a simple dto useful for binding to select options.

```tsx
<select>
  {myEnum.toOptions().map(x => (
    <option value={x.value}>{x.display}</option>
  ))}
</select>
```

## `toValues`

```typescript
type ToValues = () => string[];
```

Retrieves an array of all the values in the enum e.g. `["BUBBA", "SISSY", "MA", "PA"]`

## `toKeys`

```typescript
type ToKeys = () => string[];
```

Retrieves an array of all the keys in the enum e.g. `["bubba", "sissy", "ma", "pa"]`

## `toCustomFields`

```typescript
type ToCustomFieldValues = <V>(
  field: keyof EnumItemOf<T, U>,
  options?: { shouldOmitUndefined?: boolean },
) => V[];
```

Similar to the above, you may want to get all values from a custom field. And by utilizing the `shouldOmitUndefined` option, you can omit `undefined` values from the resulting array. Since fields may have a variety of types and at build time TypeScript won't know the type of value from the corresponding `field`, to utilize this method you should pass in a generic type for the expected value of the `field`, like so:

```typescript
const pageSlugs = pageEnum.toCustomFields<string>('slug', {
  shouldOmitUndefined: true,
});
```

## `toEnumItems`

```typescript
type ToEnumItems = () => EnumItemOf<T>[];
```

Returns an array of EnumItems. Certainly this has been useful before or it would not be here.

Smart Enums can be passed into functions as properties like this.

```typescript
const makeLove(buddy: EnumItemOf<Buddies>): baby => {
  // do ...something to your buddy
}
```

This would then be consumed like this.

```typescript
const newBaby = makeLove(buddies.ma);
```

In this way we can make sure that only members of our close knit group of friends are available for ... interaction.

```typescript
const newBaby = makeLove(moreDistantThanFirstCousins.frank); // Does not compile
```

**Extending Enums**
By default when we create an enum we get a shape like this

```typescript
{
  red: {key: "red", value: "RED", display: "Red", index: 0}
  blue: {key: "blue", value: "BLUE", display: "Blue", index: 1}
  green: {key: "green", value: "GREEN", display: "Green", index: 2}
}
```

But if we would like to add to this shape we can add whatever properties we want like so

```typescript
import { enumeration } from '@assured/enumerations/src';
import { fromArray } from '@assured/enumerations/src';

const vehicleDamageMeshType_ = [
  'car4Door',
  'car2Door',
  'pickup4Door',
  'pickup2Door',
  'boxTruck',
  'SUV4Door',
  'legacyCar4Door',
] as const;

const enumValues = fromArray<typeof vehicleDamageMeshType_>(
  vehicleDamageMeshType_,
);

export type TVehicleDamageMeshTypeEnum = typeof enumValues;
export const vehicleDamageMeshTypeEnum = enumeration<
  TStepInputEnum,
  SpecificEnumItem & { isCoolCar: boolean }
>({
  input: enumValues,
});

vehicleDamageMeshTypeEnum.car4Door.isCoolCar = false;
vehicleDamageMeshTypeEnum.car2Door.isCoolCar = true;

if (!vehicleDamageMeshTypeEnum.car4Door.isCoolCar) {
  // get outta town!
}
```

Essentially we are extending the SpecificEnumItem to
have our desired properties on it.
