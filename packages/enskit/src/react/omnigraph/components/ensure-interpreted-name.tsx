import { type InterpretedName, isInterpretedName, type Name, nameToInterpretedName } from "enssdk";
import type { ReactNode } from "react";

type MalformedNameRenderer = (name: string) => ReactNode;
type InterpretedNameRenderer = (name: InterpretedName) => ReactNode;

/**
 * Renders a Name by ensuring it is an InterpretedName. If the name is already
 * interpreted, renders via `children`. If not, attempts to interpret it and
 * renders via `interpreted` (enabling e.g. a redirect). If interpretation
 * fails (malformed or unnormalizable), renders via `malformed`.
 */
export function EnsureInterpretedName({
  name,
  children,
  interpreted,
  malformed,
}: {
  name: Name;
  children: InterpretedNameRenderer;
  interpreted: InterpretedNameRenderer;
  malformed: MalformedNameRenderer;
}) {
  if (isInterpretedName(name)) return children(name);

  try {
    // this isn't an InterpretedName, let's try to redirect the user to the InterpretedName
    // which ensures that our app only ever operates on InterpretedNames
    return interpreted(nameToInterpretedName(name));
  } catch {
    // this name can't conform to InterpretedName: it is malformed or contains unnormalizable Labels
    return malformed(name);
  }
}
