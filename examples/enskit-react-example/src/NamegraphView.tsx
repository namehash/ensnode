/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  Namegraph Explorer — a vibe-coded demo
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  This whole page and its supporting modules (this file, plus `ensnode.ts`)
 *  were vibe-coded: written largely by prompting an agent, not by hand-tuning
 *  every line. They exist to show how far you can get building real ENS
 *  experiences with off-the-shelf tooling alone:
 *
 *    • enskit        — the React hooks + `OmnigraphProvider` backing this UI
 *    • the Omnigraph — one GraphQL API unifying ENSv1 + ENSv2 across all chains,
 *                      which makes a lazy forward-traversal of the namegraph,
 *                      canonical-vs-addressable comparison, and forward
 *                      resolution-with-trace expressible as a handful of queries
 *    • ensskills     — the agent skills that taught the model to wield the above
 *
 *  In other words: an agent with enskit, the Omnigraph, and ensskills can take
 *  you from zero to an interactive, virtualized, paginated namegraph browser.
 *  Treat this as a reference for what's reachable — not as production-grade,
 *  line-by-line-audited code.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type {
  FileTreeBatchOperation,
  FileTreeRowDecoration,
  FileTreeRowDecorationContext,
  FileTreeSortComparator,
} from "@pierre/trees";
import { FileTree, useFileTree, useFileTreeSelection } from "@pierre/trees/react";
import { graphql, type ResultOf, type VariablesOf } from "enssdk/omnigraph";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";

import { client } from "./ensnode";

const PAGE_SIZE = 50;

// Sentinel path segments. Each is also the row label the file tree renders for
// the corresponding synthetic node, so they read as affordances on their own.
const PLACEHOLDER_SEG = "…"; // makes a not-yet-loaded subregistry expandable
const EMPTY_SEG = "(empty subregistry)";
const ERROR_SEG = "⚠ failed to load";
const LOAD_MORE_SEG = "⏳ loading more…"; // auto-loads the next page when scrolled into view

/**
 * Orders sibling rows by name only, ascending — deliberately NOT folder-first
 * (the library's default). The Registry API paginates Domains by name ascending,
 * so name-only ordering makes each new page append below the rows already loaded;
 * folder-first would instead sort a later page's subregistry-bearing Domains up
 * into the directory group, inserting rows above the viewport and making the tree
 * jump on load. The auto-load sentinel is pinned last so it stays at the bottom.
 */
const sortByName: FileTreeSortComparator = (a, b) => {
  const aSentinel = a.basename === LOAD_MORE_SEG;
  const bSentinel = b.basename === LOAD_MORE_SEG;
  if (aSentinel !== bSentinel) return aSentinel ? 1 : -1;
  return a.basename < b.basename ? -1 : a.basename > b.basename ? 1 : 0;
};

/**
 * One page of a Registry's Domains, traversing the namegraph forward.
 *
 * For each Domain we also fetch the subregistry's reverse canonical pointer: a
 * Registry has no direct "canonical domain" field, but every Domain `Y` it
 * manages exposes `Y.parent` = that Registry's `canonicalDomainId`. So peeking a
 * single child of the subregistry yields the Domain the subregistry declares as
 * its canonical parent — which we compare against the Domain we descended through.
 *
 * `node.parent` (on the Domain itself) yields the *entry* Registry's canonical
 * anchor Domain, used to render addressable names as full ENS names.
 */
const RegistryDomainsQuery = graphql(`
  query NamegraphRegistryDomains($id: RegistryId!, $first: Int!, $after: String) {
    registry(by: { id: $id }) {
      id
      domains(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            __typename
            id
            label {
              interpreted
            }
            canonical {
              name {
                interpreted
              }
            }
            parent {
              canonical {
                name {
                  interpreted
                }
              }
            }
            resolver {
              assigned {
                contract {
                  chainId
                  address
                }
              }
              effective {
                contract {
                  chainId
                  address
                }
              }
            }
            subregistry {
              id
              domains(first: 1) {
                edges {
                  node {
                    parent {
                      id
                      canonical {
                        name {
                          interpreted
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);

const RootRegistryIdQuery = graphql(`
  query NamegraphRootRegistryId {
    root {
      id
    }
  }
`);

/**
 * Forward-resolves the selected Domain's profile + records. `resolve` is
 * accelerated by default; we also request the protocol `trace` (JSON) to derive
 * request timing, and `acceleration { requested attempted }` metadata.
 */
const ResolveQuery = graphql(`
  query NamegraphResolve($id: DomainId!) {
    domain(by: { id: $id }) {
      resolve {
        acceleration {
          requested
          attempted
        }
        profile {
          description
          avatar {
            httpUrl
          }
          addresses {
            ethereum
            base
            solana
            bitcoin
          }
          socials {
            github {
              handle
              httpUrl
            }
            twitter {
              handle
              httpUrl
            }
          }
          website {
            httpUrl
          }
        }
        records {
          addresses(coinTypes: [60]) {
            coinType
            address
          }
          texts(keys: ["avatar", "description", "url", "com.twitter", "com.github"]) {
            key
            value
          }
          contenthash
        }
        trace
      }
    }
  }
`);

type Resolve = NonNullable<ResultOf<typeof ResolveQuery>["domain"]>["resolve"];

/**
 * Total request time, derived from the protocol trace: the longest root span's
 * `duration` (microseconds). Minimal on purpose — no per-step waterfall.
 */
function traceDurationMicros(trace: unknown): number | null {
  if (!Array.isArray(trace) || trace.length === 0) return null;
  const durations = trace
    .map((span) => (span && typeof span.duration === "number" ? span.duration : null))
    .filter((d): d is number => d !== null);
  return durations.length > 0 ? Math.max(...durations) : null;
}

function renderMicros(micros: number): string {
  if (micros < 1_000) return `${micros}µs`;
  if (micros < 1_000_000) return `${(micros / 1_000).toFixed(2)}ms`;
  return `${(micros / 1_000_000).toFixed(4)}s`;
}

type Agreement = "agrees" | "disagrees" | "unknown";

/** A Resolver contract reference (chain + address). */
interface ResolverRef {
  chainId: number;
  address: string;
}

/** Short ENS version label derived from a Domain's `__typename`. */
function versionLabel(typename: string): string {
  switch (typename) {
    case "ENSv1Domain":
      return "ENSv1";
    case "ENSv2Domain":
      return "ENSv2";
    case "UnindexedDomain":
      return "Unindexed";
    default:
      return typename;
  }
}

/** A Domain as returned by one page of {@link RegistryDomainsQuery}. */
interface RawDomain {
  domainId: string;
  /** The Domain's GraphQL `__typename` (ENSv1Domain | ENSv2Domain | UnindexedDomain). */
  typename: string;
  label: string;
  canonicalName: string | null;
  /** Canonical name of the entry Registry's anchor Domain (`node.parent`), if any. */
  parentCanonicalName: string | null;
  hasSubregistry: boolean;
  subregistryId: string | null;
  /** Whether the subregistry's reverse canonical pointer agrees with this Domain. */
  agreement: Agreement | null;
  /** Canonical name the subregistry's pointer points at, when it disagrees. */
  canonicalPointerName: string | null;
  /** The Resolver this Domain has assigned, if any. */
  assignedResolver: ResolverRef | null;
  /** The Resolver ENS Forward Resolution lands on for this Domain, if any. */
  effectiveResolver: ResolverRef | null;
}

interface RegistryPage {
  domains: RawDomain[];
  hasNextPage: boolean;
  endCursor: string | null;
}

async function fetchRegistryPage(registryId: string, after: string | null): Promise<RegistryPage> {
  const result = await client.omnigraph.query({
    query: RegistryDomainsQuery,
    variables: {
      id: registryId as VariablesOf<typeof RegistryDomainsQuery>["id"],
      first: PAGE_SIZE,
      after,
    },
  });

  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message).join("; "));
  }

  if (!result.data?.registry) {
    throw new Error(`Registry not found: ${registryId}`);
  }

  const connection = result.data.registry.domains;

  const domains: RawDomain[] = (connection?.edges ?? []).map((edge) => {
    const node = edge.node;
    const subregistry = node.subregistry;

    let agreement: Agreement | null = null;
    let canonicalPointerName: string | null = null;
    if (subregistry) {
      const pointer = subregistry.domains?.edges?.[0]?.node.parent ?? null;
      if (!pointer) {
        agreement = "unknown";
      } else {
        agreement = pointer.id === node.id ? "agrees" : "disagrees";
        canonicalPointerName = pointer.canonical?.name.interpreted ?? null;
      }
    }

    const resolver = node.resolver;

    return {
      domainId: node.id,
      typename: node.__typename,
      label: node.label.interpreted,
      canonicalName: node.canonical?.name.interpreted ?? null,
      parentCanonicalName: node.parent?.canonical?.name.interpreted ?? null,
      hasSubregistry: subregistry != null,
      subregistryId: subregistry?.id ?? null,
      agreement,
      canonicalPointerName,
      assignedResolver: resolver.assigned
        ? {
            chainId: resolver.assigned.contract.chainId,
            address: resolver.assigned.contract.address,
          }
        : null,
      effectiveResolver: resolver.effective
        ? {
            chainId: resolver.effective.contract.chainId,
            address: resolver.effective.contract.address,
          }
        : null,
    };
  });

  return {
    domains,
    hasNextPage: connection?.pageInfo.hasNextPage ?? false,
    endCursor: connection?.pageInfo.endCursor ?? null,
  };
}

interface DomainNodeMeta {
  kind: "domain";
  path: string;
  domainId: string;
  typename: string;
  label: string;
  /** Name constructed by following the namegraph forward to this Domain. */
  addressableName: string;
  canonicalName: string | null;
  /** Addressable name disagrees with the canonical name (an alias / non-canonical). */
  isAlias: boolean;
  hasSubregistry: boolean;
  subregistryId: string | null;
  agreement: Agreement | null;
  canonicalPointerName: string | null;
  assignedResolver: ResolverRef | null;
  effectiveResolver: ResolverRef | null;
}

interface LoadMoreMeta {
  kind: "loadMore";
  path: string;
  parentPath: string;
  registryId: string;
  after: string;
}

interface SentinelMeta {
  kind: "placeholder" | "empty" | "error";
  path: string;
}

type NodeMeta = DomainNodeMeta | LoadMoreMeta | SentinelMeta;

export function NamegraphView({ registryId }: { registryId: string }) {
  // Per-path metadata backing the file tree's (path-only) nodes. A ref so the
  // model's render-time decoration callback always reads the latest map.
  const metaRef = useRef<Map<string, NodeMeta>>(new Map());
  // Entry Registry's canonical anchor name ("" when it is the namespace root),
  // used to render top-level addressable names as full ENS names.
  const anchorRef = useRef<string>("");
  // Expandable Domains whose subregistry has not been loaded yet.
  const pendingDirsRef = useRef<Set<string>>(new Set());
  const loadedDirsRef = useRef<Set<string>>(new Set());
  // Sentinel paths whose next page is currently being fetched, so the auto-load
  // observer doesn't re-fire for an in-flight "load more" row.
  const loadingMoreRef = useRef<Set<string>>(new Set());
  // Latest auto-load trigger. `renderRowDecoration` is captured once at model
  // construction, so it calls through this ref to reach the current closure.
  const triggerLoadMoreRef = useRef<(meta: LoadMoreMeta) => void>(() => {});

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // A Domain with a subregistry is a directory, which the library canonicalizes
  // to a trailing-slash path; normalize lookups so a row/selection path resolves
  // regardless of which form (with or without slash) the library reports.
  const getMeta = useCallback((path: string): NodeMeta | null => {
    return (
      metaRef.current.get(path) ??
      metaRef.current.get(path.endsWith("/") ? path.slice(0, -1) : `${path}/`) ??
      null
    );
  }, []);

  const renderRowDecoration = useCallback(
    (context: FileTreeRowDecorationContext): FileTreeRowDecoration | null => {
      const meta = getMeta(context.item.path);
      if (!meta) return null;

      // The library calls this for every row in the virtualized window, so a
      // "load more" sentinel reaching here means it scrolled into view: kick off
      // the next page. Deferred to a microtask so we never mutate the tree mid-render.
      if (meta.kind === "loadMore") {
        // Skip scheduling while this page is already in flight — the sentinel
        // stays in the virtualized window and re-renders, but triggerLoadMore
        // would just dedupe it anyway.
        if (!loadingMoreRef.current.has(meta.path)) {
          queueMicrotask(() => triggerLoadMoreRef.current(meta));
        }
        return null;
      }
      if (meta.kind !== "domain") return null;

      const glyphs: string[] = [];
      if (meta.isAlias) glyphs.push("⚠");
      if (meta.hasSubregistry) {
        glyphs.push(
          meta.agreement === "agrees" ? "↩✓" : meta.agreement === "disagrees" ? "↩✗" : "↩?",
        );
      }
      if (glyphs.length === 0) return null;

      const titleLines = [
        `addressable: ${meta.addressableName}`,
        `canonical: ${meta.canonicalName ?? "(not in canonical nametree)"}`,
      ];
      if (meta.isAlias) titleLines.push("ALIAS — addressable name ≠ canonical name");
      if (meta.hasSubregistry) {
        titleLines.push(
          meta.agreement === "agrees"
            ? "subregistry pointer agrees with this location"
            : meta.agreement === "disagrees"
              ? `subregistry pointer disagrees (points to ${meta.canonicalPointerName ?? "another domain"})`
              : "subregistry pointer unknown (empty subregistry)",
        );
      }

      return { text: glyphs.join(" "), title: titleLines.join("\n") };
    },
    [getMeta],
  );

  const { model } = useFileTree({
    paths: [],
    initialExpansion: "closed",
    // Mirror the Registry API's name-ascending pagination so new pages append
    // below; see {@link sortByName}.
    sort: sortByName,
    // Keep every Domain as its own directory row; do not compact single-child
    // chains (the file tree's "compact folders" behavior) into one combined line.
    flattenEmptyDirectories: false,
    renderRowDecoration,
  });

  // Builds a unique, slash-safe path for a node under `parentDir` ("" for the
  // top level, otherwise a directory path ending in "/"). Directories canonicalize
  // with a trailing slash; we guard against collisions in both forms so a leaf
  // Domain and a subregistry-bearing Domain with the same label cannot clash.
  const makeNodePath = useCallback(
    (parentDir: string, label: string, isDirectory: boolean): string => {
      const safe = label.replaceAll("/", "∕") || "∅";
      let seg = safe;
      let i = 1;
      while (
        metaRef.current.has(`${parentDir}${seg}`) ||
        metaRef.current.has(`${parentDir}${seg}/`)
      ) {
        seg = `${safe}~${i++}`;
      }
      return isDirectory ? `${parentDir}${seg}/` : `${parentDir}${seg}`;
    },
    [],
  );

  const addressableFor = useCallback((label: string, parentDir: string): string => {
    if (parentDir === "") {
      return anchorRef.current ? `${label}.${anchorRef.current}` : label;
    }
    const parentMeta = metaRef.current.get(parentDir);
    return parentMeta && parentMeta.kind === "domain"
      ? `${label}.${parentMeta.addressableName}`
      : label;
  }, []);

  const addDomain = useCallback(
    (ops: FileTreeBatchOperation[], parentDir: string, raw: RawDomain) => {
      const isDirectory = raw.hasSubregistry;
      const path = makeNodePath(parentDir, raw.label, isDirectory);
      const addressableName = addressableFor(raw.label, parentDir);
      const isAlias = raw.canonicalName === null ? true : raw.canonicalName !== addressableName;

      metaRef.current.set(path, {
        kind: "domain",
        path,
        domainId: raw.domainId,
        typename: raw.typename,
        label: raw.label,
        addressableName,
        canonicalName: raw.canonicalName,
        isAlias,
        hasSubregistry: raw.hasSubregistry,
        subregistryId: raw.subregistryId,
        agreement: raw.agreement,
        canonicalPointerName: raw.canonicalPointerName,
        assignedResolver: raw.assignedResolver,
        effectiveResolver: raw.effectiveResolver,
      });

      if (isDirectory) {
        // A subregistry-bearing Domain is a directory: materialize it via a
        // placeholder child (which also reads as a loading hint) rather than
        // adding the bare path, which the library would register as a file.
        const placeholderPath = `${path}${PLACEHOLDER_SEG}`;
        metaRef.current.set(placeholderPath, { kind: "placeholder", path: placeholderPath });
        ops.push({ type: "add", path: placeholderPath });
        pendingDirsRef.current.add(path);
      } else {
        ops.push({ type: "add", path });
      }
    },
    [makeNodePath, addressableFor],
  );

  const addLoadMore = useCallback(
    (ops: FileTreeBatchOperation[], parentDir: string, pageRegistryId: string, after: string) => {
      const path = `${parentDir}${LOAD_MORE_SEG}`;
      metaRef.current.set(path, {
        kind: "loadMore",
        path,
        parentPath: parentDir,
        registryId: pageRegistryId,
        after,
      });
      ops.push({ type: "add", path });
    },
    [],
  );

  const loadChildren = useCallback(
    async (dirPath: string) => {
      if (loadedDirsRef.current.has(dirPath)) return;

      const meta = metaRef.current.get(dirPath);
      if (!meta || meta.kind !== "domain" || !meta.subregistryId) return;

      const ops: FileTreeBatchOperation[] = [];
      const placeholderPath = `${dirPath}${PLACEHOLDER_SEG}`;
      const errorPath = `${dirPath}${ERROR_SEG}`;
      const dropSentinel = (path: string) => {
        if (metaRef.current.delete(path)) {
          ops.push({ type: "remove", path, recursive: true });
        }
      };

      try {
        const page = await fetchRegistryPage(meta.subregistryId, null);
        // Mark loaded only on success so a failed fetch stays retryable.
        loadedDirsRef.current.add(dirPath);
        dropSentinel(placeholderPath);
        dropSentinel(errorPath); // clear a sentinel left by a prior failed attempt
        if (page.domains.length === 0) {
          const emptyPath = `${dirPath}${EMPTY_SEG}`;
          metaRef.current.set(emptyPath, { kind: "empty", path: emptyPath });
          ops.push({ type: "add", path: emptyPath });
        } else {
          for (const domain of page.domains) addDomain(ops, dirPath, domain);
          if (page.hasNextPage && page.endCursor) {
            addLoadMore(ops, dirPath, meta.subregistryId, page.endCursor);
          }
        }
        model.batch(ops);
        return;
      } catch {
        dropSentinel(placeholderPath);
        if (!metaRef.current.has(errorPath)) {
          metaRef.current.set(errorPath, { kind: "error", path: errorPath });
          ops.push({ type: "add", path: errorPath });
        }
        model.batch(ops);
        // Re-enable retry: collapse the directory before re-queueing it, so the
        // subscription doesn't re-fire while it's still expanded (which would
        // loop on a persistent failure). The next manual expand tries again.
        const item = model.getItem(dirPath);
        if (item && "collapse" in item) item.collapse();
        pendingDirsRef.current.add(dirPath);
      }
    },
    [model, addDomain, addLoadMore],
  );

  const loadMore = useCallback(
    async (meta: LoadMoreMeta) => {
      const ops: FileTreeBatchOperation[] = [];
      if (metaRef.current.delete(meta.path)) {
        ops.push({ type: "remove", path: meta.path, recursive: true });
      }
      try {
        const page = await fetchRegistryPage(meta.registryId, meta.after);
        for (const domain of page.domains) addDomain(ops, meta.parentPath, domain);
        if (page.hasNextPage && page.endCursor) {
          addLoadMore(ops, meta.parentPath, meta.registryId, page.endCursor);
        }
      } catch {
        const errorPath = `${meta.parentPath}${ERROR_SEG}`;
        metaRef.current.set(errorPath, { kind: "error", path: errorPath });
        ops.push({ type: "add", path: errorPath });
      }
      model.batch(ops);
    },
    [model, addDomain, addLoadMore],
  );

  // Auto-load wrapper: dedupes concurrent triggers for the same sentinel while
  // its page is in flight. Re-fires once a fresh sentinel (next cursor) appears.
  const triggerLoadMore = useCallback(
    (meta: LoadMoreMeta) => {
      if (loadingMoreRef.current.has(meta.path)) return;
      loadingMoreRef.current.add(meta.path);
      void loadMore(meta).finally(() => loadingMoreRef.current.delete(meta.path));
    },
    [loadMore],
  );
  triggerLoadMoreRef.current = triggerLoadMore;

  // Load the entry Registry's first page of Domains.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    (async () => {
      try {
        const page = await fetchRegistryPage(registryId, null);
        if (cancelled) return;
        anchorRef.current = page.domains[0]?.parentCanonicalName ?? "";

        const ops: FileTreeBatchOperation[] = [];
        if (page.domains.length === 0) {
          metaRef.current.set(EMPTY_SEG, { kind: "empty", path: EMPTY_SEG });
          ops.push({ type: "add", path: EMPTY_SEG });
        } else {
          for (const domain of page.domains) addDomain(ops, "", domain);
          if (page.hasNextPage && page.endCursor) {
            addLoadMore(ops, "", registryId, page.endCursor);
          }
        }
        model.batch(ops);
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(String((error as Error).message));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [model, registryId, addDomain, addLoadMore]);

  // Lazily load a subregistry the first time its Domain is expanded. The library
  // has no expand event, so we detect expansion from any model change.
  useEffect(() => {
    return model.subscribe(() => {
      if (pendingDirsRef.current.size === 0) return;
      for (const dirPath of Array.from(pendingDirsRef.current)) {
        const item = model.getItem(dirPath);
        if (item && "isExpanded" in item && item.isExpanded()) {
          pendingDirsRef.current.delete(dirPath);
          void loadChildren(dirPath);
        }
      }
    });
  }, [model, loadChildren]);

  const selectedPaths = useFileTreeSelection(model);
  const selectedPath = selectedPaths[0] ?? null;
  const selectedMeta = selectedPath ? getMeta(selectedPath) : null;

  // Size the tree/panels row to reach exactly the bottom of the viewport so the
  // page itself never scrolls, regardless of the header height above it.
  const rowRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState("60vh");
  useLayoutEffect(() => {
    const update = () => {
      const top = rowRef.current?.getBoundingClientRect().top ?? 0;
      setRowHeight(`calc(100dvh - ${Math.round(top)}px - 8px)`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [status]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Namegraph Explorer</h2>
      <p style={{ marginTop: 0 }}>
        Traverses the namegraph forward from a Registry. Each row is a Domain; rows with a folder
        icon declare a subregistry and can be expanded recursively. Select a row for details.
      </p>
      <p style={{ fontSize: "0.85em", color: "#555" }}>
        <strong>⚠</strong> addressable name ≠ canonical name (alias / non-canonical) ·{" "}
        <strong>↩✓</strong> subregistry pointer agrees with this location · <strong>↩✗</strong>{" "}
        disagrees · <strong>↩?</strong> unknown
      </p>

      {status === "error" && <p style={{ color: "red" }}>Error: {errorMessage}</p>}
      {status === "loading" && <p>Loading namegraph…</p>}

      <div
        ref={rowRef}
        style={{
          display: "flex",
          gap: 16,
          alignItems: "stretch",
          height: rowHeight,
          minHeight: 320,
        }}
      >
        <div
          style={{
            flex: "1 1 55%",
            minHeight: 0,
            border: "1px solid #ccc",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <FileTree model={model} style={{ height: "100%" }} />
        </div>
        {/* Stretches to the row (tree) height; scrolls only when its panels exceed it. */}
        <div style={{ flex: "1 1 45%", minHeight: 0, overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <DetailPanel meta={selectedMeta} />
            <ResolutionPanels
              domainId={selectedMeta?.kind === "domain" ? selectedMeta.domainId : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Shared style for every stacked panel in the right column. */
const panelStyle: React.CSSProperties = {
  padding: 12,
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: "0.9em",
};

function formatResolver(resolver: ResolverRef | null) {
  if (!resolver) return <em>none</em>;
  return (
    <code>
      {resolver.chainId}:{resolver.address}
    </code>
  );
}

function DetailPanel({ meta }: { meta: NodeMeta | null }) {
  if (!meta) {
    return (
      <div style={panelStyle}>
        <em>
          Select a domain to see its addressable name, canonical name, and subregistry status.
        </em>
      </div>
    );
  }

  if (meta.kind !== "domain") {
    const label =
      meta.kind === "loadMore"
        ? "Loading the next page…" // auto-loads when scrolled into view
        : meta.kind === "placeholder"
          ? "Loading subregistry…"
          : meta.kind === "empty"
            ? "This subregistry contains no domains."
            : "Failed to load this subregistry.";
    return (
      <div style={panelStyle}>
        <em>{label}</em>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>{meta.label}</h3>
        <span style={{ fontSize: "0.85em", color: "#555" }}>{versionLabel(meta.typename)}</span>
      </div>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "4px 12px",
          margin: "8px 0 0",
        }}
      >
        <dt>
          <strong>Addressable</strong>
        </dt>
        <dd style={{ margin: 0 }}>
          <code>{meta.addressableName}</code>
        </dd>

        <dt>
          <strong>Canonical</strong>
        </dt>
        <dd style={{ margin: 0 }}>
          {meta.canonicalName ? (
            <code>{meta.canonicalName}</code>
          ) : (
            <em>(not in canonical nametree)</em>
          )}{" "}
          {meta.isAlias && <span style={{ color: "#b26a00", fontWeight: 600 }}>⚠ ALIAS</span>}
        </dd>

        <dt>
          <strong>Domain ID</strong>
        </dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>
          <code>{meta.domainId}</code>
        </dd>

        <dt>
          <strong>Resolver (assigned)</strong>
        </dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>
          {formatResolver(meta.assignedResolver)}
        </dd>

        <dt>
          <strong>Resolver (effective)</strong>
        </dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}>
          {formatResolver(meta.effectiveResolver)}
        </dd>

        <dt>
          <strong>Subregistry</strong>
        </dt>
        <dd style={{ margin: 0 }}>
          {meta.hasSubregistry ? <SubregistryDetail meta={meta} /> : <em>none</em>}
        </dd>
      </dl>
    </div>
  );
}

function agreementDisplay(meta: DomainNodeMeta): { color: string; text: string } {
  if (meta.agreement === "agrees") {
    return { color: "green", text: "↩✓ pointer agrees with this location" };
  }
  if (meta.agreement === "disagrees") {
    const target = meta.canonicalPointerName ? ` (points to ${meta.canonicalPointerName})` : "";
    return { color: "red", text: `↩✗ pointer disagrees${target}` };
  }
  return { color: "#888", text: "↩? pointer unknown (empty subregistry)" };
}

function SubregistryDetail({ meta }: { meta: DomainNodeMeta }) {
  const agreement = agreementDisplay(meta);
  return (
    <>
      <div style={{ wordBreak: "break-all" }}>
        <code>{meta.subregistryId}</code>
      </div>
      <div style={{ color: agreement.color }}>{agreement.text}</div>
      {meta.subregistryId && (
        <div style={{ marginTop: 4 }}>
          <Link to={`/namegraph/${meta.subregistryId}`}>Open subregistry as root →</Link>
        </div>
      )}
    </>
  );
}

type Profile = NonNullable<Resolve["profile"]>;
type Records = NonNullable<Resolve["records"]>;

/** Consistent two-column key/value layout used across the resolution panels. */
function KeyValueGrid({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gap: "3px 12px",
        margin: 0,
      }}
    >
      {rows.map(([label, value], index) => (
        <Fragment key={index}>
          <dt style={{ color: "#777" }}>{label}</dt>
          <dd style={{ margin: 0, wordBreak: "break-word" }}>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

function ExternalLink({
  url,
  children,
}: {
  url: string | null | undefined;
  children: React.ReactNode;
}) {
  if (!url) return <>{children}</>;
  // ENS record URLs are untrusted; only render http(s) as links so javascript:
  // and other schemes can't reach the href.
  if (!/^https?:\/\//i.test(url)) return <>{children}</>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const prettyUrl = (url: string) => url.replace(/^https?:\/\//i, "");

/** The "Resolution" panel in its idle / loading / error states. */
function ResolutionStatus({ children, error }: { children: React.ReactNode; error?: boolean }) {
  return (
    <div style={panelStyle}>
      <h3 style={{ margin: 0 }}>Resolution</h3>
      <p style={{ margin: "6px 0 0", color: error ? "red" : undefined }}>
        {error ? children : <em>{children}</em>}
      </p>
    </div>
  );
}

/**
 * Forward-resolves the selected Domain and renders the result as separate panels:
 * a resolution summary (timing + acceleration), the profile, and the records.
 */
function ResolutionPanels({ domainId }: { domainId: string | null }) {
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "ready"; resolve: Resolve | null }
  >({ status: "idle" });

  useEffect(() => {
    if (!domainId) {
      setState({ status: "idle" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    (async () => {
      try {
        const result = await client.omnigraph.query({
          query: ResolveQuery,
          variables: { id: domainId as VariablesOf<typeof ResolveQuery>["id"] },
        });
        if (cancelled) return;
        if (result.errors?.length) {
          throw new Error(result.errors.map((e) => e.message).join("; "));
        }
        setState({ status: "ready", resolve: result.data?.domain?.resolve ?? null });
      } catch (error) {
        if (!cancelled) setState({ status: "error", error: String((error as Error).message) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [domainId]);

  if (state.status === "idle") {
    return (
      <ResolutionStatus>
        Select a domain to forward-resolve its profile and records.
      </ResolutionStatus>
    );
  }
  if (state.status === "loading") {
    return <ResolutionStatus>Resolving…</ResolutionStatus>;
  }
  if (state.status === "error") {
    return <ResolutionStatus error>Error: {state.error}</ResolutionStatus>;
  }

  const { resolve } = state;
  const profile = resolve?.profile ?? null;
  const records = resolve?.records ?? null;
  const acceleration = resolve?.acceleration ?? null;
  const durationMicros = traceDurationMicros(resolve?.trace);

  return (
    <>
      <div style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ margin: 0 }}>Resolution</h3>
          {durationMicros !== null && (
            <span style={{ fontSize: "0.85em", color: "#555" }}>
              ⏱ {renderMicros(durationMicros)}
            </span>
          )}
        </div>

        {acceleration && (
          <div style={{ marginTop: 4, fontSize: "0.8em", color: "#888" }}>
            acceleration · requested {acceleration.requested ? "✓" : "✗"} · attempted{" "}
            {acceleration.attempted ? <span style={{ color: "green" }}>✓</span> : "✗"}
          </div>
        )}

        {!profile && !records && (
          <p style={{ margin: "6px 0 0" }}>
            <em>Not resolvable (non-canonical or unnormalized name).</em>
          </p>
        )}
      </div>

      {profile && <ProfilePanel profile={profile} />}
      {records && <RecordsPanel records={records} />}
    </>
  );
}

function ProfilePanel({ profile }: { profile: Profile }) {
  const addresses = profile.addresses;
  const rows: Array<[string, React.ReactNode]> = [];

  if (profile.website?.httpUrl) {
    rows.push([
      "Website",
      <ExternalLink url={profile.website.httpUrl}>
        {prettyUrl(profile.website.httpUrl)}
      </ExternalLink>,
    ]);
  }
  const github = profile.socials?.github ?? null;
  if (github) {
    rows.push(["GitHub", <ExternalLink url={github.httpUrl}>{github.handle}</ExternalLink>]);
  }
  const twitter = profile.socials?.twitter ?? null;
  if (twitter) {
    rows.push(["X", <ExternalLink url={twitter.httpUrl}>{twitter.handle}</ExternalLink>]);
  }
  for (const [label, value] of [
    ["ETH", addresses?.ethereum],
    ["Base", addresses?.base],
    ["Solana", addresses?.solana],
    ["Bitcoin", addresses?.bitcoin],
  ] as Array<[string, string | null | undefined]>) {
    if (value) rows.push([label, <code>{value}</code>]);
  }

  const hasHeader = Boolean(profile.avatar?.httpUrl || profile.description);

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: 0 }}>Profile</h3>
      {hasHeader && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "8px 0" }}>
          {profile.avatar?.httpUrl && (
            <img
              src={profile.avatar.httpUrl}
              alt=""
              width={44}
              height={44}
              style={{ borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
            />
          )}
          {profile.description && <div>{profile.description}</div>}
        </div>
      )}
      {rows.length > 0 ? (
        <div style={{ marginTop: hasHeader ? 0 : 8 }}>
          <KeyValueGrid rows={rows} />
        </div>
      ) : (
        !hasHeader && (
          <p style={{ margin: "6px 0 0" }}>
            <em>No profile records.</em>
          </p>
        )
      )}
    </div>
  );
}

function RecordsPanel({ records }: { records: Records }) {
  const texts = records.texts ?? [];
  const addresses = records.addresses ?? [];
  const contenthash = records.contenthash ?? null;
  if (texts.length === 0 && addresses.length === 0 && !contenthash) return null;

  const rows: Array<[string, React.ReactNode]> = [];
  for (const record of addresses) {
    rows.push([`coinType ${record.coinType}`, <code>{record.address}</code>]);
  }
  for (const record of texts) {
    rows.push([record.key, record.value]);
  }
  if (contenthash) {
    rows.push(["contenthash", <code>{contenthash}</code>]);
  }

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 8px" }}>Records</h3>
      <KeyValueGrid rows={rows} />
    </div>
  );
}

/** Resolves the namespace Root Registry id and redirects to it. */
export function NamegraphRootRedirect() {
  const [rootId, setRootId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await client.omnigraph.query({ query: RootRegistryIdQuery });
        if (cancelled) return;
        if (result.errors?.length) {
          throw new Error(result.errors.map((e) => e.message).join("; "));
        }
        setRootId(result.data?.root.id ?? null);
      } catch (error) {
        if (!cancelled) setErrorMessage(String((error as Error).message));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (errorMessage)
    return <p style={{ color: "red" }}>Error loading root registry: {errorMessage}</p>;
  if (!rootId) return <p>Loading root registry…</p>;
  return <Navigate to={`/namegraph/${rootId}`} replace />;
}
