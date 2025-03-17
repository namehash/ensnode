import { PropsWithChildren } from "react";

export function Toolbar({ children }: PropsWithChildren) {
  return (
    <nav className="border-b">
      <div className="h-14 bg-card px-4 flex items-center">{children}</div>
    </nav>
  );
}
