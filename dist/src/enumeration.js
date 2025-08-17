"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumeration = enumeration;
const enumFromArr_1 = require("./enumFromArr");
const enumFromObj_1 = require("./enumFromObj");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enumeration(arg) {
    if (Array.isArray(arg.input)) {
        return (0, enumFromArr_1.enumFromArr)(arg);
    }
    if (typeof arg.input === 'object') {
        return (0, enumFromObj_1.enumFromObj)(arg);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bWVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZW51bWVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF3RFMsa0NBQVc7QUF4RHBCLCtDQUE0QztBQUM1QywrQ0FBNEQ7QUE2QzVELDhEQUE4RDtBQUM5RCxTQUFTLFdBQVcsQ0FBQyxHQUFRO0lBQzNCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUM3QixPQUFPLElBQUEseUJBQVcsRUFBQyxHQUFHLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDbEMsT0FBTyxJQUFBLHlCQUFXLEVBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUIsQ0FBQztBQUNILENBQUMifQ==