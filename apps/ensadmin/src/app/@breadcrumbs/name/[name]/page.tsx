"use client";

import { NameDisplay } from "@/components/identity/utils";
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  return (
    <BreadcrumbItem>
      <BreadcrumbPage>
        <NameDisplay name={name} />
      </BreadcrumbPage>
    </BreadcrumbItem>
  );
}
