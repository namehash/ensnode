import { cn } from "../../utils/cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("nhui:bg-accent nhui:animate-pulse nhui:rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
