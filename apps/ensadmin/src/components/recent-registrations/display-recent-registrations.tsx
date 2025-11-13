"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";

import { NamedRegistrarAction } from "@ensnode/ensnode-sdk";

import { ErrorInfo } from "@/components/error-info";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DisplayRegistrationCard, DisplayRegistrationCardPlaceholder } from "./registration-card";
import { ResolutionStatusIds, type ResolvedRecentRegistrations } from "./types";

interface DisplayRegistrationsListProps {
  registrarActions: NamedRegistrarAction[];
}

/**
 * Displays a list of Registrations and Renewals.
 */
function DisplayRegistrationsList({ registrarActions }: DisplayRegistrationsListProps) {
  const [animationParent] = useAutoAnimate();

  return (
    <div
      ref={animationParent}
      className="w-full h-fit box-border flex flex-col justify-start items-center gap-3"
    >
      {registrarActions.map(({ action, name }) => (
        <DisplayRegistrationCard key={name} registrarAction={action} name={name} />
      ))}
    </div>
  );
}

interface DisplayRegistrationsListPlaceholderProps {
  recordCount: number;
}

/**
 * Displays a placeholder for a list of Registrations and Renewals.
 */
function DisplayRegistrationsListPlaceholder({
  recordCount,
}: DisplayRegistrationsListPlaceholderProps) {
  return (
    <div className="space-y-4">
      {[...Array(recordCount)].map((_, idx) => (
        <DisplayRegistrationCardPlaceholder key={idx} />
      ))}
    </div>
  );
}

export interface DisplayRecentRegistrationProps {
  resolvedRecentRegistrations: ResolvedRecentRegistrations;
  title: string;
}

/**
 * Display Recent Registrations and Renewals
 */
export function DisplayRecentRegistrations({
  resolvedRecentRegistrations,
  title,
}: DisplayRecentRegistrationProps) {
  switch (resolvedRecentRegistrations.resolutionStatus) {
    case ResolutionStatusIds.Disabled:
      return <>{title} cannot be loaded at the moment.</>;

    case ResolutionStatusIds.Unresolved:
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-sm:p-3 max-sm:pt-0">
            <DisplayRegistrationsListPlaceholder
              recordCount={resolvedRecentRegistrations.placeholderCount}
            />
          </CardContent>
        </Card>
      );

    case ResolutionStatusIds.Unavailable:
      return <ErrorInfo title={title} description={resolvedRecentRegistrations.reason} />;

    case ResolutionStatusIds.Available:
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DisplayRegistrationsList
              registrarActions={resolvedRecentRegistrations.registrarActions}
            />
          </CardContent>
        </Card>
      );
  }
}
