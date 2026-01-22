<script>
  import StickyHeader from "$lib/components/StickyHeader.svelte";
  import AgencyRateScatter from "$lib/components/AgencyRateScatter.svelte";
  import * as m from "$lib/paraglide/messages";
  import { onMount } from "svelte";

  export let data;

  let selectedLocation = null;
  let aboutDataHtml = "";
  let statsData = null;
  let historicalOutcomes = null; // { years: [], data: { citations: [], arrests: [], searches: [], noAction: [] } }
  let historicalByRace = null; // { years: [], data: { White: [], Black: [], Hispanic: [] } }

  // Tooltip state
  let tooltip = { show: false, x: 0, y: 0, content: "" };

  function showTooltip(event, content) {
    const rect = event.target.getBoundingClientRect();
    tooltip = {
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      content
    };
  }

  function hideTooltip() {
    tooltip = { ...tooltip, show: false };
  }

  onMount(async () => {
    try {
      // Fetch 2024 stats data
      const statsResponse = await fetch("/data/homepage_2024_stats.json");
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      }
    } catch (error) {
      console.error("Failed to load stats data:", error);
    }

    try {
      // Fetch historical data for slope charts
      const metricResponse = await fetch("/data/metric_year_subset.json");
      if (metricResponse.ok) {
        const metricData = await metricResponse.json();
        // Row format: [agency_index, year_index, Total, White, Black, ...]
        // So Total is at index 2 (after agency_index and year_index)
        const totalColOffset = 2;

        // Build historical statewide data for slope charts
        const years = metricData.years;
        const whiteColOffset = 3;
        const blackColOffset = 4;
        const hispanicColOffset = 5;

        // Aggregate statewide totals by year
        const statewideByYear = {};
        years.forEach((year, yearIdx) => {
          statewideByYear[year] = {
            stops: 0, citations: 0, arrests: 0, searches: 0,
            White: 0, Black: 0, Hispanic: 0
          };
        });

        // Sum all-stops by year and race
        (metricData.rows["rates-by-race--totals--all-stops"] || []).forEach(row => {
          const yearIdx = row[1];
          const year = years[yearIdx];
          if (statewideByYear[year]) {
            statewideByYear[year].stops += row[totalColOffset] || 0;
            statewideByYear[year].White += row[whiteColOffset] || 0;
            statewideByYear[year].Black += row[blackColOffset] || 0;
            statewideByYear[year].Hispanic += row[hispanicColOffset] || 0;
          }
        });

        // Sum citations by year
        (metricData.rows["rates-by-race--totals--citations"] || []).forEach(row => {
          const yearIdx = row[1];
          const year = years[yearIdx];
          if (statewideByYear[year]) {
            statewideByYear[year].citations += row[totalColOffset] || 0;
          }
        });

        // Sum arrests by year
        (metricData.rows["rates-by-race--totals--arrests"] || []).forEach(row => {
          const yearIdx = row[1];
          const year = years[yearIdx];
          if (statewideByYear[year]) {
            statewideByYear[year].arrests += row[totalColOffset] || 0;
          }
        });

        // Sum searches by year
        (metricData.rows["rates-by-race--totals--searches"] || []).forEach(row => {
          const yearIdx = row[1];
          const year = years[yearIdx];
          if (statewideByYear[year]) {
            statewideByYear[year].searches += row[totalColOffset] || 0;
          }
        });

        // Build historical outcomes data as PERCENTAGES of total stops
        const sortedYears = years.slice().sort((a, b) => a - b);
        historicalOutcomes = {
          years: sortedYears,
          data: sortedYears.map(year => {
            const stops = statewideByYear[year]?.stops || 1;
            const citations = statewideByYear[year]?.citations || 0;
            const arrests = statewideByYear[year]?.arrests || 0;
            const searches = statewideByYear[year]?.searches || 0;
            const noAction = Math.max(0, stops - citations - arrests - searches);
            return {
              year,
              citations: (citations / stops) * 100,
              arrests: (arrests / stops) * 100,
              searches: (searches / stops) * 100,
              noAction: (noAction / stops) * 100
            };
          })
        };

        // Build historical by race data as PERCENTAGES of total stops (including Other)
        historicalByRace = {
          years: sortedYears,
          data: sortedYears.map(year => {
            const stops = statewideByYear[year]?.stops || 1;
            const white = ((statewideByYear[year]?.White || 0) / stops) * 100;
            const black = ((statewideByYear[year]?.Black || 0) / stops) * 100;
            const hispanic = ((statewideByYear[year]?.Hispanic || 0) / stops) * 100;
            const other = Math.max(0, 100 - white - black - hispanic);
            return {
              year,
              White: white,
              Black: black,
              Hispanic: hispanic,
              Other: other
            };
          })
        };
      }
    } catch (error) {
      console.error("Failed to load scatter data:", error);
    }
  });

  const formatStops = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return "0";
    if (numeric >= 1000000) {
      const m = numeric / 1000000;
      return `${m.toFixed(1)}M`;
    }
    if (numeric >= 1000) {
      const k = numeric / 1000;
      return `${k.toFixed(1)}K`;
    }
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(numeric);
  };

  const handleLocationSelect = (location) => {
    selectedLocation = location;
  };

  $: displayStat = selectedLocation
    ? m.home_stat_template()
        .replace("{year}", "2023")
        .replace("{location}", selectedLocation.canonical_name || selectedLocation.agency_slug)
        .replace("{stops}", formatStops(selectedLocation.all_stops_total))
    : m.home_stat_default();
</script>

<svelte:head>
  <title>{m.home_hero_headline()}</title>
</svelte:head>

<StickyHeader agencies={data.agencies} />

<!-- Skip to main content link for keyboard/screen reader users -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:bg-[#2c9166] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
>
  Skip to main content
</a>

<main id="main-content" class="min-h-screen bg-white">
  <!-- Hero Section -->
  <section class="bg-white px-6 py-12">
    <div class="mx-auto max-w-3xl text-center">
      <h1 class="text-4xl font-bold text-slate-900 md:text-5xl">
        {m.home_hero_headline()}
      </h1>
      <p class="mt-4 text-lg leading-relaxed text-slate-700">
        {m.home_why_text()}
      </p>
    </div>
  </section>

  <!-- Highlights Grid -->
  <section class="bg-gradient-to-b from-slate-50 to-slate-100/50 py-16 sm:py-20">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="mb-10 sm:mb-12 text-center text-3xl sm:text-4xl font-bold text-slate-900">
        {m.home_highlights_heading()}
      </h2>

      <div class="grid gap-5 sm:gap-8 md:grid-cols-2 md:grid-rows-2 md:auto-rows-fr" role="list" aria-label="Data highlights">
        <!-- Box 1: Population vs Stops Comparison -->
        <article class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 flex flex-col h-[380px] sm:h-[420px] shadow-sm hover:shadow-md transition-shadow duration-300" role="listitem" aria-labelledby="box1-title">
          <div class="mb-3 sm:mb-4">
            <h3 id="box1-title" class="text-lg sm:text-xl font-bold text-slate-900">
              Black drivers were 17% of stops, but only 11% of Missouri's population
            </h3>
            <p class="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Compare who lives in Missouri vs. who gets stopped by police.
            </p>
          </div>

          {#if statsData}
            {@const raceColors = { White: "#095771", Black: "#2d898b", Hispanic: "#219255", Other: "#94a3b8" }}
            {@const population = { White: 79.1, Black: 11.8, Hispanic: 4.4, Other: 4.7 }}
            {@const totalStops = statsData.total_stops}
            {@const stopsData = {
              White: (statsData.by_race.all_stops.White / totalStops) * 100,
              Black: (statsData.by_race.all_stops.Black / totalStops) * 100,
              Hispanic: (statsData.by_race.all_stops.Hispanic / totalStops) * 100,
              Other: 100 - (statsData.by_race.all_stops.White / totalStops) * 100 - (statsData.by_race.all_stops.Black / totalStops) * 100 - (statsData.by_race.all_stops.Hispanic / totalStops) * 100
            }}
            {@const raceOrder = ["White", "Black", "Hispanic", "Other"]}

            <div class="flex-1 flex flex-col items-center justify-center space-y-4 w-full">
              <!-- Missouri Population Bar -->
              <div role="figure" aria-label="Missouri population breakdown by race">
                <div class="flex items-center justify-between mb-1 sm:mb-2">
                  <span id="pop-bar-label" class="text-xs sm:text-sm font-semibold text-slate-700">Missouri Population</span>
                  <span class="text-[10px] sm:text-xs text-slate-500">6.2M residents</span>
                </div>
                <div class="relative h-8 sm:h-10 w-full flex rounded overflow-hidden" role="group" aria-labelledby="pop-bar-label">
                  {#each raceOrder as race}
                    {@const width = population[race]}
                    <button
                      type="button"
                      class="h-full flex items-center justify-center cursor-pointer hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset transition-opacity"
                      style="width: {width}%; background-color: {raceColors[race]};"
                      on:mouseenter={(e) => showTooltip(e, `${race}: ${population[race].toFixed(1)}% of population`)}
                      on:mouseleave={hideTooltip}
                      on:focus={(e) => showTooltip(e, `${race}: ${population[race].toFixed(1)}% of population`)}
                      on:blur={hideTooltip}
                      aria-label="{race}: {population[race].toFixed(1)}% of Missouri's population"
                    >
                      {#if width > 10}
                        <span class="text-[9px] sm:text-[10px] font-bold text-white" aria-hidden="true">{Math.round(width)}%</span>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Traffic Stops Bar -->
              <div role="figure" aria-label="Traffic stops breakdown by race">
                <div class="flex items-center justify-between mb-1 sm:mb-2">
                  <span id="stops-bar-label" class="text-xs sm:text-sm font-semibold text-slate-700">Traffic Stops (2024)</span>
                  <span class="text-[10px] sm:text-xs text-slate-500">{formatStops(totalStops)} stops</span>
                </div>
                <div class="relative h-8 sm:h-10 w-full flex rounded overflow-hidden" role="group" aria-labelledby="stops-bar-label">
                  {#each raceOrder as race}
                    {@const width = stopsData[race]}
                    <button
                      type="button"
                      class="h-full flex items-center justify-center cursor-pointer hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset transition-opacity"
                      style="width: {width}%; background-color: {raceColors[race]};"
                      on:mouseenter={(e) => showTooltip(e, `${race}: ${width.toFixed(1)}% of stops`)}
                      on:mouseleave={hideTooltip}
                      on:focus={(e) => showTooltip(e, `${race}: ${width.toFixed(1)}% of stops`)}
                      on:blur={hideTooltip}
                      aria-label="{race}: {width.toFixed(1)}% of traffic stops in 2024"
                    >
                      {#if width > 10}
                        <span class="text-[9px] sm:text-[10px] font-bold text-white" aria-hidden="true">{Math.round(width)}%</span>
                      {/if}
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Disparity callout -->
              <div class="bg-slate-50 rounded p-2 border border-slate-200 text-xs">
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded" style="background-color: {raceColors.Black}"></span>
                  <span class="text-slate-600">Black: <strong class="text-slate-900">{stopsData.Black.toFixed(1)}%</strong> stops vs <strong class="text-slate-900">{population.Black}%</strong> population</span>
                </span>
              </div>

              <!-- Legend -->
              <div class="flex flex-wrap justify-center gap-3 shrink-0">
                {#each raceOrder as race}
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-sm" style="background-color: {raceColors[race]}"></span>
                    <span class="text-[10px] text-slate-600">{race}</span>
                  </span>
                {/each}
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading data...</span>
            </div>
          {/if}
        </article>

        <!-- Box 2: Search Rate vs Hit Rate Scatter -->
        <article class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 flex flex-col h-[380px] sm:h-[420px] shadow-sm hover:shadow-md transition-shadow duration-300" role="listitem" aria-labelledby="box2-title">
          <div class="mb-3 sm:mb-4">
            <h3 id="box2-title" class="text-lg sm:text-xl font-bold text-slate-900">
              Officers searched 4.8% of stopped drivers, but found contraband in only 1 in 5
            </h3>
            <p class="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Each dot is an agency. Higher search rates don't mean more contraband found.
            </p>
          </div>

          <div class="flex-1 flex flex-col items-center justify-center min-h-0 w-full [&>div]:border-0 [&>div]:p-0 [&>div]:bg-transparent [&>div]:rounded-none [&>div]:flex-1 [&>div]:flex [&>div]:flex-col [&>div]:w-full [&>div>div.mb-2]:hidden [&>div>div.mt-1]:hidden [&_div.h-\[280px\]]:h-full [&_div.h-\[280px\]]:flex-1">
            <AgencyRateScatter
              selectedYear={2024}
              title=""
              xLabel="Hit rate"
              yLabel="Search rate"
              xMetricKey="rates-by-race--rates--contraband-hit-rate"
              yMetricKey="rates-by-race--rates--search-rate"
              sizeByStops={true}
              minStops={100}
              maxX={50}
              dataUrl="/data/metric_year_subset.json"
            />
          </div>
        </article>

        <!-- Box 3: Historical Outcomes - Slope Chart -->
        <article class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 flex flex-col h-[380px] sm:h-[420px] shadow-sm hover:shadow-md transition-shadow duration-300" role="listitem" aria-labelledby="box3-title">
          <div class="mb-3 sm:mb-4">
            <h3 id="box3-title" class="text-lg sm:text-xl font-bold text-slate-900">
              About half of all traffic stops result in no formal action
            </h3>
            <p class="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Citations are ~40%, while arrests and searches stay below 5%.
            </p>
          </div>

          {#if historicalOutcomes && historicalOutcomes.data.length > 0}
            {@const outcomeColors = { citations: "#095771", arrests: "#2d898b", searches: "#219255", noAction: "#94a3b8" }}
            {@const outcomeLabels = { citations: "Citations", arrests: "Arrests", searches: "Searches", noAction: "No Action" }}
            {@const maxY = Math.ceil(Math.max(...historicalOutcomes.data.flatMap(d => [d.citations, d.arrests, d.searches, d.noAction])) / 10) * 10}
            {@const years = historicalOutcomes.years}
            {@const padding = { top: 15, right: 20, bottom: 30, left: 45 }}
            {@const width = 220}
            {@const height = 120}
            <div class="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
              <svg viewBox="0 0 {width + padding.left + padding.right} {height + padding.top + padding.bottom}" class="w-full max-w-xs flex-1" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="outcomes-chart-title outcomes-chart-desc">
                <title id="outcomes-chart-title">Traffic Stop Outcomes Over Time</title>
                <desc id="outcomes-chart-desc">Line chart showing percentage of traffic stops resulting in citations (approximately 40%), arrests, searches (both below 5%), and no action (approximately 50%) from {years[0]} to {years[years.length - 1]}.</desc>

                <!-- Grid lines -->
                {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                  <line x1={padding.left} y1={padding.top + (1-tick) * height} x2={padding.left + width} y2={padding.top + (1-tick) * height} stroke="#e2e8f0" stroke-width="0.5" aria-hidden="true" />
                {/each}

                <!-- Axes -->
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + height} stroke="#94a3b8" stroke-width="1" aria-hidden="true" />
                <line x1={padding.left} y1={padding.top + height} x2={padding.left + width} y2={padding.top + height} stroke="#94a3b8" stroke-width="1" aria-hidden="true" />

                <!-- Y-axis labels (percentages) -->
                <text x={padding.left - 5} y={padding.top + 4} text-anchor="end" font-size="6" fill="#64748b" aria-hidden="true">{maxY.toFixed(0)}%</text>
                <text x={padding.left - 5} y={padding.top + height/2 + 2} text-anchor="end" font-size="6" fill="#64748b" aria-hidden="true">{(maxY/2).toFixed(0)}%</text>
                <text x={padding.left - 5} y={padding.top + height + 2} text-anchor="end" font-size="6" fill="#64748b" aria-hidden="true">0%</text>

                <!-- X-axis year labels -->
                {#each years as year, i}
                  <text x={padding.left + (i / (years.length - 1)) * width} y={padding.top + height + 12} text-anchor="middle" font-size="6" fill="#64748b" aria-hidden="true">{year}</text>
                {/each}

                <!-- Lines and points for each outcome -->
                {#each ["citations", "arrests", "searches", "noAction"] as outcome}
                  <!-- Line -->
                  <polyline
                    fill="none"
                    stroke={outcomeColors[outcome]}
                    stroke-width="2"
                    points={historicalOutcomes.data.map((d, i) => `${padding.left + (i / (years.length - 1)) * width},${padding.top + (1 - d[outcome] / maxY) * height}`).join(" ")}
                    aria-hidden="true"
                  />
                  <!-- Points with tooltips - keyboard accessible -->
                  {#each historicalOutcomes.data as d, i}
                    <circle
                      cx={padding.left + (i / (years.length - 1)) * width}
                      cy={padding.top + (1 - d[outcome] / maxY) * height}
                      r="4"
                      fill={outcomeColors[outcome]}
                      class="cursor-pointer hover:opacity-70 focus:opacity-70 transition-opacity outline-none"
                      style="outline: none;"
                      tabindex="0"
                      on:mouseenter={(e) => showTooltip(e, `${outcomeLabels[outcome]}: ${Math.round(d[outcome])}% (${d.year})`)}
                      on:mouseleave={hideTooltip}
                      on:focus={(e) => showTooltip(e, `${outcomeLabels[outcome]}: ${Math.round(d[outcome])}% (${d.year})`)}
                      on:blur={hideTooltip}
                      on:keydown={(e) => e.key === 'Escape' && hideTooltip()}
                      role="button"
                      aria-label="{outcomeLabels[outcome]} in {d.year}: {Math.round(d[outcome])}%"
                    />
                  {/each}
                {/each}
              </svg>

              <!-- Legend -->
              <div class="flex flex-wrap justify-center gap-3 mt-2 shrink-0">
                {#each ["citations", "arrests", "searches", "noAction"] as outcome}
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: {outcomeColors[outcome]}"></span>
                    <span class="text-[10px] text-slate-600">{outcomeLabels[outcome]}</span>
                  </span>
                {/each}
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading historical data...</span>
            </div>
          {/if}
        </article>

        <!-- Box 4: Historical Stops by Race - Stacked Column Chart -->
        <article class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7 flex flex-col h-[380px] sm:h-[420px] shadow-sm hover:shadow-md transition-shadow duration-300" role="listitem" aria-labelledby="box4-title">
          <div class="mb-3 sm:mb-4">
            <h3 id="box4-title" class="text-lg sm:text-xl font-bold text-slate-900">
              Racial breakdown of stops has stayed stable over time
            </h3>
            <p class="mt-1 sm:mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
              Black drivers consistently represent 17% despite being 11% of population.
            </p>
          </div>

          {#if historicalByRace && historicalByRace.data.length > 0}
            {@const raceColors = { White: "#095771", Black: "#2d898b", Hispanic: "#219255", Other: "#94a3b8" }}
            {@const raceOrder = ["White", "Black", "Hispanic", "Other"]}
            {@const years = historicalByRace.years}
            {@const padding = { top: 15, right: 20, bottom: 30, left: 45 }}
            {@const width = 220}
            {@const height = 120}
            {@const barWidth = (width - (years.length - 1) * 12) / years.length}
            <div class="flex-1 flex flex-col items-center justify-center min-h-0 w-full">
              <svg viewBox="0 0 {width + padding.left + padding.right} {height + padding.top + padding.bottom}" class="w-full max-w-xs flex-1" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="race-chart-title race-chart-desc">
                <title id="race-chart-title">Racial Breakdown of Traffic Stops Over Time</title>
                <desc id="race-chart-desc">Stacked bar chart showing the racial composition of traffic stops from {years[0]} to {years[years.length - 1]}. Black drivers consistently represent approximately 17% of stops despite being 11% of Missouri's population.</desc>

                <!-- Grid lines -->
                {#each [0, 0.25, 0.5, 0.75, 1] as tick}
                  <line x1={padding.left} y1={padding.top + (1-tick) * height} x2={padding.left + width} y2={padding.top + (1-tick) * height} stroke="#e2e8f0" stroke-width="0.5" aria-hidden="true" />
                {/each}

                <!-- Axes -->
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + height} stroke="#94a3b8" stroke-width="1" aria-hidden="true" />
                <line x1={padding.left} y1={padding.top + height} x2={padding.left + width} y2={padding.top + height} stroke="#94a3b8" stroke-width="1" aria-hidden="true" />

                <!-- Y-axis labels (percentages) -->
                <text x={padding.left - 5} y={padding.top + 4} text-anchor="end" font-size="6" fill="#64748b" aria-hidden="true">100%</text>
                <text x={padding.left - 5} y={padding.top + height/2 + 2} text-anchor="end" font-size="6" fill="#64748b" aria-hidden="true">50%</text>
                <text x={padding.left - 5} y={padding.top + height + 2} text-anchor="end" font-size="6" fill="#64748b" aria-hidden="true">0%</text>

                <!-- Stacked bars for each year -->
                {#each historicalByRace.data as d, i}
                  {@const barX = padding.left + i * (barWidth + 12)}
                  {@const segments = []}
                  {#each raceOrder as race, raceIdx}
                    {@const prevTotal = raceOrder.slice(0, raceIdx).reduce((sum, r) => sum + (d[r] || 0), 0)}
                    {@const segmentHeight = (d[race] / 100) * height}
                    {@const segmentY = padding.top + height - ((prevTotal + d[race]) / 100) * height}
                    <rect
                      x={barX}
                      y={segmentY}
                      width={barWidth}
                      height={segmentHeight}
                      fill={raceColors[race]}
                      class="cursor-pointer hover:opacity-70 focus:opacity-70 transition-opacity outline-none"
                      tabindex="0"
                      on:mouseenter={(e) => showTooltip(e, `${race}: ${Math.round(d[race])}% (${d.year})`)}
                      on:mouseleave={hideTooltip}
                      on:focus={(e) => showTooltip(e, `${race}: ${Math.round(d[race])}% (${d.year})`)}
                      on:blur={hideTooltip}
                      on:keydown={(e) => e.key === 'Escape' && hideTooltip()}
                      role="button"
                      aria-label="{race} drivers: {Math.round(d[race])}% of stops in {d.year}"
                    />
                  {/each}
                  <!-- Year label -->
                  <text x={barX + barWidth/2} y={padding.top + height + 12} text-anchor="middle" font-size="6" fill="#64748b" aria-hidden="true">{d.year}</text>
                {/each}
              </svg>

              <!-- Legend -->
              <div class="flex flex-wrap justify-center gap-3 mt-2 shrink-0">
                {#each ["White", "Black", "Hispanic", "Other"] as race}
                  <span class="flex items-center gap-1">
                    <span class="w-2.5 h-2.5 rounded-sm" style="background-color: {raceColors[race]}"></span>
                    <span class="text-[10px] text-slate-600">{race}</span>
                  </span>
                {/each}
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading historical data...</span>
            </div>
          {/if}
        </article>
      </div>
    </div>
  </section>

  <!-- Download Section -->
  <section id="download" class="border-t border-slate-200 bg-white py-12">
    <div class="mx-auto max-w-4xl px-6">
      <h2 class="mb-6 text-center text-3xl font-bold text-slate-900">
        {m.home_toc_download()}
      </h2>
      <p class="mb-8 text-center text-lg text-slate-700">
        Download the complete Missouri Vehicle Stop Report dataset for your own analysis.
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <div class="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
          <h3 class="mb-3 text-xl font-bold text-slate-900">
            Agency Index
          </h3>
          <p class="mb-4 text-slate-600">
            Complete list of all law enforcement agencies in Missouri with summary statistics.
          </p>
          <a
            href="/data/dist/agency_index.json"
            download="agency_index.json"
            aria-label="Download Agency Index data as JSON file"
            class="inline-block rounded-lg bg-[#2c9166] px-6 py-3 font-semibold text-white no-underline transition-colors hover:bg-[#216d4d] focus:outline-none focus:ring-2 focus:ring-[#2c9166] focus:ring-offset-2"
          >
            Download JSON
          </a>
        </div>

        <div class="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
          <h3 class="mb-3 text-xl font-bold text-slate-900">
            Full Dataset
          </h3>
          <p class="mb-4 text-slate-600">
            Raw vehicle stop records by agency and year, including demographics and outcomes.
          </p>
          <span
            aria-label="Full dataset download coming soon"
            class="inline-block rounded-lg border-2 border-[#2c9166] bg-white px-6 py-3 font-semibold text-[#2c9166] cursor-not-allowed opacity-60"
          >
            Coming soon
          </span>
        </div>
      </div>

      <div class="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h3 class="mb-3 font-semibold text-slate-900">
          Data format and usage
        </h3>
        <ul class="space-y-2 text-sm text-slate-600 list-disc list-inside">
          <li>Data is provided in JSON format</li>
          <li>Includes agency metadata, stop counts, demographics, and detailed metrics</li>
          <li>Free to use for journalism, research, and public interest projects</li>
          <li>Attribution appreciated when using this data</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- About the Data -->
  <section id="about" class="border-t border-slate-200 bg-slate-50 py-12">
    <div class="mx-auto max-w-4xl px-6">
      <div class="prose prose-slate max-w-none prose-headings:text-slate-900 prose-h1:text-3xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-p:text-slate-700 prose-p:leading-relaxed prose-ul:text-slate-700 prose-li:text-slate-700">
        {@html data.aboutDataHtml}
      </div>

      <div class="mt-12 rounded-lg border-2 border-green-100 bg-green-50 p-6">
        <p class="mb-4 text-lg font-semibold text-slate-900">
          {m.home_footer_cta()}
        </p>
        <a
          id="donate"
          href="mailto:contact@example.com"
          class="inline-block rounded-lg bg-[#2c9166] px-6 py-3 font-semibold text-white no-underline transition-colors hover:bg-[#216d4d]"
        >
          {m.home_footer_contact()}
        </a>
      </div>
    </div>
  </section>
</main>

<!-- Global tooltip - accessible live region -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  {tooltip.show ? tooltip.content : ''}
</div>
{#if tooltip.show}
  <div
    class="fixed z-50 px-2 py-1 text-xs font-medium text-white bg-slate-800 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap"
    style="left: {tooltip.x}px; top: {tooltip.y}px;"
    aria-hidden="true"
  >
    {tooltip.content}
    <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
  </div>
{/if}
