<script lang="ts">
  import { onMount } from "svelte";
  import * as m from "$lib/paraglide/messages";

  type MetricYearSubset = {
    agencies: string[];
    years: Array<number | string>;
    columns: string[];
    rows: Record<string, Array<Array<number | null>>>;
  };

  type AxisScaleType = "linear" | "log";

  const RATE_MULTIPLIER = 100;
  const RATE_METRIC_MAP: Record<string, string> = {
    "search-rate": "searches",
    "searches-rate": "searches",
    "arrest-rate": "arrests",
    "arrests-rate": "arrests",
    "citation-rate": "citations",
    "citations-rate": "citations",
    "contraband-hit-rate": "contraband",
    "contraband-rate": "contraband",
  };
  const metricDataCache = new Map<string, Promise<MetricYearSubset>>();

  const normalizePayload = (payload: unknown): MetricYearSubset => {
    if (!payload || typeof payload !== "object") {
      return { agencies: [], years: [], columns: [], rows: {} };
    }
    const record = payload as Record<string, unknown>;
    return {
      agencies: Array.isArray(record.agencies)
        ? record.agencies.map((agency) => String(agency))
        : [],
      years: Array.isArray(record.years) ? record.years : [],
      columns: Array.isArray(record.columns)
        ? record.columns.map((column) => String(column))
        : [],
      rows:
        record.rows && typeof record.rows === "object"
          ? (record.rows as Record<string, Array<Array<number | null>>>)
          : {},
    };
  };

  const fetchMetricData = (url: string) => {
    const cached = metricDataCache.get(url);
    if (cached) return cached;
    const request = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load rate data.");
        }
        return response.json();
      })
      .then((payload) => normalizePayload(payload))
      .catch((error) => {
        metricDataCache.delete(url);
        throw error;
      });
    metricDataCache.set(url, request);
    return request;
  };

  export let selectedYear: number | string;
  export let agencyName = "";
  export let title = "";
  export let xLabel = "";
  export let yLabel = "";
  export let excludeAgencies: string[] = [];
  export let minX: number | null = null;
  export let minY: number | null = null;
  export let maxX: number | null = null;
  export let maxY: number | null = null;
  export let minStops: number | null = null;
  export let sizeByStops = false;
  export let minCount: number | null = null;
  export let minCountKey = "rates-by-race--totals--searches";
  export let minCountMessage = "Not enough records to display this chart.";
  export let excludeExactValue: number | null = null;
  export let xCountKey: string | null = null;
  export let yCountKey: string | null = null;
  export let xCountLabel = "";
  export let yCountLabel = "";
  export let xScaleType: AxisScaleType = "linear";
  export let yScaleType: AxisScaleType = "linear";
  export let dataUrl = "/data/dist/metric_year_subset.json";
  export let xMetricKey = "rates-by-race--totals--contraband-rate";
  export let yMetricKey = "rates-by-race--totals--searches-rate";
  export let stopsMetricKey = "rates-by-race--totals--all-stops";

  let isLoading = true;
  let loadError = "";
  let chartLoadError: unknown = null;
  let ChartComponent: typeof import("./AgencyRateScatterChart.svelte").default | null =
    null;
  let allPoints: Array<{
    agency: string;
    year: number;
    x: number;
    y: number;
    stops?: number;
    xCount?: number;
    yCount?: number;
  }> = [];
  let yearPoints: typeof allPoints = [];
  let activePoint: (typeof allPoints)[number] | null = null;
  let minCountMap: Map<number, Map<string, number>> | null = null;
  let minCountError = "";

  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  });
  const stopsFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });
  const countFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });

  const normalize = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const formatValue = (value: number | null | undefined) =>
    value === null || value === undefined || Number.isNaN(value)
      ? "—"
      : numberFormatter.format(value);
  const formatStops = (value: number | null | undefined) =>
    value === null || value === undefined || Number.isNaN(value)
      ? "—"
      : stopsFormatter.format(value);
  const formatCount = (value: number | null | undefined) =>
    value === null || value === undefined || Number.isNaN(value)
      ? "—"
      : countFormatter.format(value);

  const shouldExcludeValue = (value: number) =>
    excludeExactValue !== null &&
    Number.isFinite(value) &&
    Math.abs(value - excludeExactValue) < 1e-9;

  const findAgencyValue = (yearMap: Map<string, number>, agency: string) => {
    const normalizedAgency = normalize(agency);
    if (!normalizedAgency) return null;
    for (const [name, value] of yearMap.entries()) {
      if (normalize(name) === normalizedAgency) {
        return value;
      }
    }
    return null;
  };

  const buildValueMapFromRows = (
    payload: MetricYearSubset,
    rowKey: string,
    columnName = "Total"
  ) => {
    const byYear = new Map<number, Map<string, number>>();
    const rowData = payload.rows?.[rowKey];
    if (!Array.isArray(rowData)) return byYear;
    const valueIndex = payload.columns.indexOf(columnName);
    if (valueIndex === -1) return byYear;
    rowData.forEach((row) => {
      if (!Array.isArray(row) || row.length <= valueIndex) return;
      const agencyIndex = Number(row[0]);
      const yearIndex = Number(row[1]);
      const agency = payload.agencies?.[agencyIndex]?.trim() ?? "";
      const year = Number(payload.years?.[yearIndex]);
      const rawValue = row[valueIndex];
      const value = rawValue === null || rawValue === undefined ? NaN : Number(rawValue);
      if (!agency || !Number.isFinite(year) || !Number.isFinite(value)) return;
      let yearMap = byYear.get(year);
      if (!yearMap) {
        yearMap = new Map();
        byYear.set(year, yearMap);
      }
      yearMap.set(agency, value);
    });
    return byYear;
  };

  const buildRateMap = (
    numeratorMap: Map<number, Map<string, number>>,
    denominatorMap: Map<number, Map<string, number>>
  ) => {
    const byYear = new Map<number, Map<string, number>>();
    numeratorMap.forEach((numeratorYearMap, year) => {
      const denominatorYearMap = denominatorMap.get(year);
      if (!denominatorYearMap) return;
      numeratorYearMap.forEach((numeratorValue, agency) => {
        const denominatorValue = denominatorYearMap.get(agency);
        if (!Number.isFinite(denominatorValue) || !denominatorValue) return;
        const value = (numeratorValue / denominatorValue) * RATE_MULTIPLIER;
        if (!Number.isFinite(value)) return;
        let yearMap = byYear.get(year);
        if (!yearMap) {
          yearMap = new Map();
          byYear.set(year, yearMap);
        }
        yearMap.set(agency, value);
      });
    });
    return byYear;
  };

  const getRateKeys = (rowKey: string) => {
    const parts = rowKey.split("--");
    if (parts.length !== 3) return null;
    const [tableId, sectionId, metricId] = parts;
    const numeratorMetricId = RATE_METRIC_MAP[metricId];
    if (!numeratorMetricId) return null;
    const totalsSectionId = sectionId === "rates" ? "totals" : sectionId;
    return {
      numeratorKey: `${tableId}--${totalsSectionId}--${numeratorMetricId}`,
      denominatorKey: `${tableId}--${totalsSectionId}--all-stops`,
    };
  };

  const buildMetricValueMap = (payload: MetricYearSubset, rowKey: string) => {
    if (!rowKey) return new Map<number, Map<string, number>>();
    if (payload.rows?.[rowKey]) {
      return buildValueMapFromRows(payload, rowKey);
    }
    const rateKeys = getRateKeys(rowKey);
    if (!rateKeys) return new Map<number, Map<string, number>>();
    const numeratorMap = buildValueMapFromRows(payload, rateKeys.numeratorKey);
    const denominatorMap = buildValueMapFromRows(payload, rateKeys.denominatorKey);
    if (!numeratorMap.size || !denominatorMap.size) {
      return new Map<number, Map<string, number>>();
    }
    return buildRateMap(numeratorMap, denominatorMap);
  };

  const buildPoints = (
    yMap: Map<number, Map<string, number>>,
    xMap: Map<number, Map<string, number>>,
    stopsMap?: Map<number, Map<string, number>>,
    minStopCount?: number | null,
    countMap?: Map<number, Map<string, number>>,
    minCountValue?: number | null,
    xCountMap?: Map<number, Map<string, number>>,
    yCountMap?: Map<number, Map<string, number>>
  ) => {
    const points: typeof allPoints = [];
    const excluded = new Set(excludeAgencies.map((agency) => normalize(agency)));
    const audit = [];
    yMap.forEach((yYearMap, year) => {
      const xYearMap = xMap.get(year);
      const stopsYearMap = stopsMap?.get(year);
      const countYearMap = countMap?.get(year);
      const xCountYearMap = xCountMap?.get(year);
      const yCountYearMap = yCountMap?.get(year);
      if (!xYearMap) return;
      yYearMap.forEach((yValue, agency) => {
        const xValue = xYearMap.get(agency);
        if (!Number.isFinite(xValue)) return;
        if (excluded.has(normalize(agency))) return;
        const stopValue = stopsYearMap?.get(agency);
        const countValue = countYearMap?.get(agency);
        const xCountValue = xCountYearMap?.get(agency);
        const yCountValue = yCountYearMap?.get(agency);
        if (
          minStopCount !== null &&
          minStopCount !== undefined &&
          (!Number.isFinite(stopValue) || stopValue < minStopCount)
        ) {
          return;
        }
        if (
          minCountValue !== null &&
          minCountValue !== undefined &&
          (!Number.isFinite(countValue) || countValue < minCountValue)
        ) {
          return;
        }
        if (shouldExcludeValue(xValue) || shouldExcludeValue(yValue)) {
          return;
        }
        if (sizeByStops && (!Number.isFinite(stopValue) || stopValue <= 0)) {
          return;
        }
        if (xScaleType === "log" && xValue <= 0) {
          return;
        }
        if (yScaleType === "log" && yValue <= 0) {
          return;
        }
        if (minX !== null && xValue <= minX) {
          audit.push({ agency, year, x: xValue, y: yValue });
          return;
        }
        if (minY !== null && yValue <= minY) {
          audit.push({ agency, year, x: xValue, y: yValue });
          return;
        }
        if (maxX !== null && xValue > maxX) {
          audit.push({ agency, year, x: xValue, y: yValue });
          return;
        }
        if (maxY !== null && yValue > maxY) {
          audit.push({ agency, year, x: xValue, y: yValue });
          return;
        }
        points.push({
          agency,
          year,
          x: xValue,
          y: yValue,
          stops: Number.isFinite(stopValue) ? stopValue : undefined,
          xCount: Number.isFinite(xCountValue) ? xCountValue : undefined,
          yCount: Number.isFinite(yCountValue) ? yCountValue : undefined,
        });
      });
    });
    if (audit.length) {
      console.warn(
        `[agency scatter] ${title || "scatter"} excluded ${audit.length} out-of-range values`,
        audit.slice(0, 8)
      );
    }
    return points;
  };

  const loadData = async () => {
    isLoading = true;
    loadError = "";
    try {
      const payload = await fetchMetricData(dataUrl);
      const xMap = buildMetricValueMap(payload, xMetricKey);
      const yMap = buildMetricValueMap(payload, yMetricKey);
      const needsStops = sizeByStops || minStops !== null;
      const stopsMap = needsStops
        ? buildMetricValueMap(payload, stopsMetricKey)
        : undefined;
      const xCountMap = xCountKey ? buildMetricValueMap(payload, xCountKey) : undefined;
      const yCountMap = yCountKey ? buildMetricValueMap(payload, yCountKey) : undefined;
      minCountMap =
        minCount !== null ? buildMetricValueMap(payload, minCountKey) : null;
      allPoints = buildPoints(
        yMap,
        xMap,
        stopsMap,
        minStops,
        minCountMap ?? undefined,
        minCount,
        xCountMap,
        yCountMap
      );
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Unable to load data.";
      allPoints = [];
      minCountMap = null;
    } finally {
      isLoading = false;
    }
  };

  onMount(() => {
    import("$lib/components/AgencyRateScatterChart.svelte")
      .then((module) => {
        ChartComponent = module.default;
      })
      .catch((error) => {
        chartLoadError = error;
      });
    loadData();
  });

  $: {
    const year = Number(selectedYear);
    minCountError = "";
    if (minCount !== null && minCountMap && Number.isFinite(year)) {
      const yearMap = minCountMap.get(year);
      if (yearMap) {
        const value = findAgencyValue(yearMap, agencyName || "");
        if (value !== null && value < minCount) {
          minCountError = minCountMessage;
        }
      }
    }
    if (!Number.isFinite(year) || !allPoints.length) {
      yearPoints = [];
      activePoint = null;
    } else {
      yearPoints = allPoints.filter((point) => point.year === year);
      const normalizedAgency = normalize(agencyName || "");
      activePoint =
        yearPoints.find((point) => normalize(point.agency) === normalizedAgency) ||
        null;
    }
  }

</script>

  <div class="rounded-lg border border-slate-200 bg-white p-3">
    <div class="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {(title || m?.agency_scatter_heading?.()) ?? "Search rate vs contraband hit rate"}
    </div>
  {#if isLoading}
    <div class="text-xs text-slate-500">
      {m?.agency_scatter_loading?.() ?? "Loading rate comparison…"}
    </div>
  {:else if loadError}
    <div class="text-xs text-rose-600">{loadError}</div>
  {:else if minCountError}
    <div class="text-xs text-rose-600">{minCountError}</div>
  {:else if yearPoints.length === 0}
    <div class="text-xs text-slate-500">
      {m?.agency_scatter_no_data?.() ?? "No rate data available for this year."}
    </div>
  {:else if chartLoadError}
    <div class="text-xs text-slate-500">
      {m?.agency_scatter_chart_unavailable?.() ?? "Chart unavailable."}
    </div>
  {:else if ChartComponent}
    <div class="h-[280px] w-full">
      <svelte:component
        this={ChartComponent}
        points={yearPoints}
        domainPoints={allPoints}
        activePoint={activePoint}
        formatValue={formatValue}
        formatStops={formatStops}
        formatCount={formatCount}
        xCountLabel={xCountLabel}
        yCountLabel={yCountLabel}
        sizeByStops={sizeByStops}
        xScaleType={xScaleType}
        yScaleType={yScaleType}
        xLabel={(xLabel || m?.agency_scatter_hit_rate_label?.()) ?? "Hit rate"}
        yLabel={(yLabel || m?.agency_scatter_search_rate_label?.()) ?? "Search rate"}
      />
    </div>
  {:else}
    <div class="text-xs text-slate-500">
      {m?.agency_scatter_chart_loading?.() ?? "Loading chart…"}
    </div>
  {/if}
</div>
