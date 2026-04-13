import type { Name } from "enssdk";
import { beautifyName } from "enssdk";

interface NameDisplayProps {
  name: Name;
  className?: string;
}

/**
 * Displays an ENS name in beautified form.
 *
 * @param name - The name to display in beautified form.
 *
 */
export function NameDisplay({ name, className = "nhui:font-medium" }: NameDisplayProps) {
  const beautifiedName = beautifyName(name);
  return <span className={className}>{beautifiedName}</span>;
}
