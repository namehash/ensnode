import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function Page() {
  return (
    <>
      <BreadcrumbItem className="hidden md:block">Mock</BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>Indexing Status</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
