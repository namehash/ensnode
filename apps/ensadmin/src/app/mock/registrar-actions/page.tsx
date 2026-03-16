"use client";

import { ENSNamespaceIds } from "@ensnode/datasources";

import { DisplayRegistrarActionsList } from "@/components/registrar-actions/display-registrar-actions";

import { mockRegistrarActions } from "./mocks";

export default function MockRegistrarActionsPage() {
  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-4">
      <DisplayRegistrarActionsList
        title="Mock: Registrar Actions"
        namespaceId={ENSNamespaceIds.Sepolia}
        registrarActions={mockRegistrarActions}
      />
    </section>
  );
}
