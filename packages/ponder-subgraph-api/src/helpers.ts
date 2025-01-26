// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_intersection
export const intersectionOf = <T>(arrays: T[][]) =>
  arrays.reduce((a, b) => a.filter((c) => b.includes(c)));
