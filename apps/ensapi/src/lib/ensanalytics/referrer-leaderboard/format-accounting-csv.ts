import {
  type ReferralAccountingRecordRevShareCap,
  SECONDS_PER_YEAR,
} from "@namehash/ens-referrals";
import { stringifyAccountId } from "enssdk";
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
 * Format a {@link Price} as a bare decimal string (no unit suffix). The unit is encoded
 * in the column header. Uses viem's `formatUnits` for precision-safe bigint → decimal
 * conversion (no float intermediate), and trims trailing zeros after the decimal.
 *
 * e.g. `{ currency: "ETH", amount: 3125000000003490n }` → `"0.00312500000000349"`.
 */
function formatPriceDecimal(price: Price): string {
  const info = getCurrencyInfo(price.currency);
  return formatUnits(price.amount, info.decimals);
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
 * Format a duration in seconds as years using the codebase's calendar-accurate
 * `SECONDS_PER_YEAR` constant (365.2425 days), trimming trailing zeros.
 */
function formatDurationYears(seconds: number): string {
  return Number.parseFloat((seconds / SECONDS_PER_YEAR).toFixed(6)).toString();
}

/**
 * Column definitions for `GET /v1/ensanalytics/accounting?edition={slug}`.
 *
 * Each column owns both its header text and the cell renderer. Single source of truth for
 * column order — adding/removing/reordering happens in one place.
 *
 * Headers are title-cased with the unit in parentheses. Currency-amount columns come in
 * pairs: a raw machine-precision column (smallest unit — Wei or micro-USDC) followed by a
 * human-readable decimal column (ETH or USDC).
 */
const CSV_COLUMNS: ReadonlyArray<{
  header: string;
  value: (r: ReferralAccountingRecordRevShareCap) => string;
}> = [
  { header: "Referral ID", value: (r) => r.registrarActionId },
  // UTC datetime in `YYYY-MM-DD HH:MM:SS` form — parseable by Google Sheets, Excel,
  // Python datetime, pandas, Postgres, etc. without losing the universal interchangeability
  // of ISO 8601 (which Sheets treats as text by default).
  { header: "Timestamp (UTC)", value: (r) => formatTimestampReadable(r.timestamp) },
  { header: "Name", value: (r) => r.name },
  { header: "Action", value: (r) => r.actionType },
  { header: "Transaction Hash", value: (r) => r.transactionHash },
  { header: "Incremental Duration (seconds)", value: (r) => r.incrementalDuration.toString() },
  {
    header: "Incremental Duration (years)",
    value: (r) => formatDurationYears(r.incrementalDuration),
  },
  { header: "Registrant", value: (r) => r.registrant },
  { header: "Referrer", value: (r) => stringifyAccountId(r.referrer) },
  {
    header: "Incremental Revenue Contribution (Wei)",
    value: (r) => r.tentativeAward.incrementalRevenueContribution.amount.toString(),
  },
  {
    header: "Incremental Revenue Contribution (ETH)",
    value: (r) => formatPriceDecimal(r.tentativeAward.incrementalRevenueContribution),
  },
  {
    header: "Accumulated Revenue Contribution (Wei)",
    value: (r) => r.tentativeAward.accumulatedRevenueContribution.amount.toString(),
  },
  {
    header: "Accumulated Revenue Contribution (ETH)",
    value: (r) => formatPriceDecimal(r.tentativeAward.accumulatedRevenueContribution),
  },
  {
    header: "Incremental Base Revenue Contribution (micro-USDC)",
    value: (r) => r.tentativeAward.incrementalBaseRevenueContribution.amount.toString(),
  },
  {
    header: "Incremental Base Revenue Contribution (USDC)",
    value: (r) => formatPriceDecimal(r.tentativeAward.incrementalBaseRevenueContribution),
  },
  {
    header: "Accumulated Base Revenue Contribution (micro-USDC)",
    value: (r) => r.tentativeAward.accumulatedBaseRevenueContribution.amount.toString(),
  },
  {
    header: "Accumulated Base Revenue Contribution (USDC)",
    value: (r) => formatPriceDecimal(r.tentativeAward.accumulatedBaseRevenueContribution),
  },
  {
    header: "Award Pool Remaining (micro-USDC)",
    value: (r) => r.tentativeAward.awardPoolRemaining.amount.toString(),
  },
  {
    header: "Award Pool Remaining (USDC)",
    value: (r) => formatPriceDecimal(r.tentativeAward.awardPoolRemaining),
  },
  { header: "Disqualified", value: (r) => (r.tentativeAward.disqualified ? "true" : "false") },
  {
    header: "Disqualification Reason",
    value: (r) => r.tentativeAward.disqualificationReason ?? "",
  },
  { header: "Max Revenue Share", value: (r) => r.tentativeAward.maxRevShare.toString() },
  {
    header: "Effective Base Revenue Share",
    value: (r) => r.tentativeAward.effectiveBaseRevShare.toString(),
  },
  {
    header: "Incremental Tentative Award (micro-USDC)",
    value: (r) => r.tentativeAward.incrementalTentativeAward.amount.toString(),
  },
  {
    header: "Incremental Tentative Award (USDC)",
    value: (r) => formatPriceDecimal(r.tentativeAward.incrementalTentativeAward),
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
