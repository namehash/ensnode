import { TagBadge } from "@/components/tag-badge";
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function Page() {
  return (
    <BreadcrumbItem>
      <BreadcrumbPage className="flex items-center gap-1">
        ENS Omnigraph <TagBadge variant="ENSv2" className="xl:inline relative -top-1" />
      </BreadcrumbPage>
    </BreadcrumbItem>
  );
}
