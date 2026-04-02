// src/createSmartEnumPostProcessResponse.ts
import { reviveRowFromDatabase } from "smart-enums";
var isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var mapRowWithEnumRevival = (row, fieldEnumMapping, strict) => {
  if (!isRecord(row)) {
    return row;
  }
  return reviveRowFromDatabase(row, { fieldEnumMapping, strict });
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
    return reviveRowFromDatabase(result, { fieldEnumMapping, strict });
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
export {
  createSmartEnumPostProcessResponse,
  withEnumRevival
};
//# sourceMappingURL=index.js.map