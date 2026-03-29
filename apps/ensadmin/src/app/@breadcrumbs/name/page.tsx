"use client";

import { NameDisplay } from "@namehash/namehash-ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { Name } from "@ensnode/ensnode-sdk";

import BreadcrumbsGroup from "@/components/breadcrumbs/group";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function Page() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") as Name | null;
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const exploreNamesBaseHref = retainCurrentRawConnectionUrlParam("/name");

  return (
    <BreadcrumbsGroup name="ENS Explorer">
      {name ? (
        <>
          <BreadcrumbLink asChild className="hidden md:block">
            <Link href={exploreNamesBaseHref}>Names</Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <NameDisplay name={name} />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      ) : (
        <BreadcrumbItem>
          <BreadcrumbPage>Names</BreadcrumbPage>
        </BreadcrumbItem>
      )}
    </BreadcrumbsGroup>
  );
}
