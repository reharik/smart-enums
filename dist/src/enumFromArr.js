"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumFromArr = void 0;
const case_anything_1 = require("case-anything");
const extensionMethods_1 = require("./extensionMethods");
const enumFromArr = ({ input, extraExtensionMethods, propertyAutoFormatters, }) => {
    const formatProperties = (k, formatters = []) => formatters.reduce((acc, formatter) => {
        acc[formatter.key] = formatter.format(k);
        return acc;
    }, {});
    const rawEnum = Object.fromEntries(input.map((k, i) => [
        k,
        Object.assign({ key: k, index: i, value: (0, case_anything_1.constantCase)(k), display: (0, case_anything_1.capitalCase)(k) }, formatProperties(k, propertyAutoFormatters)),
    ]));
    return Object.assign(Object.assign({}, rawEnum), (0, extensionMethods_1.addExtensionMethods)(Object.values(rawEnum), extraExtensionMethods));
};
exports.enumFromArr = enumFromArr;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bUZyb21BcnIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZW51bUZyb21BcnIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaURBQTBEO0FBRTFELHlEQUF5RDtBQUdsRCxNQUFNLFdBQVcsR0FBRyxDQUt6QixFQUNBLEtBQUssRUFDTCxxQkFBcUIsRUFDckIsc0JBQXNCLEdBS3ZCLEVBQW9FLEVBQUU7SUFDckUsTUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixDQUFTLEVBQ1QsYUFBc0MsRUFBRSxFQUN4QyxFQUFFLENBQ0YsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQTJCLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFDM0QsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUF1QixDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQ2hDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNsQixDQUFDO3dCQUVDLEdBQUcsRUFBRSxDQUFDLEVBQ04sS0FBSyxFQUFFLENBQUMsRUFDUixLQUFLLEVBQUUsSUFBQSw0QkFBWSxFQUFDLENBQUMsQ0FBQyxFQUN0QixPQUFPLEVBQUUsSUFBQSwyQkFBVyxFQUFDLENBQUMsQ0FBQyxJQUNwQixnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsc0JBQXNCLENBQUM7S0FFakQsQ0FBQyxDQUVJLENBQUM7SUFFVCx1Q0FDSyxPQUFPLEdBQ1AsSUFBQSxzQ0FBbUIsRUFDcEIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFDdEIscUJBQXFCLENBQ3RCLEVBQ0Q7QUFDSixDQUFDLENBQUM7QUEzQ1csUUFBQSxXQUFXLGVBMkN0QiJ9