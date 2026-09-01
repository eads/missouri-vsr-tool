import { getMetricCoverage } from "../db.js";

/**
 * Why a ranking/distribution query came back with nothing.
 *
 * An empty `results: []` with no explanation reads to a model as "no agency in
 * Missouri has this metric" — which is a very different claim from "this metric
 * stops in 2021 and you asked about 2025". The two causes also want opposite
 * fixes from the caller: a coverage gap needs a different `year_range`, while a
 * threshold problem needs a lower floor. Guessing wrong sends the caller down a
 * road that can't work (#221).
 */
export interface EmptyResultDiagnosis {
  cause: "metric_coverage_gap" | "thresholds_too_strict";
  explanation: string;
  requested_window: [number, number];
  metric_coverage: Array<{
    canonical_key: string;
    years_present: number[];
    n_agencies: number;
    overlaps_requested_window: boolean;
  }>;
  suggested_retry: { year_range: [number, number] } | null;
}

export interface EmptyResultThresholds {
  min_sample_size?: number;
  min_total_stops?: number;
  county?: string | null;
  agency_type?: string | null;
}

/**
 * Diagnose an empty result for a metric built from `coverageKeys` (the
 * canonical keys its SQL actually reads) over [start, end].
 *
 * Coverage comes from the scan we already do at cold start, so this costs a
 * cache lookup, not a query.
 */
export const diagnoseEmptyResult = async (
  coverageKeys: string[],
  [start, end]: [number, number],
  thresholds: EmptyResultThresholds,
): Promise<EmptyResultDiagnosis> => {
  const coverage = await getMetricCoverage();
  const byKey = new Map(coverage.map((c) => [c.canonical_key, c]));

  const perKey = coverageKeys.map((key) => {
    const c = byKey.get(key);
    const years = c?.years_present ?? [];
    return {
      canonical_key: key,
      years_present: years,
      n_agencies: c?.n_agencies ?? 0,
      overlaps_requested_window: years.some((y) => y >= start && y <= end),
    };
  });

  const missing = perKey.filter((k) => !k.overlaps_requested_window);

  if (missing.length === 0) {
    const bits: string[] = [];
    if (thresholds.min_sample_size !== undefined) {
      bits.push(`min_sample_size=${thresholds.min_sample_size}`);
    }
    if (thresholds.min_total_stops !== undefined) {
      bits.push(`min_total_stops=${thresholds.min_total_stops}`);
    }
    if (thresholds.county) bits.push(`county=${thresholds.county}`);
    if (thresholds.agency_type) bits.push(`agency_type=${thresholds.agency_type}`);

    return {
      cause: "thresholds_too_strict",
      explanation:
        `Every canonical key this metric reads has data in ${start}–${end}, so this is NOT a coverage gap — ` +
        `no agency cleared the filters in effect (${bits.join(", ") || "none"}). ` +
        `Lower the sample-size floors, drop the county/agency_type filter, or widen year_range to pool more years. ` +
        `Do NOT report this as "no agency has this metric".`,
      requested_window: [start, end],
      metric_coverage: perKey,
      suggested_retry: null,
    };
  }

  // Years where EVERY key has data — the windows that can actually return rows.
  const usableYears = (() => {
    const sets = perKey.map((k) => new Set(k.years_present));
    const first = perKey[0]?.years_present ?? [];
    return first.filter((y) => sets.every((s) => s.has(y))).sort((a, b) => a - b);
  })();
  const latestUsable = usableYears.length > 0 ? usableYears[usableYears.length - 1] : null;

  const missingDesc = missing
    .map((k) =>
      k.years_present.length === 0
        ? `'${k.canonical_key}' has no rows at all in this dataset`
        : `'${k.canonical_key}' only has data for ${k.years_present.join(", ")}`,
    )
    .join("; ");

  return {
    cause: "metric_coverage_gap",
    explanation:
      `The requested window ${start}–${end} falls outside this metric's coverage: ${missingDesc}. ` +
      `The empty result means the underlying data does not exist for those years — it does NOT mean the ` +
      `agencies had a value of zero, and it does NOT mean no agency has ever reported this metric. ` +
      (latestUsable !== null
        ? `Retry with year_range=[${latestUsable}, ${latestUsable}] to get the most recent year that has data. `
        : `No single year has all of this metric's inputs. `) +
      `Lowering min_sample_size or min_total_stops will NOT help.`,
    requested_window: [start, end],
    metric_coverage: perKey,
    suggested_retry: latestUsable !== null ? { year_range: [latestUsable, latestUsable] } : null,
  };
};
