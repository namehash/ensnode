import type { Name } from "@ensnode/ensnode-sdk";

import { ErrorInfo } from "@/components/error-info";

interface NameErrorProps {
  name: Name;
}

export function InvalidNameError({ name }: NameErrorProps) {
  return (
    <section className="p-6">
      <ErrorInfo
        title="Invalid Name"
        description={`The provided name "${name}" is not a valid ENS name.`}
      />
    </section>
  );
}

export function EncodedLabelhashUnsupportedError({ name }: NameErrorProps) {
  return (
    <section className="p-6">
      <ErrorInfo
        title="Encoded Labelhash Detected"
        description={`The provided name "${name}" contains encoded labelhashes. Support for resolving names with encoded labelhashes is in progress and coming soon.`}
      />
    </section>
  );
}
