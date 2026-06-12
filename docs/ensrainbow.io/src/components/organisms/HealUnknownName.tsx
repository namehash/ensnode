import { legacyButtonVariants } from "@namehash/namehash-ui/legacy";
import { useMemo, useState } from "react";

import {
  EnsRainbowBeamClient,
  EnsRainbowBeamHttpError,
  validateDiscoverParams,
} from "@ensnode/ensrainbow-sdk/ensrainbowbeam-client";

type StatusBadgeProps = {
  status: "unknown_in_index" | "healed_in_index" | "absent_from_index" | "skipped_unnormalized";
};

function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } =
    status === "unknown_in_index"
      ? { label: "Unknown", className: "bg-amber-100 text-amber-900" }
      : status === "healed_in_index"
        ? { label: "Healed", className: "bg-emerald-100 text-emerald-900" }
        : status === "absent_from_index"
          ? { label: "Absent", className: "bg-gray-100 text-gray-900" }
          : { label: "Skipped (unnormalized)", className: "bg-slate-100 text-slate-900" };

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

const DEFAULT_BEAM_URL = "https://beam.ensrainbow.io";

function parseTextareaLabels(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default function HealUnknownName() {
  const [rawLabels, setRawLabels] = useState("");
  const [callerAddress, setCallerAddress] = useState("");
  const [beamUrl, setBeamUrl] = useState(DEFAULT_BEAM_URL);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<
    Array<{
      rawLabel: string;
      normalizedLabel?: string;
      status: "unknown_in_index" | "healed_in_index" | "absent_from_index" | "skipped_unnormalized";
    }>
  >([]);

  const labels = useMemo(() => parseTextareaLabels(rawLabels), [rawLabels]);

  const canSubmit = !isSubmitting && labels.length > 0 && callerAddress.trim().length > 0;

  async function onBeamIt() {
    setIsSubmitting(true);
    setError(null);
    setResults([]);

    try {
      const validated = validateDiscoverParams({ labels, callerAddress });
      const client = new EnsRainbowBeamClient({ baseUrl: beamUrl });
      const res = await client.discover({
        labels: validated.labels,
        callerAddress: validated.callerAddress,
      });

      setResults(
        res.results.map((item) => {
          if ("labelHash" in item) {
            return {
              rawLabel: item.rawLabel,
              normalizedLabel: item.normalizedLabel,
              status: item.status,
            };
          }
          return { rawLabel: item.rawLabel, status: item.status };
        }),
      );
    } catch (err) {
      if (err instanceof EnsRainbowBeamHttpError) {
        setError(`Beam request failed (${err.status}): ${err.message}`);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-[1216px] mx-auto px-5 md:px-10 py-16">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-black">Beam labels for discovery</h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
          Paste one ENS label per line. We’ll classify each one against ENSNode’s index and tell you
          whether it’s already healed, still unknown, or absent.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-900">Caller address</span>
            <input
              value={callerAddress}
              onChange={(e) => setCallerAddress(e.target.value)}
              placeholder="0x…"
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/10"
              inputMode="text"
              autoComplete="off"
            />
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-900">Labels (one per line)</span>
              <span className="text-xs text-gray-500">{labels.length} / 100</span>
            </div>
            <textarea
              value={rawLabels}
              onChange={(e) => setRawLabels(e.target.value)}
              placeholder={"eth\nvitalik\nexample"}
              className="min-h-[220px] w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/10"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-900">Beam URL</span>
            <input
              value={beamUrl}
              onChange={(e) => setBeamUrl(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-black/10"
              spellCheck={false}
            />
            <span className="text-xs text-gray-500">
              Defaults to <span className="font-mono">{DEFAULT_BEAM_URL}</span>
            </span>
          </label>

          <button
            type="button"
            disabled={!canSubmit}
            className={`${legacyButtonVariants({ variant: "primary", size: "medium" })} w-fit ${
              !canSubmit ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={onBeamIt}
          >
            {isSubmitting ? "Beaming…" : "Beam it"}
          </button>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-900">Results</h3>
            {results.length > 0 ? (
              <span className="text-xs text-gray-500">{results.length} items</span>
            ) : null}
          </div>

          {results.length === 0 ? (
            <div className="mt-4 text-sm text-gray-500">No results yet.</div>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {results.map((r, i) => (
                <li
                  key={`${i}-${r.rawLabel}-${r.status}`}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-gray-900 break-all">{r.rawLabel}</div>
                    {r.normalizedLabel && r.normalizedLabel !== r.rawLabel ? (
                      <div className="mt-1 text-xs text-gray-500">
                        normalized: <span className="font-mono">{r.normalizedLabel}</span>
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
