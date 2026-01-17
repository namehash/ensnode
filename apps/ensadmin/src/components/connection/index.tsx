"use client";

import packageJson from "@/../package.json" with { type: "json" };

import { CopyButton } from "@namehash/namehash-ui";
import { CheckIcon, CopyIcon, PlugZap } from "lucide-react";
import * as React from "react";

import { ENSNodeConfigInfo } from "@/components/connection/config-info";
import {
  ConfigInfoAppCard,
  ConfigInfoItem,
  ConfigInfoItems,
} from "@/components/connection/config-info/app-card";
import { ConnectionLine } from "@/components/connection-line";
import { ENSAdminIcon } from "@/components/icons/ensnode-apps/ensadmin-icon";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

export default function ConnectionInfo() {
  const { rawSelectedConnection } = useSelectedConnection();

  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="relative">
        <ConfigInfoAppCard
          name="ENSAdmin"
          icon={<ENSAdminIcon width={28} height={28} />}
          version={
            <p className="text-sm leading-normal font-normal text-muted-foreground">
              v{packageJson.version}
            </p>
          }
          docsLink={new URL("https://ensnode.io/ensadmin/")}
        />

        <ConnectionLine />

        <ConfigInfoAppCard name="Connection" icon={<PlugZap className="size-7" />}>
          <ConfigInfoItems>
            <ConfigInfoItem
              label="Selected Connection"
              value={
                <span className="flex flex-row flex-no-wrap justify-start items-center gap-0.5 text-sm/6">
                  {rawSelectedConnection}{" "}
                  <CopyButton
                    value={rawSelectedConnection}
                    className="max-sm:hidden"
                    successIcon={<CheckIcon className="h-4 w-4" />}
                    icon={<CopyIcon className="h-4 w-4" />}
                    showToast={true}
                  />
                </span>
              }
            />
          </ConfigInfoItems>
        </ConfigInfoAppCard>

        <ConnectionLine />

        <ENSNodeConfigInfo />
      </div>
    </section>
  );
}
