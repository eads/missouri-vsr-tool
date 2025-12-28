<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Chart, Svg, Axis, Bars, Highlight } from "layerchart";
  import { scaleBand } from "d3-scale";
  import {
    modal_baseline_agency_fallback,
    modal_baseline_mean_header,
    modal_baseline_median_header,
    modal_baseline_race_header,
    modal_chart_unavailable,
    modal_close,
    modal_metric_label,
    modal_no_baselines,
    modal_no_data,
    modal_statewide_baselines_heading,
    modal_statewide_baselines_subheading,
    race_asian,
    race_black,
    race_hispanic,
    race_native_american,
    race_other,
    race_total,
    race_white,
  } from "$lib/paraglide/messages";

  export let open = false;
  export let metricKey = "";
  export let metricLabel = "";
  export let rows = [];
  export let raceKeys = [];
  export let baselines = [];
  export let agencyName = "";

  const dispatch = createEventDispatcher();
  let backdropEl;

  const chartTypeForMetric = (key, sample) => {
    if (!key) return "bar";
    if (sample && typeof sample === "object" && !Array.isArray(sample)) return "bar";
    return "bar";
  };

  const toNumber = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const toTotal = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number" || typeof value === "string") return toNumber(value);
    if (typeof value !== "object" || Array.isArray(value)) return 0;

    const direct = value.Total ?? value.total;
    if (direct !== null && direct !== undefined && direct !== "") {
      return toNumber(direct);
    }

    return resolvedRaceKeys.reduce((acc, key) => {
      const lower = key.toLowerCase();
      return acc + toNumber(value[key] ?? value[lower] ?? 0);
    }, 0);
  };

  $: resolvedRaceKeys = raceKeys.length
    ? raceKeys
    : ["White", "Black", "Hispanic", "Asian", "Other"];
  $: sampleValue = rows.find((row) => row?.[metricKey] != null)?.[metricKey];
  $: chartType = chartTypeForMetric(metricKey, sampleValue);

  $: barTotals = rows.reduce((acc, row) => {
    const year = row?.year;
    if (!year) return acc;
    const totalValue = toTotal(row?.[metricKey]);
    acc[year] = (acc[year] ?? 0) + totalValue;
    return acc;
  }, {});

  $: sortedYears = Object.keys(barTotals).sort((a, b) => Number(a) - Number(b));

  $: barData = sortedYears.map((year) => ({
    year: String(year),
    value: barTotals[year] ?? 0,
  }));

  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  });

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "—";
    if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
    return numberFormatter.format(value);
  };

  const baselineRaceOrder = [
    "Total",
    "White",
    "Black",
    "Hispanic",
    "Asian",
    "Other",
    "Native American",
  ];

  const raceLabel = (key) => {
    switch (key) {
      case "Total":
        return race_total();
      case "White":
        return race_white();
      case "Black":
        return race_black();
      case "Hispanic":
        return race_hispanic();
      case "Asian":
        return race_asian();
      case "Other":
        return race_other();
      case "Native American":
        return race_native_american();
      default:
        return key;
    }
  };

  $: baselineEntries = Array.isArray(baselines)
    ? baselines.filter((entry) => entry?.slug === metricKey)
    : [];

  $: baselineYears = Array.from(new Set(baselineEntries.map((entry) => entry.year))).sort(
    (a, b) => Number(b) - Number(a)
  );

  $: baselineByYear = baselineEntries.reduce((acc, entry) => {
    const year = entry.year;
    if (year === null || year === undefined) return acc;
    if (!acc[year]) acc[year] = [];
    acc[year].push(entry);
    return acc;
  }, {});

  $: agencyTotalsByYear = rows.reduce((acc, row) => {
    const year = row?.year;
    if (!year) return acc;
    const metric = row?.[metricKey];
    if (!acc[year]) acc[year] = {};
    if (metric === null || metric === undefined) return acc;
    if (typeof metric === "number" || typeof metric === "string") {
      acc[year].Total = (acc[year].Total ?? 0) + toNumber(metric);
      return acc;
    }
    if (typeof metric !== "object" || Array.isArray(metric)) return acc;
    baselineRaceOrder.forEach((race) => {
      const lower = race.toLowerCase();
      const value = metric[race] ?? metric[lower];
      if (value === null || value === undefined) return;
      acc[year][race] = (acc[year][race] ?? 0) + toNumber(value);
    });
    return acc;
  }, {});

  const sortBaselineMetrics = (a, b) => {
    const orderA = baselineRaceOrder.indexOf(a.metric);
    const orderB = baselineRaceOrder.indexOf(b.metric);
    if (orderA !== -1 || orderB !== -1) {
      if (orderA === -1) return 1;
      if (orderB === -1) return -1;
      return orderA - orderB;
    }
    return String(a.metric).localeCompare(String(b.metric));
  };

  const handleBackdrop = (event) => {
    if (event.target === event.currentTarget) {
      dispatch("close");
    }
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      dispatch("close");
    }
  };

  $: if (open) {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(() => backdropEl?.focus());
    }
  } else {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }

  onDestroy(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  });
</script>

{#if open}
  <div
    bind:this={backdropEl}
    class="fixed inset-0 z-40 flex items-stretch justify-center bg-slate-950/60 sm:items-center sm:px-4 sm:py-8"
    on:click={handleBackdrop}
    on:keydown={handleKeydown}
    tabindex="0"
  >
    <div class="w-full max-w-full rounded-none bg-white p-4 shadow-2xl sm:max-w-4xl sm:rounded-2xl sm:p-6 max-h-[100svh] overflow-y-auto overflow-x-hidden sm:max-h-[90vh]">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            {modal_metric_label()}
          </p>
          <h2 class="mt-2 text-xl font-semibold text-slate-900">
            {metricLabel || metricKey}
          </h2>
        </div>
        <button
          class="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          type="button"
          on:click={() => dispatch("close")}
        >
          {modal_close()}
        </button>
      </div>

      <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {#if chartType === "bar"}
          {#if barData.length === 0}
            <p class="text-sm text-slate-500">{modal_no_data()}</p>
          {:else}
            <div class="h-[280px]">
              <Chart
                data={barData}
                x="year"
                xScale={scaleBand().paddingInner(0.55).paddingOuter(0.2)}
                y="value"
                yDomain={[0, null]}
                yNice={4}
                padding={{ left: 56, right: 12, bottom: 24, top: 8 }}
              >
                <Svg>
                  <Axis
                    placement="left"
                    grid={{ class: "stroke-slate-200/70" }}
                    rule={{ class: "stroke-slate-400" }}
                    tickLength={3}
                    ticks={4}
                    tickLabelProps={{
                      fill: "#0f172a",
                      stroke: "none",
                      strokeWidth: 0,
                      style: "font-size: 11px; font-weight: 600;",
                    }}
                  />
                  <Axis
                    placement="bottom"
                    rule={{ class: "stroke-slate-400" }}
                    tickLength={3}
                    tickLabelProps={{
                      fill: "#64748b",
                      stroke: "none",
                      strokeWidth: 0,
                      style: "font-size: 10px; font-weight: 500;",
                    }}
                  />
                  <Bars strokeWidth={1} fill="#cbd5e1" />
                  <Highlight area />
                </Svg>
              </Chart>
            </div>
          {/if}
        {:else}
          <p class="text-sm text-slate-500">{modal_chart_unavailable()}</p>
        {/if}
      </div>

      <div class="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div class="flex items-baseline justify-between gap-4">
          <h3 class="text-sm font-semibold text-slate-900">
            {modal_statewide_baselines_heading()}
          </h3>
          <p class="text-xs text-slate-400">{modal_statewide_baselines_subheading()}</p>
        </div>
        {#if baselineYears.length === 0}
          <p class="mt-3 text-sm text-slate-500">{modal_no_baselines()}</p>
        {:else}
          <div class="mt-3 space-y-4">
            {#each baselineYears as year}
              {@const yearEntries = (baselineByYear[year] ?? []).slice().sort(sortBaselineMetrics)}
              <div class="rounded-lg border border-slate-200">
                <div class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  {year}
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full table-auto border-separate border-spacing-0 text-xs text-slate-600">
                    <thead class="bg-white text-[11px] uppercase tracking-wide text-slate-400">
                      <tr>
                        <th class="px-3 py-2 text-left font-semibold">
                          {modal_baseline_race_header()}
                        </th>
                        <th class="px-3 py-2 text-left font-semibold">
                          {agencyName || modal_baseline_agency_fallback()}
                        </th>
                        <th class="px-3 py-2 text-left font-semibold">
                          {modal_baseline_mean_header()}
                        </th>
                        <th class="px-3 py-2 text-left font-semibold">
                          {modal_baseline_median_header()}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      {#each yearEntries as entry}
                        <tr>
                          <td class="px-3 py-2 font-medium text-slate-700">
                            {raceLabel(entry.metric)}
                          </td>
                          <td class="px-3 py-2">
                            {formatNumber(agencyTotalsByYear[year]?.[entry.metric])}
                          </td>
                          <td class="px-3 py-2">{formatNumber(entry.mean__no_mshp)}</td>
                          <td class="px-3 py-2">{formatNumber(entry.median__no_mshp)}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
