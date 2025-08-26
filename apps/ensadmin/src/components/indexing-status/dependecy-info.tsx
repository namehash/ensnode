/**
 * This file describes UI components presenting information about
 * ENSIndexer's dependencies.
 */

import { ENSIndexerIcon } from "@/components/ensindexer-icon";
import { ENSNodeIcon } from "@/components/ensnode-icon";
import { ENSRainbowIcon } from "@/components/ensrainbow-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineSummary } from "@/components/ui/inline-summary";
import { ENSIndexerPublicConfig } from "@ensnode/ensnode-sdk";

interface ENSIndexerDependencyInfoProps {
  ensIndexerConfig: ENSIndexerPublicConfig;
}

export function ENSIndexerDependencyInfo({ ensIndexerConfig }: ENSIndexerDependencyInfoProps) {
  const { dependencyInfo, plugins, namespace, databaseSchemaName, labelSet, isSubgraphCompatible } =
    ensIndexerConfig;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <ENSNodeIcon width={28} height={28} />
          <span>ENSNode</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
        <InlineSummary
          items={[{ label: "Connection", value: ensIndexerConfig.ensNodePublicUrl.href }]}
        />

        <div className="flex flex-col gap-4">
          {/* ENSIndexer Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ENSIndexerIcon width={24} height={24} />
                <span>ENSIndexer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
              <InlineSummary
                items={[
                  { label: "Node.js", value: dependencyInfo.nodejs },
                  { label: "Ponder", value: dependencyInfo.ponder },
                ]}
              />

              <InlineSummary
                items={[
                  { label: "ENS Namespace", value: namespace },
                  { label: "Activated Plugins", value: plugins },
                  { label: "Database Schema Name", value: databaseSchemaName },
                  {
                    label: "Subgraph Compatibility Mode?",
                    value: isSubgraphCompatible ? "on" : "off",
                  },
                ]}
              />

              <InlineSummary
                items={[
                  { label: "ENSRainbow Label Set ID", value: labelSet.labelSetId },
                  { label: "ENSRainbow Label Set Version", value: labelSet.labelSetVersion },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ENSRainbowIcon width={24} height={24} />
                <span>ENSRainbow</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
              <InlineSummary
                items={[
                  { label: "Version", value: dependencyInfo.ensRainbow },
                  { label: "Schema Version", value: dependencyInfo.ensRainbowSchema },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
