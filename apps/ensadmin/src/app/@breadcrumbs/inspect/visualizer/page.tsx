import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function Page() {
  return (
    <BreadcrumbItem>
      <BreadcrumbPage className="flex items-center gap-1">
        Visualization Example{" "}
        <span className="xl:inline relative -top-1 bg-black w-fit h-fit p-[2.8px] rounded-[2.8px] flex-shrink-0 text-white not-italic font-semibold pb-0.5 text-[6.857px] leading-[7.619px] sm:text-[8.409px] sm:leading-[9.343px] select-none">
          teaser
        </span>
      </BreadcrumbPage>
    </BreadcrumbItem>
  );
}
