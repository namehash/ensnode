export const isInteger = (value: number): boolean => {
  return Number.isInteger(value);
};

export const isNonNegativeInteger = (value: number): boolean => {
  return value >= 0 && Number.isInteger(value);
};

export const isPositiveInteger = (value: number): boolean => {
  return value >= 1 && Number.isInteger(value);
};

export const validateNonNegativeInteger = (value: number): void => {
  if (!isNonNegativeInteger(value)) {
    throw new Error(`Invalid non-negative integer: ${value}.`);
  }
};

export const isFiniteNonNegativeNumber = (value: number): boolean => {
  return value >= 0 && Number.isFinite(value);
};
