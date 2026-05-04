import type { ReferralAccountingRecordRevShareCap } from "@namehash/ens-referrals";
import { formatUnits } from "viem";

import { getCurrencyInfo, type Price } from "@ensnode/ensnode-sdk";

/**
 * Escape a CSV cell per RFC 4180: wrap in quotes when the value contains a comma, quote,
 * or newline; double up internal quotes.
 */
function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a {@link Price} as a human-readable string with the currency unit appended,
 * e.g. `{ currency: "ETH", amount: 3125000000003490n }` → `"0.00312500000000349 ETH"`.
 *
 * Uses viem's `formatUnits` for precision-safe bigint → decimal conversion (no float
 * intermediate). Currency decimals come from {@link getCurrencyInfo}.
 */
function formatPriceReadable(price: Price): string {
  const info = getCurrencyInfo(price.currency);
  return `${formatUnits(price.amount, info.decimals)} ${info.id}`;
}

/**
 * Format a Unix timestamp as a Google-Sheets-friendly UTC datetime: `YYYY-MM-DD HH:MM:SS`.
 * Sheets parses ISO 8601 with `T`/`Z` as text by default; the space-separated form is
 * recognized as a date value.
 */
function formatTimestampReadable(unixSeconds: number): string {
  return new Date(unixSeconds * 1000)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");
}

/**
 * Format a duration in seconds as days, dropping trailing zeros (e.g., `"365"`, `"28.5"`).
 */
function formatDurationDays(seconds: number): string {
  return Number.parseFloat((seconds / 86400).toFixed(4)).toString();
}

/**
 * Column definitions for `GET /v1/ensanalytics/accounting?edition={slug}`.
 *
 * Each column owns both its header text and the cell renderer. Single source of truth for
 * column order — adding/removing/reordering happens in one place.
 */
const CSV_COLUMNS: ReadonlyArray<{
  header: string;
  value: (r: ReferralAccountingRecordRevShareCap) => string;
}> = [
  { header: "referralId", value: (r) => r.registrarActionId },
  // UTC datetime in `YYYY-MM-DD HH:MM:SS` form — parseable by Google Sheets, Excel,
  // Python datetime, pandas, Postgres, etc. without losing the universal interchangeability
  // of ISO 8601 (which Sheets treats as text by default).
  { header: "timestamp", value: (r) => formatTimestampReadable(r.timestamp) },
  { header: "name", value: (r) => r.name },
  { header: "action", value: (r) => r.actionType },
  { header: "transactionHash", value: (r) => r.transactionHash },
  { header: "incrementalDuration", value: (r) => r.incrementalDuration.toString() },
  { header: "incrementalDurationDays", value: (r) => formatDurationDays(r.incrementalDuration) },
  { header: "registrant", value: (r) => r.registrant },
  { header: "referrer", value: (r) => r.referrer },
  {
    header: "incrementalRevenueContributionWei",
    value: (r) => r.tentativeAward.incrementalRevenueContribution.amount.toString(),
  },
  {
    header: "incrementalRevenueContribution",
    value: (r) => formatPriceReadable(r.tentativeAward.incrementalRevenueContribution),
  },
  {
    header: "accumulatedRevenueContributionWei",
    value: (r) => r.tentativeAward.accumulatedRevenueContribution.amount.toString(),
  },
  {
    header: "accumulatedRevenueContribution",
    value: (r) => formatPriceReadable(r.tentativeAward.accumulatedRevenueContribution),
  },
  {
    header: "incrementalBaseRevenueContributionUsdc",
    value: (r) => r.tentativeAward.incrementalBaseRevenueContribution.amount.toString(),
  },
  {
    header: "incrementalBaseRevenueContribution",
    value: (r) => formatPriceReadable(r.tentativeAward.incrementalBaseRevenueContribution),
  },
  {
    header: "accumulatedBaseRevenueContributionUsdc",
    value: (r) => r.tentativeAward.accumulatedBaseRevenueContribution.amount.toString(),
  },
  {
    header: "accumulatedBaseRevenueContribution",
    value: (r) => formatPriceReadable(r.tentativeAward.accumulatedBaseRevenueContribution),
  },
  {
    header: "awardPoolRemainingUsdc",
    value: (r) => r.tentativeAward.awardPoolRemaining.amount.toString(),
  },
  {
    header: "awardPoolRemaining",
    value: (r) => formatPriceReadable(r.tentativeAward.awardPoolRemaining),
  },
  { header: "disqualified", value: (r) => (r.tentativeAward.disqualified ? "true" : "false") },
  {
    header: "disqualificationReason",
    value: (r) => r.tentativeAward.disqualificationReason ?? "",
  },
  { header: "maxRevShare", value: (r) => r.tentativeAward.maxRevShare.toString() },
  {
    header: "effectiveBaseRevShare",
    value: (r) => r.tentativeAward.effectiveBaseRevShare.toString(),
  },
  {
    header: "incrementalTentativeAwardUsdc",
    value: (r) => r.tentativeAward.incrementalTentativeAward.amount.toString(),
  },
  {
    header: "incrementalTentativeAward",
    value: (r) => formatPriceReadable(r.tentativeAward.incrementalTentativeAward),
  },
];

/**
 * Formats per-event accounting records as RFC-4180 CSV (CRLF line endings, header row first).
 */
export function formatAccountingCsv(
  records: ReadonlyArray<ReferralAccountingRecordRevShareCap>,
): string {
  const lines = [
    CSV_COLUMNS.map((c) => csvCell(c.header)).join(","),
    ...records.map((r) => CSV_COLUMNS.map((c) => csvCell(c.value(r))).join(",")),
  ];
  return `${lines.join("\r\n")}\r\n`;
}
