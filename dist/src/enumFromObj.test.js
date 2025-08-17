"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const case_anything_1 = require("case-anything");
const enumFromObj_1 = require("./enumFromObj");
describe('ENUM FROM OBJECT', () => {
    const input = {
        one: { value: 'ONE' },
        two: { value: 'TWO' },
        three: { value: 'THREE' },
    };
    describe('When calling enumFromObj', () => {
        it('should create the enum with the props from object values', () => {
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
                input,
            });
            expect(TestEnum.toKeys()).toEqual(['one', 'two', 'three']);
        });
    });
    it('should create the enum items with the correct properties and values', () => {
        const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
            const ColorEnum = (0, enumFromObj_1.enumFromObj)({
                input: color,
            });
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
            const ColorEnum = (0, enumFromObj_1.enumFromObj)({
                input: color,
            });
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
            const ColorEnum = (0, enumFromObj_1.enumFromObj)({
                input: color,
            });
            const extra = (items) => ({
                concatKeys: () => items.reduce((acc, x) => {
                    acc += x.favoriteColor.key;
                    return acc;
                }, ''),
            });
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
            const TestEnum = (0, enumFromObj_1.enumFromObj)({
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
    //     const ColorEnum = enumFromObj({
    //       input: color,
    //     });
    //     type TestEnum = (typeof TestEnum)[keyof typeof input];
    //     const TestEnum = enumFromObj({
    //       input,
    //     });
    //     const func = (x: ColorEnum) => {};
    //     func(TestEnum.one);
    //   });
    // });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bUZyb21PYmoudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9lbnVtRnJvbU9iai50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaURBQTBDO0FBRTFDLCtDQUE0QztBQUc1QyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2hDLE1BQU0sS0FBSyxHQUFHO1FBQ1osR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtRQUNyQixHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFO1FBQ3JCLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7S0FDMUIsQ0FBQztJQUNGLFFBQVEsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLEVBQUU7UUFDeEMsRUFBRSxDQUFDLDBEQUEwRCxFQUFFLEdBQUcsRUFBRTtZQUVsRSxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEVBQUM7Z0JBQzNCLEtBQUs7YUFDTixDQUFDLENBQUM7WUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDSCxFQUFFLENBQUMscUVBQXFFLEVBQUUsR0FBRyxFQUFFO1FBRTdFLE1BQU0sUUFBUSxHQUFHLElBQUEseUJBQVcsRUFBQztZQUMzQixLQUFLO1NBQ04sQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFD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