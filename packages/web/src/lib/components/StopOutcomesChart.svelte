<script>
  import { Chart, Svg, Axis, Spline, Points, Tooltip, Highlight } from "layerchart";
  import { scaleBand } from "d3-scale";

  export let dataByYear = {};
  export let years = [];

  const outcomeColors = {
    citations: "#0ea5e9",
    arrests: "#ef4444",
    searches: "#f59e0b"
  };

  const outcomeLabels = {
    citations: "Citations",
    arrests: "Arrests",
    searches: "Searches"
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "—";
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  };

  const outcomeKeys = ["citations", "arrests", "searches"];

  $: lineSeries = outcomeKeys.map(outcome => ({
    outcome,
    label: outcomeLabels[outcome],
    color: outcomeColors[outcome],
    data: years.map(year => ({
      year,
      value: Number(dataByYear[year]?.[outcome]) || 0,
      outcome
    }))
  }));

  $: allPoints = lineSeries.flatMap(s => s.data);

  $: valuesByYear = years.reduce((acc, year) => {
    acc[year] = {};
    outcomeKeys.forEach(outcome => {
      acc[year][outcome] = Number(dataByYear[year]?.[outcome]) || 0;
    });
    return acc;
  }, {});
</script>

<div class="h-[220px]">
  <Chart
    data={allPoints}
    x="year"
    y="value"
    xScale={scaleBand().paddingInner(0.4).paddingOuter(0.2)}
    yDomain={[0, null]}
    yNice
    padding={{ left: 45, right: 12, bottom: 28, top: 8 }}
    tooltip={{ mode: "quadtree-x" }}
  >
    <Svg>
      <Axis
        placement="left"
        grid={{ class: "stroke-slate-200/70" }}
        rule={{ class: "stroke-slate-400" }}
        tickLength={3}
        ticks={4}
        format={formatNumber}
        tickLabelProps={{
          style: "fill: #0f172a; font-size: 10px; font-weight: 600;",
        }}
      />
      {#each lineSeries as series}
        <Spline
          data={series.data}
          x="year"
          y="value"
          class="stroke-[2.5]"
          stroke={series.color}
        />
        <Points
          data={series.data}
          x="year"
          y="value"
          r={4}
          fill={series.color}
        />
      {/each}
      <Highlight lines />
      <Axis
        placement="bottom"
        rule={{ class: "stroke-slate-400" }}
        tickLength={3}
        tickLabelProps={{
          style: "fill: #64748b; font-size: 10px; font-weight: 500;",
        }}
      />
    </Svg>
    <Tooltip.Root>
      {#snippet children({ data })}
        {#if data}
          <Tooltip.Header>{data.year}</Tooltip.Header>
          <Tooltip.List>
            {#each outcomeKeys as outcome}
              <Tooltip.Item
                label={outcomeLabels[outcome]}
                value={formatNumber(valuesByYear[data.year]?.[outcome])}
                color={outcomeColors[outcome]}
                valueAlign="right"
              />
            {/each}
          </Tooltip.List>
        {/if}
      {/snippet}
    </Tooltip.Root>
  </Chart>
</div>

<div class="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
  {#each lineSeries as series}
    <span class="flex items-center gap-1.5">
      <span class="inline-block h-2 w-4 rounded-sm" style="background-color: {series.color};"></span>
      {series.label}
    </span>
  {/each}
</div>
