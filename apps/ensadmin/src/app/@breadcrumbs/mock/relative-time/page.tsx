"use client";

import Link from "next/link";

import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRawConnectionUrlParam } from "@/hooks/use-connection-url-param";

export default function Page() {
  const { retainCurrentRawConnectionUrlParam } = useRawConnectionUrlParam();
  const uiMocksBaseHref = retainCurrentRawConnectionUrlParam("/mock");
  return (
    <>
      <BreadcrumbLink asChild className="hidden md:block">
        <Link href={uiMocksBaseHref}>UI Mocks</Link>
      </BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>RelativeTime</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
