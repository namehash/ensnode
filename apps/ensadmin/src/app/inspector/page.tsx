"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import InspectorForm from "./components/inspector-form";

const InspectorClient = dynamic(() => import("./client"), { ssr: false });

export default function InspectorPage() {
  const searchParams = useSearchParams();
  const hasParams = searchParams.has("strategy") && searchParams.has("name");

  if (!hasParams) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] p-8">
        <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-semibold mb-6">ENS Protocol Inspector</h2>
          <p className="mb-6 text-gray-600">
            Select an ENS protocol inspection strategy and enter an ENS name for a developer-friendly interactive visualization of how the ENS protocol operates.
          </p>
          <InspectorForm className="flex-col items-start" />
        </div>
      </div>
    );
  }

  return <InspectorClient />;
}
