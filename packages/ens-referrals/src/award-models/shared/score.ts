/**
 * The score of a referrer.
 *
 * @invariant Guaranteed to be a finite non-negative number (>= 0)
 */
export type ReferrerScore = number;

export const isValidReferrerScore = (score: ReferrerScore): boolean => {
  return score >= 0 && Number.isFinite(score);
};

export const validateReferrerScore = (score: ReferrerScore): void => {
  if (!isValidReferrerScore(score)) {
    throw new Error(
      `Invalid referrer score: ${score}. Referrer score must be a finite non-negative number.`,
    );
  }
};
