"use client";

import { InfoCardConnector } from "@/components/connection/shared/info-card";

import { ConnectionInfo } from "./cards/connection-info";
import { ENSAdminInfo } from "./cards/ensadmin-info";
import { LoadAndDisplayEnsNodeStackInfo } from "./cards/ensnode-stack-info";

export default function DisplayConnectionDetails() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="relative">
        <ENSAdminInfo />

        <InfoCardConnector />

        <ConnectionInfo />

        <InfoCardConnector />

        <LoadAndDisplayEnsNodeStackInfo />
      </div>
    </section>
  );
}
