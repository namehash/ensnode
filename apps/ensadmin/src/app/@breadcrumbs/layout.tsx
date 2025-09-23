import { Breadcrumb, BreadcrumbList } from "@/components/shadcn/breadcrumb";

export default function BreadcrumbsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbList>{children}</BreadcrumbList>
    </Breadcrumb>
  );
}
