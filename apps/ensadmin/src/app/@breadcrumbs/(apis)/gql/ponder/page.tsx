import { BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BreadcrumbsPonderPage() {
  return (
    <>
      <BreadcrumbItem>GraphQL</BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>Ponder-style</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
