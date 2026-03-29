import { Button } from "@/components/ui/button";

interface ResolveButtonProps {
  canResolve: boolean;
  hasChanged: boolean;
  onRefetch: () => void;
  onNavigate: () => void;
}

export function ResolveButton({
  canResolve,
  hasChanged,
  onRefetch,
  onNavigate,
}: ResolveButtonProps) {
  return (
    <Button
      onClick={() => {
        if (!canResolve) return;
        if (hasChanged) {
          onNavigate();
        } else {
          onRefetch();
        }
      }}
    >
      Resolve
    </Button>
  );
}
