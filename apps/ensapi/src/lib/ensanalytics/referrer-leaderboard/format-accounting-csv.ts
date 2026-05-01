import type { ReferralAccountingRecordRevShareCap } from "@namehash/ens-referrals";
import { stringifyAccountId } from "enssdk";

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
  { header: "timestamp", value: (r) => new Date(r.timestamp * 1000).toISOString() },
  { header: "name", value: (r) => r.name },
  { header: "action", value: (r) => r.actionType },
  { header: "transactionHash", value: (r) => r.transactionHash },
  { header: "incrementalDuration", value: (r) => r.incrementalDuration.toString() },
  { header: "registrant", value: (r) => r.registrant },
  { header: "referrer", value: (r) => stringifyAccountId(r.referrer) },
  {
    header: "incrementalRevenueContributionWei",
    value: (r) => r.tentativeAward.incrementalRevenueContribution.amount.toString(),
  },
  {
    header: "accumulatedRevenueContributionWei",
    value: (r) => r.tentativeAward.accumulatedRevenueContribution.amount.toString(),
  },
  {
    header: "incrementalBaseRevenueContributionUsdc",
    value: (r) => r.tentativeAward.incrementalBaseRevenueContribution.amount.toString(),
  },
  {
    header: "accumulatedBaseRevenueContributionUsdc",
    value: (r) => r.tentativeAward.accumulatedBaseRevenueContribution.amount.toString(),
  },
  {
    header: "awardPoolRemainingUsdc",
    value: (r) => r.tentativeAward.awardPoolRemaining.amount.toString(),
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
