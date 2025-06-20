import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BreadcrumbsExampleEditorPage() {
  return (
    <>
      <BreadcrumbLink href="/example-queries" target="_self">
        Queries
      </BreadcrumbLink>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>Editor</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
