"use client";

import { ResolveAndDisplayRecentRegistrations } from "@/components/recent-registrations/resolution";

export default function ExploreRegistrations() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <ResolveAndDisplayRecentRegistrations
        title="Latest indexed registrations and renewals"
        maxItems={25}
      />
    </section>
  );
}
