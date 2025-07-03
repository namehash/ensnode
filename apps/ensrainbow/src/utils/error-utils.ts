/**
 * Utility functions for error handling
 */

/**
 * Safely extracts an error message from an unknown error value
 * @param error - The error value to extract a message from
 * @returns A string representation of the error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
