<script>
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Chart, Svg, Axis, Bars, Highlight } from "layerchart";
  import { scaleBand } from "d3-scale";

  export let open = false;
  export let metricKey = "";
  export let metricLabel = "";
  export let rows = [];
  export let raceKeys = [];

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
    <div class="w-full max-w-full rounded-none bg-white p-4 shadow-2xl sm:max-w-4xl sm:rounded-2xl sm:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Metric</p>
          <h2 class="mt-2 text-xl font-semibold text-slate-900">
            {metricLabel || metricKey}
          </h2>
        </div>
        <button
          class="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          type="button"
          on:click={() => dispatch("close")}
        >
          Close
        </button>
      </div>

      <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        {#if chartType === "bar"}
          {#if barData.length === 0}
            <p class="text-sm text-slate-500">No data available for this metric.</p>
          {:else}
            <div class="h-[280px]">
              <Chart
                data={barData}
                x="year"
                xScale={scaleBand().paddingInner(0.55).paddingOuter(0.2)}
                y="value"
                yDomain={[0, null]}
                yNice={4}
                padding={{ left: 28, right: 12, bottom: 24, top: 8 }}
              >
                <Svg>
                  <Axis
                    placement="left"
                    grid={{ class: "stroke-slate-200/70" }}
                    rule={{ class: "stroke-slate-300" }}
                    tickLength={3}
                    tickLabelProps={{
                      class: "text-[9px] font-medium",
                      fill: "#64748b",
                      stroke: "none",
                      strokeWidth: 0,
                    }}
                  />
                  <Axis
                    placement="bottom"
                    rule={{ class: "stroke-slate-300" }}
                    tickLength={3}
                    tickLabelProps={{
                      class: "text-[9px] font-medium",
                      fill: "#64748b",
                      stroke: "none",
                      strokeWidth: 0,
                    }}
                  />
                  <Bars strokeWidth={1} fill="#cbd5e1" />
                  <Highlight area />
                </Svg>
              </Chart>
            </div>
          {/if}
        {:else}
          <p class="text-sm text-slate-500">Chart type not available yet.</p>
        {/if}
      </div>
    </div>
  </div>
{/if}
