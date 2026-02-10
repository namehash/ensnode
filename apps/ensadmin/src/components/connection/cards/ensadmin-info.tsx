import packageJson from "@/../package.json" with { type: "json" };

import { InfoCard } from "@/components/connection/shared/info-card";
import { ENSAdminIcon } from "@/components/icons/ensnode-apps/ensadmin-icon";

const docsLink = new URL("https://ensnode.io/ensadmin/");

export function ENSAdminInfo() {
  return (
    <InfoCard
      name="ENSAdmin"
      icon={<ENSAdminIcon width={28} height={28} />}
      version={
        <p className="text-sm leading-normal font-normal text-muted-foreground">
          v{packageJson.version}
        </p>
      }
      docsLink={docsLink}
    />
  );
}
