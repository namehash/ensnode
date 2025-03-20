import { Suspense } from "react";

import { RecentRegistrations } from "@/components/recent-registrations";

export default function Status() {
  return (
    <div className="p-4 md:p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Latest ENS Registrations</h1>
      </header>

      <Suspense>
        <RecentRegistrations />
      </Suspense>
    </div>
  );
}
