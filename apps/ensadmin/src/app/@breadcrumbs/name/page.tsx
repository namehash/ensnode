import { Suspense } from "react";
import { BreadcrumbsNamePageContent } from "./BreadcrumbsNamePageContent";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BreadcrumbsNamePageContent />
    </Suspense>
  );
}
