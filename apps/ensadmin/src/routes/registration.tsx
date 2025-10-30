import { createFileRoute } from "@tanstack/react-router";

import { Registrations } from "@/components/recent-registrations/registrations";

export const Route = createFileRoute("/registration")({
  component: ExploreRegistrations,
});

function ExploreRegistrations() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <Registrations />
    </section>
  );
}
