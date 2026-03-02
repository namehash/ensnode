import { ReactNode } from "react";

import { AlertIcon } from "@/components/icons/AlertIcon";
import { InternalLink } from "@/components/link";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ENSAdminFeatures,
  FeatureStatus,
  useENSAdminFeatures,
} from "@/hooks/active/use-ensadmin-features";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export function RequireENSAdminFeature({
  title,
  feature,
  children,
}: {
  title: ReactNode;
  feature: keyof ENSAdminFeatures;
  children: ReactNode;
}) {
  const features = useENSAdminFeatures();
  const status = features[feature];

  return (
    <RequireENSAdminFeatureView title={title} status={status}>
      {children}
    </RequireENSAdminFeatureView>
  );
}

/**
 * Presentational component that renders the appropriate UI for a given {@link FeatureStatus}.
 * Used by {@link RequireENSAdminFeature} internally and by mock pages directly.
 */
export function RequireENSAdminFeatureView({
  title,
  status,
  children,
}: {
  title: ReactNode;
  status: FeatureStatus;
  children: ReactNode;
}) {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  if (status.type === "supported") return <>{children}</>;
  if (status.type === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner className="h-16 w-16" />
      </div>
    );
  }

  return (
    <section className="flex flex-col p-6">
      <Card className="w-full">
        <CardHeader className="pb-2 max-sm:p-3">
          <CardTitle className="flex flex-row justify-start items-center gap-2 text-2xl max-sm:text-lg">
            <AlertIcon width={22} height={22} className="shrink-0" />
            {title} —{" "}
            {status.type === "error"
              ? "Error"
              : status.type === "not-ready"
                ? "Not Ready"
                : "Unsupported"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-md whitespace-pre-wrap max-sm:px-3 max-sm:pb-3">
          {status.reason}
        </CardContent>
        <CardFooter className="gap-6">
          {status.type === "not-ready" ? (
            <Button asChild>
              <InternalLink href={retainCurrentRawConnectionUrlParam("/status")}>
                See ENSNode Indexing Status
              </InternalLink>
            </Button>
          ) : (
            <Button asChild>
              <InternalLink href={retainCurrentRawConnectionUrlParam("/connection")}>
                See ENSNode Config
              </InternalLink>
            </Button>
          )}
        </CardFooter>
      </Card>
    </section>
  );
}
