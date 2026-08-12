/**
 * Stand-in for a hand-authored external enum whose members reference user
 * code (which itself uses generated enums).
 */
import { enumeration, type Enumeration } from '@reharik/smart-enum';

import { defineEntityTypeInput } from './generatedEnums.js';
import { contractError } from './userError.js';

const input = defineEntityTypeInput({
  album: { deniedError: contractError },
  comment: {},
});

export type EntityType = Enumeration<typeof EntityType>;
export const EntityType = enumeration<typeof input>('EntityType', { input });
