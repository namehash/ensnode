import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>{children}</BreadcrumbList>
    </Breadcrumb>
  );
}
