/**
 * Given a Promise<(Error | T)[]>, throws with the first Error, if any.
 *
 * @throws The first Error encountered in `promise`, if any.
 * @dev This is useful for making manual Dataloaded arrays conform to T[].
 * @example return rejectAnyErrors(SomeLoadableRef.getDataloader(context).load(ids))
 */
export async function rejectAnyErrors<T>(
  promise: Promise<readonly (Error | T)[]>,
): Promise<readonly T[]> {
  const values = await promise;

  for (const element of values) {
    if (element instanceof Error) {
      throw element;
    }
  }

  return values as readonly T[];
}
