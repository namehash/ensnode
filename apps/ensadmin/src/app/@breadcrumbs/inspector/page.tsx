import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function BreadcrumbsInspectorPage() {
  return (
    <BreadcrumbItem>
      <BreadcrumbPage className="flex items-center gap-1">
        ENS Protocol Inspector{" "}
        <div className="hidden lg:inline relative -top-1.5 bg-black w-fit h-fit p-[2.8px] rounded-[2.8px] flex-shrink-0">
          <span className="text-white not-italic font-semibold pb-[0.5px] text-[6.857px] leading-[7.619px] sm:text-[8.409px] sm:leading-[9.343px] cursor-pointer">
            teaser
          </span>
        </div>
      </BreadcrumbPage>
    </BreadcrumbItem>
  );
}
