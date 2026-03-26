import type { Name } from "@ensnode/ensnode-sdk";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NameErrorProps {
  name: Name;
}

export function InvalidNameError({ name }: NameErrorProps) {
  return (
    <section className="flex flex-col gap-6 p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl text-red-600">Invalid Name</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The provided name{" "}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{name}</code> is not ENS
            normalized.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export function EncodedLabelhashUnsupportedError({ name }: NameErrorProps) {
  return (
    <section className="flex flex-col gap-6 p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">Encoded Labelhash Detected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The provided name{" "}
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{name}</code> contains
            encoded labelhashes. Support for resolving names with encoded labelhashes is in progress
            and coming soon.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
