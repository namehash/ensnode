import { cn } from "@/lib/utils";

type TagBadgeVariant = "deprecated" | "teaser" | "ENSv2";

const variantClasses: Record<TagBadgeVariant, string> = {
  deprecated: "bg-gray-200 text-gray-900",
  teaser: "bg-black text-white",
  ENSv2: "bg-green-200 text-green-900",
};

export function TagBadge({ variant, className }: { variant: TagBadgeVariant; className?: string }) {
  return (
    <span
      className={cn(
        "w-fit h-fit p-[2.8px] rounded-[2.8px] shrink-0 not-italic font-semibold pb-0.5 text-[6.857px] leading-[7.619px] sm:text-[8.409px] sm:leading-[9.343px] select-none",
        variantClasses[variant],
        className,
      )}
    >
      {variant}
    </span>
  );
}
