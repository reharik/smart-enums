import { enumeration, type Enumeration } from '@reharik/smart-enum';
import { enumeration as copyEnumeration } from 'smart-enum-copy';

export const Status = enumeration('Status', {
  input: { active: { value: 'ACTIVE' }, inactive: { value: 'INACTIVE' } },
});
export type Status = Enumeration<typeof Status>;

// Same enum, built by a second copy of the package.
export const CopyStatus = copyEnumeration('Status', {
  input: { active: { value: 'ACTIVE' }, inactive: { value: 'INACTIVE' } },
});
