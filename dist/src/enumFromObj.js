"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumFromObj = void 0;
const extensionMethods_1 = require("./extensionMethods");
const case_anything_1 = require("case-anything");
const enumFromObj = ({ input, extraExtensionMethods, propertyAutoFormatters, }) => {
    const formatProperties = (k, formatters = []) => formatters.reduce((acc, formatter) => {
        acc[formatter.key] = formatter.format(k);
        return acc;
    }, {});
    const rawEnum = Object.fromEntries(Object.entries(input).map(([k, v], i) => [
        k,
        Object.assign(Object.assign(Object.assign({ index: i, display: (0, case_anything_1.capitalCase)(k) }, formatProperties(k, propertyAutoFormatters)), v), { key: k }),
    ]));
    return Object.assign(Object.assign({}, rawEnum), (0, extensionMethods_1.addExtensionMethods)(Object.values(rawEnum), extraExtensionMethods));
};
exports.enumFromObj = enumFromObj;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bUZyb21PYmouanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZW51bUZyb21PYmoudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseURBQXlEO0FBUXpELGlEQUE0QztBQU1yQyxNQUFNLFdBQVcsR0FBRyxDQUt6QixFQUNBLEtBQUssRUFDTCxxQkFBcUIsRUFDckIsc0JBQXNCLEdBS3ZCLEVBSUMsRUFBRTtJQUNGLE1BQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBUyxFQUNULGFBQXNDLEVBQUUsRUFDeEMsRUFBRSxDQUNGLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUEyQixFQUFFLFNBQVMsRUFBRSxFQUFFO1FBQzNELEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBdUIsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFVCxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUNoQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDdkMsQ0FBQztvREFFQyxLQUFLLEVBQUUsQ0FBQyxFQUNSLE9BQU8sRUFBRSxJQUFBLDJCQUFXLEVBQUMsQ0FBQyxDQUFDLElBQ3BCLGdCQUFnQixDQUFDLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxHQUMzQyxDQUFDLEtBQ0osR0FBRyxFQUFFLENBQUM7S0FFVCxDQUFDLENBRUksQ0FBQztJQUVULHVDQUNLLE9BQU8sR0FDUCxJQUFBLHNDQUFtQixFQUNwQixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUN0QixxQkFBcUIsQ0FDdEIsRUFDRDtBQUNKLENBQUMsQ0FBQztBQWhEVyxRQUFBLFdBQVcsZUFnRHRCIn0=