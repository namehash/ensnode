"use client";

import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  return (
    <BreadcrumbItem>
      <BreadcrumbPage>{name}</BreadcrumbPage>
    </BreadcrumbItem>
  );
}
