/**
 * Produces a comparator capable of sorting a possibly-unordered result array by a set of ordered
 * keys in `arr`.
 *
 * @example results.sort(sortByArrayOrder(ids, (result) => result.id))
 */
export function sortByArrayOrder<T, O>(arr: T[], acc: (o: O) => T) {
  return function comparator(a: O, b: O) {
    return arr.indexOf(acc(a)) > arr.indexOf(acc(b)) ? 1 : -1;
  };
}
