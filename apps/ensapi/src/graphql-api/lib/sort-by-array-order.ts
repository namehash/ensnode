export function sortByArrayOrder<T, O>(arr: T[], acc: (o: O) => T) {
  return function comparator(a: O, b: O) {
    return arr.indexOf(acc(a)) > arr.indexOf(acc(b)) ? 1 : -1;
  };
}
