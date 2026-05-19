import type { EnvReplacement, RawExampleProject, TransformedExampleProject } from "./types";

export function replaceEnvWithValues(
  project: RawExampleProject,
  replacements: EnvReplacement[],
): TransformedExampleProject {
  if (replacements.length === 0) {
    return project;
  }

  const files: Record<string, string> = {};

  for (const [path, content] of Object.entries(project.files)) {
    let next = content;
    for (const { pattern, replacement } of replacements) {
      next = next.replace(pattern, replacement);
    }
    files[path] = next;
  }

  return { files };
}
