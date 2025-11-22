/**
 * The NameWrapper's PARENT_CANNOT_CONTROL fuse.
 */
const PARENT_CANNOT_CONTROL = 0x10000;

/**
 * Determines whether `fuses` has set ('burnt') the PARENT_CANNOT_CONTROL fuse.
 */
export const isPccFuseSet = (fuses: number) =>
  (fuses & PARENT_CANNOT_CONTROL) === PARENT_CANNOT_CONTROL;
