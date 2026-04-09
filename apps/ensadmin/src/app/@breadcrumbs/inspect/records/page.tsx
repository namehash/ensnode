"use client";

import { NameDisplay } from "@namehash/namehash-ui";
import type { Name } from "enssdk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
          <BreadcrumbLink asChild>
            <Link href={recordsBaseHref}>Record Resolution</Link>
          </BreadcrumbLink>
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
