import Link from "next/link";

import { Button } from "@/components/ui/button";

interface ResolveButtonProps {
  canResolve: boolean;
  hasChanged: boolean;
  navigateHref: string;
  onRefetch: () => void;
}

export function ResolveButton({
  canResolve,
  hasChanged,
  navigateHref,
  onRefetch,
}: ResolveButtonProps) {
  // NOTE: rendered as a Link when navigating because Next.js 16 + Turbopack dev
  // mode does not consistently re-render on `router.push` to the same pathname
  // with only changed query params. `<Link>` does.
  if (!canResolve) {
    return <Button disabled>Resolve</Button>;
  }

  if (hasChanged) {
    return (
      <Button asChild>
        <Link href={navigateHref}>Resolve</Link>
      </Button>
    );
  }

  return <Button onClick={onRefetch}>Resolve</Button>;
}
