"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enumeration_1 = require("./enumeration");
const extensionMethods_1 = require("./extensionMethods");
const input = ['one', 'two'];
describe('ENUM EXTENSION METHODS', () => {
    describe('Add Extension Methods', () => {
        beforeEach(() => { });
        describe('when calling addExtensionMethods with out extras', () => {
            it('should return extensionMethods. i.e. not break', () => {
                const TestEnum = (0, enumeration_1.enumeration)({ input });
                const enumItems = TestEnum.toEnumItems();
                const result = (0, extensionMethods_1.addExtensionMethods)(enumItems);
                expect(result).not.toBeUndefined();
            });
        });
        describe('when calling addExtensionMethods with extra functions', () => {
            it('should return extensionMethods with the extra functions', () => {
                const testEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                const enumItems = testEnum.toEnumItems();
                const em = (enumItems) => ({
                    func1: (target) => {
                        return enumItems.filter(x => x.value.includes(target));
                    },
                });
                const result = (0, extensionMethods_1.addExtensionMethods)(enumItems, em);
                expect(result.func1).not.toBeUndefined();
            });
        });
        describe('when calling addExtensionMethods with extra functions that work', () => {
            it('should return extensionMethods and they should work', () => {
                const testEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                const enumItems = testEnum.toEnumItems();
                const em = (enumItems) => ({
                    func1: (target) => {
                        return enumItems.filter(x => x.value.includes(target));
                    },
                });
                const result = (0, extensionMethods_1.addExtensionMethods)(enumItems, em);
                expect(result.func1('T')).toEqual([
                    { display: 'Two', index: 1, key: 'two', value: 'TWO' },
                ]);
            });
        });
    });
    describe('From Value', () => {
        describe('when calling fromValue with no match', () => {
            it('should throw', () => {
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                expect(() => TestEnum.fromValue('bubba')).toThrow(`No enum value found for 'bubba'`);
            });
        });
        describe('when calling fromValue WITH match', () => {
            it('should return proper item', () => {
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                expect(TestEnum.fromValue('TWO')).toEqual({
                    display: 'Two',
                    index: 1,
                    key: 'two',
                    value: 'TWO',
                });
            });
        });
        describe('Try From Value', () => {
            describe('when calling tryFomValue with no match', () => {
                it('should return undefined', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.tryFromValue('bubba')).toBeUndefined();
                });
            });
            describe('when calling fromValue WITH match', () => {
                it('should return proper item', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.tryFromValue('TWO')).toEqual({
                        display: 'Two',
                        index: 1,
                        key: 'two',
                        value: 'TWO',
                    });
                });
            });
        });
        describe('From Key', () => {
            describe('when calling fromKey with no match', () => {
                it('should throw', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(() => TestEnum.fromKey('bubba')).toThrow(`No enum key found for 'bubba'`);
                });
            });
            describe('when calling fromKey WITH match', () => {
                it('should return proper item', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.fromKey('two')).toEqual({
                        display: 'Two',
                        index: 1,
                        key: 'two',
                        value: 'TWO',
                    });
                });
            });
            describe('Try From Key', () => {
                describe('when calling tryFomKey with no match', () => {
                    it('should return undefined', () => {
                        const TestEnum = (0, enumeration_1.enumeration)({
                            input,
                        });
                        expect(TestEnum.tryFromKey('bubba')).toBeUndefined();
                    });
                });
                describe('when calling fromKey WITH match', () => {
                    it('should return proper item', () => {
                        const TestEnum = (0, enumeration_1.enumeration)({
                            input,
                        });
                        expect(TestEnum.tryFromKey('two')).toEqual({
                            display: 'Two',
                            index: 1,
                            key: 'two',
                            value: 'TWO',
                        });
                    });
                });
            });
        });
        describe('From Display', () => {
            describe('when calling fromDisplay with no match', () => {
                it('should throw', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(() => TestEnum.fromDisplay('bubba')).toThrow(`No enum display found for 'bubba'`);
                });
            });
            describe('when calling fromDisplay WITH match', () => {
                it('should return proper item', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.fromDisplay('Two')).toEqual({
                        display: 'Two',
                        index: 1,
                        key: 'two',
                        value: 'TWO',
                    });
                });
            });
            describe('Try From Display', () => {
                describe('when calling tryFomDisplay with no match', () => {
                    it('should return undefined', () => {
                        const TestEnum = (0, enumeration_1.enumeration)({
                            input,
                        });
                        expect(TestEnum.tryFromDisplay('bubba')).toBeUndefined();
                    });
                });
                describe('when calling fromDisplay WITH match', () => {
                    it('should return proper item', () => {
                        const TestEnum = (0, enumeration_1.enumeration)({
                            input,
                        });
                        expect(TestEnum.tryFromDisplay('Two')).toEqual({
                            display: 'Two',
                            index: 1,
                            key: 'two',
                            value: 'TWO',
                        });
                    });
                });
            });
        });
        describe('Try From Custom Field', () => {
            describe('when calling tryFromCustomField when no custom fields are set', () => {
                it('should return undefined', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    const result = TestEnum.tryFromCustomField('bubba', 'likesIt');
                    expect(result).toBeUndefined();
                });
            });
        });
        describe('when calling tryFromCustomField when no custom fields have been set but no match', () => {
            it('should return undefined', () => {
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.tryFromCustomField('bubba', 'likesIt');
                expect(result).toBeUndefined();
            });
        });
        describe('when calling tryFromCustomField when no custom fields have been set AND IS match', () => {
            it('should return return propper enumItem', () => {
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                TestEnum.one.bubba = 'likesIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.tryFromCustomField('bubba', 'likesIt');
                expect(result).toEqual({
                    bubba: 'likesIt',
                    display: 'One',
                    index: 0,
                    key: 'one',
                    value: 'ONE',
                });
            });
        });
    });
    describe('To Custom Field Values', () => {
        describe('when calling toCustomFieldValues with no options', () => {
            it('should return propper array of values', () => {
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.toCustomFieldValues('bubba');
                expect(result).toEqual(['donLikeIt', 'reallyDonLikeIt']);
            });
            it('should omit undefined', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.toCustomFieldValues('bubba');
                expect(result).toEqual(['donLikeIt', 'reallyDonLikeIt']);
            });
        });
        describe('when calling toCustomFieldValues with options set', () => {
            it('should not omit undefined', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.toCustomFieldValues('bubba', undefined, {
                    showEmpty: true,
                });
                expect(result).toEqual(['donLikeIt', 'reallyDonLikeIt', undefined]);
            });
        });
    });
    describe('To Options', () => {
        describe('when calling toOptions with no filter', () => {
            it('should return propper array of values', () => {
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                const result = TestEnum.toOptions();
                expect(result).toEqual([
                    {
                        label: 'One',
                        value: 'ONE',
                    },
                    {
                        label: 'Two',
                        value: 'TWO',
                    },
                ]);
            });
        });
        describe('when calling toOptions WITH filter', () => {
            it('should return propper array of values', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                const result = TestEnum.toOptions(x => {
                    return x.value !== 'TWO';
                });
                expect(result).toEqual([
                    {
                        label: 'One',
                        value: 'ONE',
                    },
                    {
                        label: 'Three',
                        value: 'THREE',
                    },
                ]);
            });
        });
        describe('when calling toOptions', () => {
            it('should sort by index', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = (0, enumeration_1.enumeration)({
                    input,
                });
                TestEnum.one.index = 100;
                TestEnum.three.index = 10;
                TestEnum.two.index = 200;
                const result = TestEnum.toOptions();
                expect(result).toEqual([
                    {
                        label: 'Three',
                        value: 'THREE',
                    },
                    {
                        label: 'One',
                        value: 'ONE',
                    },
                    {
                        label: 'Two',
                        value: 'TWO',
                    },
                ]);
            });
        });
        describe('To Values', () => {
            describe('when calling toValues', () => {
                it('should return all the values', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.toValues()).toEqual(['ONE', 'TWO']);
                });
            });
        });
        describe('To Keys', () => {
            describe('when calling toKeys', () => {
                it('should return all the Keys', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.toKeys()).toEqual(['one', 'two']);
                });
            });
        });
        describe('To Enum Items', () => {
            describe('when calling toEnumItems', () => {
                it('should return all the toEnumItems', () => {
                    const TestEnum = (0, enumeration_1.enumeration)({
                        input,
                    });
                    expect(TestEnum.toEnumItems()).toEqual([
                        {
                            display: 'One',
                            index: 0,
                            key: 'one',
                            value: 'ONE',
                        },
                        {
                            display: 'Two',
                            index: 1,
                            key: 'two',
                            value: 'TWO',
                        },
                    ]);
                });
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWV0aG9kcy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4dGVuc2lvbk1ldGhvZHMudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtDQUE0QztBQUM1Qyx5REFBeUQ7QUFHekQsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFFN0IsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtJQUN0QyxRQUFRLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsR0FBRSxDQUFDLENBQUMsQ0FBQztRQUNyQixRQUFRLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO1lBQ2hFLEVBQUUsQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7Z0JBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUEseUJBQVcsRUFBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXhDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztnQkFDekMsTUFBTSxNQUFNLEdBQUcsSUFBQSxzQ0FBbUIsRUFBZSxTQUFTLENBQUMsQ0FBQztnQkFDNUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsUUFBUSxDQUFDLHVEQUF1RCxFQUFFLEdBQUcsRUFBRTtZQUNyRSxFQUFFLENBQUMseURBQXlELEVBQUUsR0FBRyxFQUFFO2dCQUVqRSxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEVBQW1DO29CQUM3RCxLQUFLO2lCQUNOLENBQUMsQ0FBQztnQkFDSCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBT3pDLE1BQU0sRUFBRSxHQUFHLENBQ1QsU0FBdUQsRUFDdkQs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