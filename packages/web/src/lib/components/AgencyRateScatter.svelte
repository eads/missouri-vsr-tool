<script lang="ts">
  import { onMount } from "svelte";
  import * as m from "$lib/paraglide/messages";

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
  export let xMetricUrl =
    "/data/metric_year/rates-by-race--rates--contraband-hit-rate.json";
  export let yMetricUrl = "/data/metric_year/rates-by-race--rates--search-rate.json";

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
  }> = [];
  let yearPoints: typeof allPoints = [];
  let activePoint: (typeof allPoints)[number] | null = null;

  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
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

  const buildValueMap = (rows: Array<Record<string, unknown>>) => {
    const byYear = new Map<number, Map<string, number>>();
    rows.forEach((row) => {
      const agency = String(row?.agency || "").trim();
      const year = Number(row?.year);
      const value = Number(row?.Total);
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

  const buildPoints = (
    yMap: Map<number, Map<string, number>>,
    xMap: Map<number, Map<string, number>>
  ) => {
    const points: typeof allPoints = [];
    const excluded = new Set(excludeAgencies.map((agency) => normalize(agency)));
    const audit = [];
    yMap.forEach((yYearMap, year) => {
      const xYearMap = xMap.get(year);
      if (!xYearMap) return;
      yYearMap.forEach((yValue, agency) => {
        const xValue = xYearMap.get(agency);
        if (!Number.isFinite(xValue)) return;
        if (excluded.has(normalize(agency))) return;
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
        points.push({ agency, year, x: xValue, y: yValue });
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
      const [xResponse, yResponse] = await Promise.all([
        fetch(xMetricUrl),
        fetch(yMetricUrl),
      ]);
      if (!xResponse.ok || !yResponse.ok) {
        throw new Error("Failed to load rate data.");
      }
      const xPayload = await xResponse.json();
      const yPayload = await yResponse.json();
      const xRows = Array.isArray(xPayload?.rows) ? xPayload.rows : [];
      const yRows = Array.isArray(yPayload?.rows) ? yPayload.rows : [];
      const xMap = buildValueMap(xRows);
      const yMap = buildValueMap(yRows);
      allPoints = buildPoints(yMap, xMap);
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Unable to load data.";
      allPoints = [];
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
        activePoint={activePoint}
        formatValue={formatValue}
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
