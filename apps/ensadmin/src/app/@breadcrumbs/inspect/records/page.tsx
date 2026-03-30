"use client";

import { NameDisplay } from "@namehash/namehash-ui";
import { useSearchParams } from "next/navigation";

import type { Name } from "@ensnode/ensnode-sdk";

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function Page() {
  const searchParams = useSearchParams();
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const recordsBaseHref = retainCurrentRawConnectionUrlParam("/inspect/records");

  const name = (searchParams.get("name")?.trim() || null) as Name | null;

  if (name) {
    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink href={recordsBaseHref}>Record Resolution</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <NameDisplay name={name} />
          </BreadcrumbPage>
        </BreadcrumbItem>
      </>
    );
  }

  return (
    <BreadcrumbItem>
      <BreadcrumbPage>Record Resolution</BreadcrumbPage>
    </BreadcrumbItem>
  );
}
