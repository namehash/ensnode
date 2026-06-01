export function getNiceHeightForCodeSnippet(snippet: string): number {
  const linesCount = snippet.split("\n").length;
  const lineHeight = 18;
  const headerHeight = 38;
  const footerHeight = 32;
  const height = linesCount * lineHeight + headerHeight + footerHeight;

  const terminalHeightPercentage = 0.35;

  return Math.ceil(height / (1 - terminalHeightPercentage));
}
