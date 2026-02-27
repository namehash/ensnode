"use client";

import { FetchAndDisplayRegistrarActionsPanel } from "@/components/registrar-actions";
import { RequireENSAdminFeature } from "@/components/require-feature";

function ExploreRegistrarActions() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <FetchAndDisplayRegistrarActionsPanel
        title="Latest indexed registrar actions"
        itemsPerPage={25}
      />
    </section>
  );
}

export default function Page() {
  return (
    <RequireENSAdminFeature title="Registrar Actions API" feature="registrarActions">
      <ExploreRegistrarActions />
    </RequireENSAdminFeature>
  );
}
