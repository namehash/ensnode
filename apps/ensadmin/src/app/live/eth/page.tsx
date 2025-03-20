import { Suspense } from "react";

import { RecentRegistrations } from "@/components/recent-registrations";

export default function Status() {
  return (
    <div className="p-4 md:p-6">
      <Suspense>
        <RecentRegistrations />
      </Suspense>
    </div>
  );
}
