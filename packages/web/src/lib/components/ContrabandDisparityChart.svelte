<script>
  import { Chart, Svg, Axis, Bars, Tooltip, Highlight } from "layerchart";
  import { scaleBand } from "d3-scale";

  export let searchesByRace = {};
  export let contrabandByRace = {};
  export let raceKeys = ["White", "Black", "Hispanic"];

  const raceColors = {
    White: "#64748b",
    Black: "#0ea5e9",
    Hispanic: "#f59e0b"
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "—";
    return `${value.toFixed(1)}%`;
  };

  // Calculate hit rate (contraband found / searches) for each race
  $: chartData = raceKeys.map(race => {
    const searches = Number(searchesByRace[race]) || 0;
    const contraband = Number(contrabandByRace[race]) || 0;
    const hitRate = searches > 0 ? (contraband / searches) * 100 : 0;
    return {
      race,
      searches,
      contraband,
      hitRate,
      color: raceColors[race] || "#94a3b8"
    };
  });

  $: maxHitRate = Math.max(...chartData.map(d => d.hitRate), 1);
</script>

<div class="h-[220px]">
  <Chart
    data={chartData}
    x="race"
    y="hitRate"
    xScale={scaleBand().paddingInner(0.4).paddingOuter(0.2)}
    yDomain={[0, maxHitRate * 1.15]}
    yNice
    padding={{ left: 45, right: 12, bottom: 28, top: 8 }}
    tooltip={{ mode: "band" }}
  >
    <Svg>
      <Axis
        placement="left"
        grid={{ class: "stroke-slate-200/70" }}
        rule={{ class: "stroke-slate-400" }}
        tickLength={3}
        ticks={4}
        format={(v) => `${v.toFixed(0)}%`}
        tickLabelProps={{
          style: "fill: #0f172a; font-size: 10px; font-weight: 600;",
        }}
      />
      <Bars
        strokeWidth={0}
        radius={4}
        fill={(d) => raceColors[d.race] || "#94a3b8"}
      />
      <Highlight area />
      <Axis
        placement="bottom"
        rule={{ class: "stroke-slate-400" }}
        tickLength={3}
        tickLabelProps={{
          style: "fill: #64748b; font-size: 11px; font-weight: 500;",
        }}
      />
    </Svg>
    <Tooltip.Root>
      {#snippet children({ data })}
        {#if data}
          <Tooltip.Header>{data.race}</Tooltip.Header>
          <Tooltip.List>
            <Tooltip.Item
              label="Hit rate"
              value={formatPercent(data.hitRate)}
              color={raceColors[data.race]}
              valueAlign="right"
            />
            <Tooltip.Item
              label="Searches"
              value={formatNumber(data.searches)}
              valueAlign="right"
            />
            <Tooltip.Item
              label="Contraband found"
              value={formatNumber(data.contraband)}
              valueAlign="right"
            />
          </Tooltip.List>
        {/if}
      {/snippet}
    </Tooltip.Root>
  </Chart>
</div>

<p class="mt-2 text-center text-xs text-slate-500">
  Hit rate = contraband found ÷ searches. Hover for details.
</p>
