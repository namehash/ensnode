"use client";

import type { Name } from "enssdk";
import { User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useRecords } from "@ensnode/ensnode-react";
import { getNamespaceSpecificValue } from "@ensnode/ensnode-sdk";

import { RenderRequestsOutput } from "@/app/inspect/_components/render-requests-output";
import { ResolveButton } from "@/app/inspect/_components/resolve-button";
import {
  getNameDetailsRelativePath,
  getRecordResolutionRelativePath,
} from "@/components/name-links";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActiveNamespace } from "@/hooks/active/use-active-namespace";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";
import { DefaultRecordsSelection } from "@/lib/default-records-selection";

import { EXAMPLE_NAMES } from "../_lib/example-names";

// TODO: showcase current ENSNode configuration and viable acceleration pathways?
// TODO: use shadcn/form, react-hook-form, and zod to make all of this nicer aross the board
export default function ResolveRecordsInspector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameFromQuery = (searchParams.get("name")?.trim() || null) as Name | null;

  const namespace = useActiveNamespace();
  const exampleNames = useMemo(
    () => getNamespaceSpecificValue(namespace, EXAMPLE_NAMES),
    [namespace],
  );

  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();

  const [inputName, setInputName] = useState(nameFromQuery ?? "");

  // Sync input with URL param when it changes (e.g., clicking examples or navigating back)
  useEffect(() => {
    setInputName(nameFromQuery ?? "");
  }, [nameFromQuery]);

  const selection = DefaultRecordsSelection[namespace];

  const navigateToName = (name: Name) => {
    setInputName(name);
    const href = retainCurrentRawConnectionUrlParam(getRecordResolutionRelativePath(name));
    router.push(href);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputName.trim();
    if (trimmed === nameFromQuery) {
      refetch();
    } else if (trimmed) {
      navigateToName(trimmed);
    } else {
      const href = retainCurrentRawConnectionUrlParam("/inspect/records");
      router.push(href);
    }
  };

  const accelerated = useRecords({
    name: nameFromQuery,
    accelerate: true,
    selection,
    trace: true,
    query: {
      enabled: !!nameFromQuery,
      staleTime: 0,
      refetchInterval: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  });

  const unaccelerated = useRecords({
    name: nameFromQuery,
    accelerate: false,
    selection,
    trace: true,
    query: {
      enabled: !!nameFromQuery,
      staleTime: 0,
      refetchInterval: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
    },
  });

  const refetch = () => {
    accelerated.refetch();
    unaccelerated.refetch();
  };

  return (
    <div className="flex flex-col gap-4 p-4 min-w-0">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Record Resolution Inspector</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-row gap-4">
            <Label htmlFor="name" className="w-full max-w-64 flex flex-col gap-1">
              ENS Name
              <Input
                id="name"
                placeholder={exampleNames[0]}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                autoComplete="off"
                autoFocus
                data-1p-ignore
              />
            </Label>
            <Label htmlFor="selection" className="flex-1 flex flex-col gap-1">
              Records Selection
              <Input id="selection" value={JSON.stringify(selection)} disabled />
            </Label>
          </form>
          <div className="flex flex-col gap-2 justify-center">
            <span className="text-sm font-medium leading-none">Examples:</span>
            {/* -mx-6 px-6 insets the scroll container against card for prettier scrolling */}
            <div className="flex flex-row overflow-x-scroll gap-2 no-scrollbar -mx-6 px-6">
              {exampleNames.map((name) => (
                <Pill key={name} onClick={() => navigateToName(name)} className="font-mono">
                  {name}
                </Pill>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <ResolveButton
            canResolve={!!inputName.trim()}
            hasChanged={inputName.trim() !== nameFromQuery}
            onRefetch={refetch}
            onNavigate={() => navigateToName(inputName.trim())}
          />
        </CardFooter>
      </Card>

      {nameFromQuery && (
        <RenderRequestsOutput
          dataKey="records"
          accelerated={accelerated}
          unaccelerated={unaccelerated}
          headerActions={
            <Button variant="link" size="sm" asChild>
              <Link
                href={retainCurrentRawConnectionUrlParam(getNameDetailsRelativePath(nameFromQuery))}
                className="inline-flex items-center gap-1"
              >
                View Profile
                <User size={12} />
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
