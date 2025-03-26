"use client";

import dynamic from "next/dynamic";

const ReactFlowClient = dynamic(() => import("./client"), { ssr: false });

export default function ReactFlowPoCPage() {
  return <ReactFlowClient />;
}
