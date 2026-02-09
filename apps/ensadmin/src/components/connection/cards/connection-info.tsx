import { CopyButton } from "@namehash/namehash-ui";
import { CheckIcon, CopyIcon, PlugZap } from "lucide-react";

import { useSelectedConnection } from "@/hooks/active/use-selected-connection";

import { InfoCard, InfoCardItem, InfoCardItems } from "../shared/info-card";

export function ConnectionInfo() {
  const { rawSelectedConnection } = useSelectedConnection();

  return (
    <InfoCard name="Connection" icon={<PlugZap className="size-7" />}>
      <InfoCardItems>
        <InfoCardItem
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
      </InfoCardItems>
    </InfoCard>
  );
}
