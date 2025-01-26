export const intersectionOf = <T>(arrays: T[][]) =>
  arrays.reduce((a, b) => a.filter((c) => b.includes(c)));
