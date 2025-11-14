"use client";

import { ResolveAndDisplayRegistrarActionsPanel } from "@/components/recent-registrations/resolution";

export default function ExploreRegistrarActions() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <ResolveAndDisplayRegistrarActionsPanel
        title="Latest indexed registrar actions"
        maxItems={25}
      />
    </section>
  );
}
