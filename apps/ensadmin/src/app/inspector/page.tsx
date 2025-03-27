"use client";

import dynamic from "next/dynamic";

const InspectorClient = dynamic(() => import("./client"), { ssr: false });

export default function InspectorPage() {
  return <InspectorClient />;
}
