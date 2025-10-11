import { Suspense } from "react";
import { ActionsNamePageContent } from "./ActionsNamePageContent";

export default function ActionsNamePage() {
  return (
    <Suspense fallback={null}>
      <ActionsNamePageContent />
    </Suspense>
  );
}
