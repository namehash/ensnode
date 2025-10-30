import packageJson from "@/../package.json" with { type: "json" };

import { PlugZap } from "lucide-react";

import { ENSNodeConfigInfo } from "@/components/connection/config-info";
import { ConfigInfoAppCard } from "@/components/connection/config-info/app-card";
import { CopyButton } from "@/components/copy-button";
import { ENSAdminIcon } from "@/components/icons/ensnode-apps/ensadmin-icon";
import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

function ConnectionLine() {
  return (
    <div className="relative h-10 pl-[38px]">
      <div className="w-0.5 h-full border-l-2 border-dashed border-blue-500 animate-pulse" />
    </div>
  );
}

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

        <ConfigInfoAppCard
          name="Connection"
          icon={<PlugZap className="size-7" />}
          items={[
            {
              label: "Selected Connection",
              value: (
                <span className="flex flex-row flex-no-wrap justify-start items-center gap-0.5 text-sm/6">
                  {rawSelectedConnection}{" "}
                  <CopyButton value={rawSelectedConnection} className="max-sm:hidden" />
                </span>
              ),
            },
          ]}
        />

        <ConnectionLine />

        <ENSNodeConfigInfo />
      </div>
    </section>
  );
}
