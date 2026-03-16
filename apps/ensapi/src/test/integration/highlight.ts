import chalk from "chalk";
import Prism from "prismjs";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-json";

const colorMap: Record<string, (s: string) => string> = {
  keyword: chalk.magenta,
  function: chalk.blue,
  string: chalk.green,
  number: chalk.yellow,
  punctuation: chalk.gray,
  "attr-name": chalk.cyan,
  "class-name": chalk.yellow,
  property: chalk.cyan,
  operator: chalk.magenta,
  boolean: chalk.yellow,
  null: chalk.yellow,
};

function highlightTokens(tokens: Array<string | Prism.Token>): string {
  return tokens
    .map((token) => {
      if (typeof token === "string") return token;
      const colorFn = colorMap[token.type] ?? ((s: string) => s);
      const content = Array.isArray(token.content)
        ? highlightTokens(token.content)
        : typeof token.content === "string"
          ? token.content
          : highlightTokens([token.content]);
      return colorFn(content);
    })
    .join("");
}

export function highlightGraphQL(query: string): string {
  return highlightTokens(Prism.tokenize(query, Prism.languages.graphql));
}

export function highlightJSON(json: string): string {
  return highlightTokens(Prism.tokenize(json, Prism.languages.json));
}
