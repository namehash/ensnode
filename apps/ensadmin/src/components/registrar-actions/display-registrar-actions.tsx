"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  getEnsManagerAddressDetailsUrl,
  RegistrarActionCardLoading,
  RegistrarActionCardMemo,
  useNow,
} from "@namehash/namehash-ui";

import { ENSNamespaceId, NamedRegistrarAction } from "@ensnode/ensnode-sdk";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

import { getNameDetailsRelativePath } from "../name-links";

interface DisplayRegistrarActionsListProps {
  title: string;
  namespaceId: ENSNamespaceId;
  registrarActions: NamedRegistrarAction[];
}

/**
 * Displays a list of {@link NamedRegistrarAction}s.
 */
export function DisplayRegistrarActionsList({
  title,
  namespaceId,
  registrarActions,
}: DisplayRegistrarActionsListProps) {
  const [animationParent] = useAutoAnimate();
  const now = useNow();
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={animationParent}
          className="w-full h-fit box-border flex flex-col justify-start items-center gap-3"
        >
          {registrarActions.map((namedRegistrarAction) => (
            <RegistrarActionCardMemo
              key={namedRegistrarAction.action.id}
              namespaceId={namespaceId}
              namedRegistrarAction={namedRegistrarAction}
              now={now}
              links={{
                name: {
                  isExternal: false,
                  link: new URL(
                    retainCurrentRawConnectionUrlParam(
                      getNameDetailsRelativePath(namedRegistrarAction.name),
                    ),
                    "https://admin.ensnode.io/",
                  ),
                },
                registrant: {
                  isExternal: true,
                  link: getEnsManagerAddressDetailsUrl(
                    namedRegistrarAction.action.registrant,
                    namespaceId,
                  ),
                },
                referrer: {
                  isExternal: true,
                  getLink: getEnsManagerAddressDetailsUrl,
                },
              }}
              showIdentityTooltips={{
                registrant: true,
                referrer: true,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface DisplayRegistrarActionsListPlaceholderProps {
  title: string;
  recordsPerPage: number;
}

/**
 * Displays a placeholder for a list of {@link NamedRegistrarAction}s.
 */
export function DisplayRegistrarActionsListPlaceholder({
  title,
  recordsPerPage,
}: DisplayRegistrarActionsListPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-sm:p-3 max-sm:pt-0">
        <div className="space-y-4">
          {[...Array(recordsPerPage)].map((_, idx) => (
            <RegistrarActionCardLoading key={idx} showReferralProgramField={false} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
