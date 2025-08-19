"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enumeration_1 = require("../enumeration");
const extensionMethods_1 = require("../extensionMethods");
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
            it('should return return proper enumItem', () => {
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
            it('should return proper array of values', () => {
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
            it('should return proper array of values', () => {
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
            it('should return proper array of values', () => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWV0aG9kcy50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL19fdGVzdHNfXy9leHRlbnNpb25NZXRob2RzLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxnREFBNkM7QUFDN0MsMERBQTBEO0FBRzFELE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBVSxDQUFDO0FBRXRDLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7SUFDdEMsUUFBUSxDQUFDLHVCQUF1QixFQUFFLEdBQUcsRUFBRTtRQUNyQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckIsUUFBUSxDQUFDLGtEQUFrRCxFQUFFLEdBQUcsRUFBRTtZQUNoRSxFQUFFLENBQUMsZ0RBQWdELEVBQUUsR0FBRyxFQUFFO2dCQUN4RCxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEVBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUV4QyxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUEsc0NBQW1CLEVBQWUsU0FBUyxDQUFDLENBQUM7Z0JBQzVELE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDckMsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILFFBQVEsQ0FBQyx1REFBdUQsRUFBRSxHQUFHLEVBQUU7WUFDckUsRUFBRSxDQUFDLHlEQUF5RCxFQUFFLEdBQUcsRUFBRTtnQkFFakUsTUFBTSxRQUFRLEdBQUcsSUFBQSx5QkFBVyxFQUFtQztvQkFDN0QsS0FBSztpQkFDTixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQU96QyxNQUFNLEVBQUUsR0FBRyxDQUNU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