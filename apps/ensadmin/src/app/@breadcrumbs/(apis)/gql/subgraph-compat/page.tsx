import {
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function BreadcrumbsSubgraphCompatPage() {
  return (
    <>
      <BreadcrumbItem>GraphQL</BreadcrumbItem>
      <BreadcrumbSeparator className="hidden md:block" />
      <BreadcrumbItem>
        <BreadcrumbPage>Subgraph-style</BreadcrumbPage>
      </BreadcrumbItem>
    </>
  );
}
