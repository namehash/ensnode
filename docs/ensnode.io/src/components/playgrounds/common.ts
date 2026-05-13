// TODO: Update to the latest ENSNode URL
export const ENSNODE_URL = "https://api.v2-sepolia.green.ensnode.io";

export function getNiceHeightForSnippet(snippet: string) {
  const linesCount = snippet.split("\n").length;
  const lineHeight = 18;
  const headerHeight = 38;
  const footerHeight = 32;
  const height = linesCount * lineHeight + headerHeight + footerHeight;

  const terminalHeightPercentage = 0.35;

  return Math.ceil(height / (1 - terminalHeightPercentage));
}
