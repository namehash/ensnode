import { LoadingSpinner } from "@/components/loading-spinner";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LoadingSpinner className="h-16 w-16" />
    </div>
  );
}
