/**
 * Type guard to check if a value is not null or undefined
 * @param value - The value to check
 * @returns True if the value is defined and not null
 */
export const notEmpty = (value) => {
    // eslint-disable-next-line unicorn/no-null
    return value != null;
};
