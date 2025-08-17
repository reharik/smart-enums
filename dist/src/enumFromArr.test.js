"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const case_anything_1 = require("case-anything");
const enumFromArr_1 = require("./enumFromArr");
describe('ENUM FROM ARRAY', () => {
    const input = ['one', 'two', 'three'];
    describe('When calling enumFromArr', () => {
        it('should create the enum with the props from array values', () => {
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
                input,
            });
            expect(TestEnum.toKeys()).toEqual(['one', 'two', 'three']);
        });
    });
    it('should create the enum items with the correct properties and values', () => {
        const TestEnum = (0, enumFromArr_1.enumFromArr)({
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
            const color = ['red', 'blue', 'green'];
            const ColorEnum = (0, enumFromArr_1.enumFromArr)({
                input: color,
            });
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
                input,
            });
            expect(TestEnum.one).not.toHaveProperty('favoriteColor');
            expect(TestEnum.two).not.toHaveProperty('favoriteColor');
        });
        it('should allow you to set those extra properties on the enum', () => {
            const color = ['red', 'blue', 'green'];
            const ColorEnum = (0, enumFromArr_1.enumFromArr)({
                input: color,
            });
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
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
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
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
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
                input,
                extraExtensionMethods: extra,
            });
            expect(TestEnum.concatKeys()).toBe('onetwothree');
        });
    });
    describe('when creating an enum with extra extension methods that act against custom props', () => {
        it('should add the extension method which should perform against enum items in current enum', () => {
            const color = ['red', 'blue', 'green'];
            const ColorEnum = (0, enumFromArr_1.enumFromArr)({
                input: color,
            });
            const extra = (items) => ({
                concatKeys: () => items.reduce((acc, x) => {
                    acc += x.favoriteColor.key;
                    return acc;
                }, ''),
            });
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
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
            const inputForDisplay = ['favoriteColor', 'lastKnownAddress'];
            const propertyAutoFormatters = [
                {
                    key: 'display',
                    format: (k) => {
                        return (0, case_anything_1.cobolCase)(k);
                    },
                },
            ];
            const TestEnum = (0, enumFromArr_1.enumFromArr)({
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
    //     const color = ['red', 'blue', 'green'] as const;
    //     type ColorEnum = Enumeration<typeof ColorEnum, typeof color>;
    //     const ColorEnum = enumFromArr({
    //       input: color,
    //     });
    //     type TestEnum = Enumeration<typeof TestEnum, typeof input>;
    //     const TestEnum = enumFromArr({
    //       input,
    //     });
    //     const func = (x: ColorEnum) => {};
    //     func(TestEnum.one);
    //   });
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bUZyb21BcnIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lbnVtRnJvbUFyci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQTBDO0FBRTFDLCtDQUE0QztBQUc1QyxRQUFRLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO0lBQy9CLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQVUsQ0FBQztJQUMvQyxRQUFRLENBQUMsMEJBQTBCLEVBQUUsR0FBRyxFQUFFO1FBQ3hDLEVBQUUsQ0FBQyx5REFBeUQsRUFBRSxHQUFHLEVBQUU7WUFFakUsTUFBTSxRQUFRLEdBQUcsSUFBQSx5QkFBVyxFQUFDO2dCQUMzQixLQUFLO2FBQ04sQ0FBQyxDQUFDO1lBQ0gsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0gsRUFBRSxDQUFDLHFFQUFxRSxFQUFFLEdBQUcsRUFBRTtRQUU3RSxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEVBQUM7WUFDM0IsS0FBSztTQUNOLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUss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