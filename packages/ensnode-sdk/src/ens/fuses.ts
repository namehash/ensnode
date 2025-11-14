const PARENT_CANNOT_CONTROL = 0x10000;

export const isPccFuseSet = (fuses: number) =>
  (fuses & PARENT_CANNOT_CONTROL) === PARENT_CANNOT_CONTROL;
