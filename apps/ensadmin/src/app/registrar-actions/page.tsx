"use client";

import { LatestRegistrarActions } from "@/components/registrar-actions/latest-registrar-actions";
import { RequireENSAdminFeature } from "@/components/require-ensadmin-feature";

export default function Page() {
  return (
    <RequireENSAdminFeature title="Registrar Actions API" feature="registrarActions">
      <section className="flex flex-col gap-6 p-6">
        <LatestRegistrarActions recordsPerPage={25} />
      </section>
    </RequireENSAdminFeature>
  );
}
