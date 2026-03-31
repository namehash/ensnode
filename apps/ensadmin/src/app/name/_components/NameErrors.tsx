import { ErrorInfo } from "@/components/error-info";

export function UnnormalizedNameError() {
  return (
    <section className="p-6">
      <ErrorInfo title="Invalid Name" description="The provided name is not a valid ENS name." />
    </section>
  );
}

export function InterpretedNameUnsupportedError() {
  return (
    <section className="p-6">
      <ErrorInfo
        title="Encoded Labelhash Detected"
        description="The provided name contains encoded labelhashes. Support for resolving names with encoded labelhashes is in progress and coming soon."
      />
    </section>
  );
}
