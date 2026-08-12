/**
 * Hand-written stand-in for the emit: 'enumRegistry' output: imports the
 * generated enums AND the hand-authored ones; nothing imports it except
 * bootstrap code, so it is a pure sink in the module graph.
 */
import { ErrorCategory } from './generatedEnums.js';
import { EntityType } from './userEnum.js';

export const enumRegistry = { EntityType, ErrorCategory } as const;
