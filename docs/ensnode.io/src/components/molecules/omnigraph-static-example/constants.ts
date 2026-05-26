export const exampleTabClass =
  "example-tab relative pb-2.5 pr-4 pt-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sl-color-text-accent)]";

/** Horizontal inset shared by code, output, tabbed, and note sections. */
export const staticExampleSectionXClass = "px-4 md:px-5";

/** Code blocks that scroll with the page (query, snippets, variables, setup). */
export const staticExampleCodeWrapClass = "min-w-0 [&_.expressive-code]:rounded-lg";

/** Output JSON: cap height; inner scroll only when content overflows. */
export const staticExampleOutputCodeWrapClass =
  "min-w-0 overflow-y-auto overscroll-y-auto [&_.expressive-code]:rounded-lg";

export const staticExampleOutputMaxHeight = "min(50vh,28rem)";

/** Muted helper copy under code blocks; parent section owns horizontal padding. */
export const staticExampleMutedTextClass =
  "text-[0.7rem] leading-relaxed text-[var(--sl-color-gray-3)]";

/** Shown under illustrative JSON output snapshots in static Omnigraph examples. */
export const staticExampleOutputSnapshotNote =
  "Output matches a GraphQL Response snapshot; live output depends on your ENSNode instance.";
