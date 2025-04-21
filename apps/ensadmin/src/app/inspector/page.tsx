"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import InspectorForm from "./components/inspector-form";

import Loading from "./loading";

const InspectorClient = dynamic(() => import("./client"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function InspectorPage() {
  const searchParams = useSearchParams();
  const hasParams = searchParams.has("strategy") && searchParams.has("name");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasParams) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [hasParams, searchParams]);

  if (!hasParams) {
    return (
      <div className="bg-[#F7F9FB] h-screen w-full">
        <div className="flex flex-col items-center justify-center h-[calc(100vh-6rem)] p-8">
          <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6 inline-flex items-center gap-1">
              <span>ENS Protocol Inspector</span>
              <span className="hidden xl:inline relative -top-1 bg-black w-fit h-fit p-[2.8px] rounded-[2.8px] flex-shrink-0 text-white not-italic font-semibold pb-0.5 text-[6.857px] leading-[7.619px] sm:text-[8.409px] sm:leading-[9.343px] select-none">
                teaser
              </span>
            </h2>
            <p className="mb-6 text-gray-600">
              Select an ENS protocol inspection strategy and enter an ENS name for a
              developer-friendly interactive visualization of how the ENS protocol operates.
            </p>
            <InspectorForm className="flex-col items-start" />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return <InspectorClient />;
}
