"use client";

import dynamic from "next/dynamic";

const ReactFlowClient = dynamic(() => import("./client"), { ssr: false });

export default function ReactFlowPoCPage() {
  return (
    <>
      <h1 className="text-center font-bold leading-7 text-4xl p-2">React-Flow PoC</h1>
      <ReactFlowClient />
    </>
  );
}
