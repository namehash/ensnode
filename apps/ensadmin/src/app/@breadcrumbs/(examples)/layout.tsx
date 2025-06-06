import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default function BreadcrumbsExamplesLayout({
                                                      children,
                                                  }: {
    children: React.ReactNode;
}) {
    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">Examples</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                {children}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

