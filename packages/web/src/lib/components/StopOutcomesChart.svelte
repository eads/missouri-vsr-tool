<script>
  import { browser } from "$app/environment";
  import { scaleTime, scaleLinear } from "d3-scale";
  import { stack, stackOrderNone, stackOffsetNone, area, curveMonotoneX } from "d3-shape";

  export let dataByYear = {};
  export let years = [];

  const outcomeColors = {
    citations: "#095771",
    arrests: "#2d898b",
    searches: "#219255"
  };

  const outcomeLabels = {
    citations: "Citations",
    arrests: "Arrests",
    searches: "Searches"
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "—";
    if (value >= 1000) {
      const k = value / 1000;
      return k % 1 === 0 ? `${k.toFixed(0)}K` : `${k.toFixed(1)}K`;
    }
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  };

  const outcomeKeys = ["citations", "arrests", "searches"];

  // Transform data for stacked area
  $: stackedData = years.map(year => ({
    year: Number(year),
    citations: Number(dataByYear[year]?.citations) || 0,
    arrests: Number(dataByYear[year]?.arrests) || 0,
    searches: Number(dataByYear[year]?.searches) || 0,
  })).sort((a, b) => a.year - b.year);

  $: valuesByYear = years.reduce((acc, year) => {
    acc[year] = {};
    outcomeKeys.forEach(outcome => {
      acc[year][outcome] = Number(dataByYear[year]?.[outcome]) || 0;
    });
    return acc;
  }, {});

  // Dynamically import layerchart only on client
  let Chart, Svg, Axis, Area, Tooltip, Highlight;
  $: if (browser) {
    import("layerchart").then((module) => {
      Chart = module.Chart;
      Svg = module.Svg;
      Axis = module.Axis;
      Area = module.Area;
      Tooltip = module.Tooltip;
      Highlight = module.Highlight;
    });
  }

  // Create stacked series
  $: stackGenerator = stack()
    .keys(outcomeKeys)
    .order(stackOrderNone)
    .offset(stackOffsetNone);

  $: series = stackedData.length > 0 ? stackGenerator(stackedData) : [];

  // Calculate domains
  $: xExtent = stackedData.length > 0
    ? [Math.min(...stackedData.map(d => d.year)), Math.max(...stackedData.map(d => d.year))]
    : [2020, 2024];

  $: yMax = series.length > 0
    ? Math.max(...series.flatMap(s => s.flatMap(d => d[1])))
    : 100;
</script>

{#if browser && Chart && stackedData.length > 0}
  <div class="h-[200px] sm:h-[220px]">
    <Chart
      data={stackedData}
      x="year"
      xScale={scaleLinear().domain(xExtent)}
      yDomain={[0, yMax * 1.1]}
      yNice
      padding={{ left: 45, right: 8, bottom: 24, top: 8 }}
      tooltip={{ mode: "bisect-x" }}
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
            style: "fill: #0f172a; font-size: 9px; font-weight: 600;",
          }}
        />
        {#each series as s, i}
          <Area
            data={s}
            x={(d) => d.data.year}
            y0={(d) => d[0]}
            y1={(d) => d[1]}
            fill={outcomeColors[outcomeKeys[i]]}
            fillOpacity={0.8}
            line={{ stroke: outcomeColors[outcomeKeys[i]], class: "stroke-[1.5]" }}
          />
        {/each}
        <Highlight lines />
        <Axis
          placement="bottom"
          rule={{ class: "stroke-slate-400" }}
          tickLength={3}
          format={(v) => String(Math.round(v))}
          tickLabelProps={{
            style: "fill: #64748b; font-size: 9px; font-weight: 500;",
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
{:else}
  <div class="h-[200px] sm:h-[220px] flex items-center justify-center">
    <span class="text-sm text-slate-400">Loading chart...</span>
  </div>
{/if}

<div class="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600">
  {#each outcomeKeys as outcome}
    <span class="flex items-center gap-1">
      <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background-color: {outcomeColors[outcome]};"></span>
      <span class="text-[11px]">{outcomeLabels[outcome]}</span>
    </span>
  {/each}
</div>
