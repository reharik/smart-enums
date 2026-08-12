/**
 * Mirrors the `version` field in package.json; used only for duplicate-install
 * diagnostics (see utilities/duplicateLoadDetection.ts). A test fails when
 * this drifts from package.json, so bump both together.
 */
export const LIBRARY_VERSION = '0.9.0';
