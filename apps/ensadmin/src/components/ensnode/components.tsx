import { ErrorMessage } from "@/components/ui/error-message";
import { useEffect } from "react";
import { ENSNodeConnectionError, ENSNodeResponseValidationError } from "./errors";

const handledErrors = [ENSNodeConnectionError, ENSNodeResponseValidationError] as const;

type HandledError = (typeof handledErrors)[number];

interface ENSNodeErrorMessageProps {
  error: HandledError;
  reset: () => void;
}

/**
 * Renders an error message for ENSNode errors.
 * @param error The error to render.
 * @returns The error message.
 */
export function ENSNodeErrorMessage({ error, reset }: ENSNodeErrorMessageProps) {
  // Reset the error when the ENSNode connection is changed
  useEffect(() => {
    // Add event listener
    window.addEventListener("ensnode/connection/set", reset);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("ensnode/connection/set", reset);
    };
  }, [error, reset]);

  if (error instanceof ENSNodeConnectionError) {
    return (
      <ErrorMessage>
        <ErrorMessage.Header>ENSNode connection error</ErrorMessage.Header>
        <ErrorMessage.Message>
          ESNAdmin could not switch to selected ENSNode connection due to the following error:{" "}
          <em>{error.message}</em>.
        </ErrorMessage.Message>
        <ErrorMessage.Message>
          Please try to switch to a different ENSNode connection.
        </ErrorMessage.Message>
      </ErrorMessage>
    );
  }

  if (error instanceof ENSNodeResponseValidationError) {
    return (
      <ErrorMessage>
        <ErrorMessage.Header>ENSNode response validation error</ErrorMessage.Header>
        <ErrorMessage.Message>{error.message}</ErrorMessage.Message>
      </ErrorMessage>
    );
  }

  throw new Error(`Cannot render error message for unknown error: ${error.name}`);
}

ENSNodeErrorMessage.isHandledError = function isHandledError(
  error: unknown,
): error is HandledError {
  return handledErrors.some((handledError) => error instanceof handledError);
};
