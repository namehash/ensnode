"use client";

import { FetchAndDisplayRegistrarActionsPanel } from "@/components/registrar-actions";

export default function ExploreRegistrarActions() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <FetchAndDisplayRegistrarActionsPanel
        title="Latest indexed registrar actions"
        itemsPerPage={25}
      />
    </section>
  );
}
