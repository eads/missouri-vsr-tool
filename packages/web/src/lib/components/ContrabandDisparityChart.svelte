<script>
  import { Chart, Svg, Axis, Bars, Tooltip, Text } from "layerchart";
  import { scaleBand, scaleLinear } from "d3-scale";

  export let searchesByRace = {};
  export let contrabandByRace = {};
  export let raceKeys = ["White", "Black", "Hispanic"];

  const raceColors = {
    White: "#64748b",
    Black: "#0ea5e9",
    Hispanic: "#f59e0b",
    Asian: "#10b981",
    "Native American": "#8b5cf6",
    Other: "#6b7280"
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "—";
    return `${value.toFixed(1)}%`;
  };

  // Calculate search rate and hit rate for each race
  $: chartData = raceKeys.map(race => {
    const searches = searchesByRace[race] || 0;
    const contraband = contrabandByRace[race] || 0;
    const hitRate = searches > 0 ? (contraband / searches) * 100 : 0;
    return {
      race,
      searches,
      contraband,
      hitRate,
      color: raceColors[race] || "#94a3b8"
    };
  });

  // Normalize to percentages for comparison
  $: totalSearches = chartData.reduce((sum, d) => sum + d.searches, 0);
  $: totalContraband = chartData.reduce((sum, d) => sum + d.contraband, 0);

  $: normalizedData = chartData.map(d => ({
    ...d,
    searchPct: totalSearches > 0 ? (d.searches / totalSearches) * 100 : 0,
    contrabandPct: totalContraband > 0 ? (d.contraband / totalContraband) * 100 : 0
  }));
</script>

<div class="h-[200px]">
  <div class="flex h-full gap-4">
    <!-- Searches bar chart -->
    <div class="flex-1">
      <div class="mb-1 text-center text-xs font-semibold text-slate-600">% of Searches</div>
      <div class="flex h-[160px] items-end justify-center gap-2">
        {#each normalizedData as d}
          <div class="flex flex-col items-center">
            <div class="mb-1 text-[10px] font-semibold text-slate-700">{d.searchPct.toFixed(0)}%</div>
            <div
              class="w-10 rounded-t transition-all"
              style="height: {Math.max(4, d.searchPct * 1.4)}px; background-color: {d.color};"
              title="{d.race}: {formatNumber(d.searches)} searches"
            ></div>
            <div class="mt-1 text-[10px] text-slate-500">{d.race.slice(0, 1)}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Contraband found bar chart -->
    <div class="flex-1">
      <div class="mb-1 text-center text-xs font-semibold text-slate-600">% of Contraband Found</div>
      <div class="flex h-[160px] items-end justify-center gap-2">
        {#each normalizedData as d}
          <div class="flex flex-col items-center">
            <div class="mb-1 text-[10px] font-semibold text-slate-700">{d.contrabandPct.toFixed(0)}%</div>
            <div
              class="w-10 rounded-t transition-all"
              style="height: {Math.max(4, d.contrabandPct * 1.4)}px; background-color: {d.color};"
              title="{d.race}: {formatNumber(d.contraband)} contraband found"
            ></div>
            <div class="mt-1 text-[10px] text-slate-500">{d.race.slice(0, 1)}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<div class="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-600">
  {#each normalizedData as d}
    <span class="flex items-center gap-1">
      <span class="inline-block h-2.5 w-2.5 rounded-sm" style="background-color: {d.color};"></span>
      {d.race} (hit rate: {d.hitRate.toFixed(1)}%)
    </span>
  {/each}
</div>
