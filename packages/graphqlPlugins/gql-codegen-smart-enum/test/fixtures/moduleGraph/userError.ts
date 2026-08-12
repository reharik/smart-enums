/**
 * Stand-in for user code (like a ContractError module) that uses a GENERATED
 * enum and sits in the import closure of a hand-authored enum. This is the
 * edge that made registry-in-the-enums-file a load-order-dependent TDZ crash.
 */
import { ErrorCategory } from './generatedEnums.js';

export const contractError = {
  code: 'MEMBER_NOT_ALLOWED',
  category: ErrorCategory.auth,
} as const;
