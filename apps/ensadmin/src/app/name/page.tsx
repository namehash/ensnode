import { Suspense } from "react";
import { NameDetailPageContent } from "./_components/NameDetailPageContent";
import { NameDetailPageSkeleton } from "./_components/NameDetailPageSkeleton";

export default function NameDetailPage() {
  return (
    <Suspense fallback={<NameDetailPageSkeleton />}>
      <NameDetailPageContent />
    </Suspense>
  );
}
