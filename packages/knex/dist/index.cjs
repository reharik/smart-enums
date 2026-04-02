"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  createSmartEnumPostProcessResponse: () => createSmartEnumPostProcessResponse,
  withEnumRevival: () => withEnumRevival
});
module.exports = __toCommonJS(index_exports);

// src/createSmartEnumPostProcessResponse.ts
var import_ts_smart_enum = require("ts-smart-enum");
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var mapRowWithEnumRevival = (row, fieldEnumMapping, strict) => {
  if (!isRecord(row)) {
    return row;
  }
  return (0, import_ts_smart_enum.reviveRowFromDatabase)(row, { fieldEnumMapping, strict });
};
var postProcessSmartEnumResponse = (result, queryContext) => {
  const fieldEnumMapping = queryContext?.smartEnumFieldMapping;
  if (!fieldEnumMapping) {
    return result;
  }
  const strict = queryContext?.smartEnumStrict ?? false;
  if (Array.isArray(result)) {
    return result.map(
      (row) => mapRowWithEnumRevival(row, fieldEnumMapping, strict)
    );
  }
  if (isRecord(result)) {
    return (0, import_ts_smart_enum.reviveRowFromDatabase)(result, { fieldEnumMapping, strict });
  }
  return result;
};
var createSmartEnumPostProcessResponse = () => postProcessSmartEnumResponse;

// src/withEnumRevival.ts
var withEnumRevival = (query, fieldEnumMapping, options) => {
  const queryContext = {
    smartEnumFieldMapping: fieldEnumMapping,
    smartEnumStrict: options?.strict ?? false
  };
  return query.queryContext(queryContext);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSmartEnumPostProcessResponse,
  withEnumRevival
});
//# sourceMappingURL=index.cjs.map