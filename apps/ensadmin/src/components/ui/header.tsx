"use client";

import { Separator } from "@/components/radix-ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import * as React from "react";

const HeaderContext = React.createContext<{ className?: string } | null>(null);

function useHeaderContext() {
  const context = React.useContext(HeaderContext);
  if (!context) {
    throw new Error("Header components must be used within a Header");
  }
  return context;
}

const Header = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <HeaderContext.Provider value={{ className }}>
        <header
          ref={ref}
          className={cn(
            "flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b",
            className,
          )}
          {...props}
        >
          {children}
        </header>
      </HeaderContext.Provider>
    );
  },
);
Header.displayName = "Header";

const HeaderNav = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-2 px-4 flex-1", className)} {...props}>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {children}
      </div>
    );
  },
);
HeaderNav.displayName = "HeaderNav";

const HeaderBreadcrumbs = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("flex-1", className)} {...props} />;
  },
);
HeaderBreadcrumbs.displayName = "HeaderBreadcrumbs";

const HeaderActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex shrink-0 items-center gap-2 px-4", className)}
        {...props}
      />
    );
  },
);
HeaderActions.displayName = "HeaderActions";

export { Header, HeaderNav, HeaderBreadcrumbs, HeaderActions };
