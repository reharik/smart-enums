"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const case_anything_1 = require("case-anything");
const enumeration_1 = require("../enumeration");
describe('ENUM FROM ARRAY', () => {
    const input = ['one', 'two', 'three'];
    describe('When calling enumeration', () => {
        it('should create the enum with the props from array values', () => {
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
            const color = ['red', 'blue', 'green'];
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
            const color = ['red', 'blue', 'green'];
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
            const color = ['red', 'blue', 'green'];
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
            const inputForDisplay = ['favoriteColor', 'lastKnownAddress'];
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
    //     const color = ['red', 'blue', 'green'] as const;
    //     type ColorEnum = Enumeration<typeof ColorEnum, typeof color>;
    //     const ColorEnum = enumeration({
    //       input: color,
    //     });
    //     type TestEnum = Enumeration<typeof TestEnum, typeof input>;
    //     const TestEnum = enumeration({
    //       input,
    //     });
    //     const func = (x: ColorEnum) => {};
    //     func(TestEnum.one);
    //   });
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bUZyb21BcnIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9fX3Rlc3RzX18vZW51bUZyb21BcnIudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUEwQztBQUcxQyxnREFBNkM7QUFFN0MsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtJQUMvQixNQUFNLEtBQUssR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFVLENBQUM7SUFDL0MsUUFBUSxDQUFDLDBCQUEwQixFQUFFLEdBQUcsRUFBRTtRQUN4QyxFQUFFLENBQUMseURBQXlELEVBQUUsR0FBRyxFQUFFO1lBRWpFLE1BQU0sUUFBUSxHQUFHLElBQUEseUJBQVcsRUFBQztnQkFDM0IsS0FBSzthQUNOLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDN0QsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUNILEVBQUUsQ0FBQyxxRUFBcUUsRUFBRSxHQUFHLEVBQUU7UUFFN0UsTUFBTSxRQUFRLEdBQUcsSUFBQSx5QkFBVyxFQUFDO1lBQzNCLEtBQUs7U0FDTixDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6QyxNQUFNLENBQUMsUUFBUSxDQUFDLEdB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