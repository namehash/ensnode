import { rehypeHeadingIds } from "@astrojs/markdown-remark";

export function headingIds() {
  return rehypeHeadingIds();
}
