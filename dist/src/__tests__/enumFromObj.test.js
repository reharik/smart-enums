"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const case_anything_1 = require("case-anything");
const enumeration_1 = require("../enumeration");
describe('ENUM FROM OBJECT', () => {
    const input = {
        one: { value: 'ONE' },
        two: { value: 'TWO' },
        three: { value: 'THREE' },
    };
    describe('When calling enumeration', () => {
        it('should create the enum with the props from object values', () => {
            const TestEnum = (0, enumeration_1.enumeration)({
                input,
            });
            expect(TestEnum.toKeys()).toEqual(['one', 'two', 'three']);
        });
    });
    it('should create the enum items with the correct properties and values', () => {
        const TestEnum = (0, enumeration_1.enumeration)({
            input,
        });
        expect(TestEnum.one.key).toBe('one');
        expect(TestEnum.one.value).toBe('ONE');
        expect(TestEnum.one.display).toBe('One');
        expect(TestEnum.one.index).toBe(0);
        expect(TestEnum.two.index).toBe(1);
    });
    describe('when creating an enum with an extended enumItem type', () => {
        // TODO this is actually a problem, perhaps insurmountable, but here's
        // a test in case someone does figure it out
        it('should not put those extra properties on the enum unless you add values later', () => {
            const color = {
                red: { value: 'RED' },
                blue: { value: 'BLUE' },
                green: { value: 'GREEN' },
            };
            const ColorEnum = (0, enumeration_1.enumeration)({
                input: color,
            });
            const TestEnum = (0, enumeration_1.enumeration)({
                input,
            });
            expect(TestEnum.one).not.toHaveProperty('favoriteColor');
            expect(TestEnum.two).not.toHaveProperty('favoriteColor');
        });
        it('should allow you to set those extra properties on the enum', () => {
            const color = {
                red: { value: 'RED' },
                blue: { value: 'BLUE' },
                green: { value: 'GREEN' },
            };
            const ColorEnum = (0, enumeration_1.enumeration)({
                input: color,
            });
            const TestEnum = (0, enumeration_1.enumeration)({
                input,
            });
            TestEnum.one.favoriteColor = ColorEnum.red;
            TestEnum.two.favoriteColor = ColorEnum.green;
            TestEnum.three.favoriteColor = ColorEnum.blue;
            expect(TestEnum.one.favoriteColor).toBe(ColorEnum.red);
            expect(TestEnum.two.favoriteColor).toBe(ColorEnum.green);
            expect(TestEnum.three.favoriteColor).toBe(ColorEnum.blue);
        });
    });
    describe('when creating an enum with extra extension methods', () => {
        it('should add the extension method to the enum', () => {
            const extra = (items) => ({
                concatKeys: () => items.reduce((acc, x) => {
                    acc += x.key;
                    return acc;
                }, ''),
            });
            const TestEnum = (0, enumeration_1.enumeration)({
                input,
                extraExtensionMethods: extra,
            });
            expect(TestEnum.concatKeys).not.toBeNull();
        });
        it('should add the extension method which should perform against enum items in current enum', () => {
            const extra = (items) => {
                return {
                    concatKeys: () => items.reduce((acc, x) => {
                        acc += x.key;
                        return acc;
                    }, ''),
                };
            };
            const TestEnum = (0, enumeration_1.enumeration)({
                input,
                extraExtensionMethods: extra,
            });
            expect(TestEnum.concatKeys()).toBe('onetwothree');
        });
    });
    describe('when creating an enum with extra extension methods that act against custom props', () => {
        it('should add the extension method which should perform against enum items in current enum', () => {
            const color = {
                red: { value: 'RED' },
                blue: { value: 'BLUE' },
                green: { value: 'GREEN' },
            };
            const ColorEnum = (0, enumeration_1.enumeration)({
                input: color,
            });
            const extra = (items) => ({
                concatKeys: () => items.reduce((acc, x) => {
                    acc += x.favoriteColor.key;
                    return acc;
                }, ''),
            });
            const TestEnum = (0, enumeration_1.enumeration)({
                input,
                extraExtensionMethods: extra,
            });
            TestEnum.one.favoriteColor = ColorEnum.red;
            TestEnum.two.favoriteColor = ColorEnum.green;
            TestEnum.three.favoriteColor = ColorEnum.blue;
            expect(TestEnum.concatKeys()).toBe('redgreenblue');
        });
    });
    describe('when passing function for displayFormatter', () => {
        it('should return proper result for display', () => {
            const inputForDisplay = {
                favoriteColor: { value: 'FAVORITE_COLOR' },
                lastKnownAddress: { value: 'LAST_KNOWN_ADDRESS' },
            };
            const propertyAutoFormatters = [
                {
                    key: 'display',
                    format: (k) => {
                        return (0, case_anything_1.cobolCase)(k);
                    },
                },
            ];
            const TestEnum = (0, enumeration_1.enumeration)({
                input: inputForDisplay,
                propertyAutoFormatters,
            });
            expect(TestEnum.toDisplays()).toEqual([
                'FAVORITE-COLOR',
                'LAST-KNOWN-ADDRESS',
            ]);
        });
    });
    // describe('when using an enum as a param for a func ', () => {
    //   it('should only accept parm from specified enum. i.e. not from any other enums', () => {
    //     const color = {
    //       red: { value: 'RED' },
    //       blue: { value: 'BLUE' },
    //       green: { value: 'GREEN' },
    //     };
    //     type ColorEnum = (typeof ColorEnum)[keyof typeof color];
    //     const ColorEnum = enumeration({
    //       input: color,
    //     });
    //     type TestEnum = (typeof TestEnum)[keyof typeof input];
    //     const TestEnum = enumeration({
    //       input,
    //     });
    //     const func = (x: ColorEnum) => {};
    //     func(TestEnum.one);
    //   });
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bUZyb21PYmoudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9fX3Rlc3RzX18vZW51bUZyb21PYmoudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUEwQztBQUcxQyxnREFBNkM7QUFFN0MsUUFBUSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsRUFBRTtJQUNoQyxNQUFNLEtBQUssR0FBRztRQUNaLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUU7UUFDckIsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtRQUNyQixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFO0tBQzFCLENBQUM7SUFDRixRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLEVBQUUsQ0FBQywwREFBMEQsRUFBRSxHQUFHLEVBQUU7WUFFbEUsTUFBTSxRQUFRLEdBQUcsSUFBQSx5QkFBVyxFQUFDO2dCQUMzQixLQUFLO2FBQ04sQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsRUFBRSxDQUFDLHFFQUFxRSxFQUFFLEdBQUcsRUFBRTtRQUU3RSxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEVBQUM7WUFDM0IsS0FBSztTQUNOLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsTUFBTSxD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