import type { Name } from "@ensnode/ensnode-sdk";
import { beautifyName, isInterpretedName } from "@ensnode/ensnode-sdk";

interface NameDisplayProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name in beautified form.
 *
 * If the provided name is not a valid InterpretedName, displays
 * "(invalid name)" instead.
 *
 * @param name - The name to display.
 */
export function NameDisplay({ name, className = "nhui:font-medium" }: NameDisplayProps) {
  if (!isInterpretedName(name)) {
    return <span className={className}>(invalid name)</span>;
  }

  const beautifiedName = beautifyName(name);
  return <span className={className}>{beautifiedName}</span>;
}
