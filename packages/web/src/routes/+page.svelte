<script>
  import StickyHeader from "$lib/components/StickyHeader.svelte";
  import LocationPicker from "$lib/components/LocationPicker.svelte";
  import * as m from "$lib/paraglide/messages";
  import { onMount } from "svelte";

  export let data;

  let selectedLocation = null;
  let aboutDataHtml = "";
  let statsData = null;
  let scatterData = null;

  onMount(async () => {
    try {
      // Fetch HTML file client-side only
      const response = await fetch("/content/about-the-data.html");
      if (response.ok) {
        aboutDataHtml = await response.text();
      }
    } catch (error) {
      console.error("Failed to load about data:", error);
    }

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
      // Fetch scatter plot data
      const metricResponse = await fetch("/data/metric_year_subset.json");
      if (metricResponse.ok) {
        const metricData = await metricResponse.json();
        const yearIndex = metricData.years.indexOf(2024);
        // Row format: [agency_index, year_index, Total, White, Black, ...]
        // So Total is at index 2 (after agency_index and year_index)
        const totalColOffset = 2;

        // Build maps for each metric
        const searchesMap = new Map();
        const contrabandMap = new Map();
        const stopsMap = new Map();

        (metricData.rows["rates-by-race--totals--searches"] || []).forEach(row => {
          if (row[1] === yearIndex) searchesMap.set(row[0], row[totalColOffset]);
        });
        (metricData.rows["rates-by-race--totals--contraband"] || []).forEach(row => {
          if (row[1] === yearIndex) contrabandMap.set(row[0], row[totalColOffset]);
        });
        (metricData.rows["rates-by-race--totals--all-stops"] || []).forEach(row => {
          if (row[1] === yearIndex) stopsMap.set(row[0], row[totalColOffset]);
        });

        // Compute rates for each agency
        const points = [];
        searchesMap.forEach((searches, agencyIdx) => {
          const stops = stopsMap.get(agencyIdx) || 0;
          const contraband = contrabandMap.get(agencyIdx) || 0;
          if (stops > 100 && searches > 0) {
            const searchRate = (searches / stops) * 100;
            const hitRate = (contraband / searches) * 100;
            if (searchRate > 0 && searchRate < 50 && hitRate >= 0 && hitRate < 100) {
              points.push({ searchRate, hitRate, agency: metricData.agencies[agencyIdx] });
            }
          }
        });
        scatterData = points;
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

<main class="min-h-screen bg-white">
  <!-- Hero Section -->
  <section id="search" class="bg-white px-6 py-10 md:py-16">
    <div class="mx-auto max-w-4xl">
      <div class="text-center">
        <h1 class="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl">
          {m.home_hero_headline()}
        </h1>
        <p class="mt-3 text-xl text-slate-600">
          {m.home_hero_subheadline()}
        </p>
      </div>

      <div class="mx-auto mt-8 max-w-xl">
        <LocationPicker agencies={data.agencies} onSelect={handleLocationSelect} />
      </div>

      {#if selectedLocation}
        <div class="mt-6 animate-in fade-in duration-300">
          <div class="mx-auto max-w-2xl rounded-lg border-2 border-[#28AF57] bg-green-50 px-6 py-5 text-center">
            <p class="text-xl font-semibold text-slate-900">
              {displayStat}
            </p>
          </div>
        </div>
      {:else}
        <div class="mt-6 text-center">
          <p class="text-lg text-slate-600">
            {displayStat}
          </p>
        </div>
      {/if}
    </div>
  </section>

  <!-- Why It Matters -->
  <section class="bg-white py-10">
    <div class="mx-auto max-w-3xl px-6">
      <p class="text-lg leading-relaxed text-slate-700">
        {m.home_why_text()}
      </p>
    </div>
  </section>

  <!-- Highlights Grid -->
  <section class="border-t border-slate-200 bg-slate-50 py-12">
    <div class="mx-auto max-w-6xl px-6">
      <h2 class="mb-8 text-center text-3xl font-bold text-slate-900">
        {m.home_highlights_heading()}
      </h2>

      <div class="grid gap-6 md:grid-cols-2 md:grid-rows-2 md:auto-rows-fr">
        <!-- Box 1: Who Gets Stopped - Bar Chart -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 flex flex-col min-h-[360px]">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              Black drivers were 17% of total stops in 2024, but are only 11% of Missouri's population
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Statewide, Black Missourians are stopped at nearly double their population share—{#if statsData}{formatStops(statsData.by_race.all_stops.Black)}{/if} of {#if statsData}{formatStops(statsData.total_stops)}{/if} total stops.
            </p>
          </div>

          {#if statsData}
            <div class="space-y-3 flex-grow">
              <!-- White drivers -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-slate-700">White drivers</span>
                  <div class="text-right">
                    <span class="text-lg font-bold text-slate-900">
                      {((statsData.by_race.all_stops.White / statsData.total_stops) * 100).toFixed(1)}%
                    </span>
                    <span class="ml-2 text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.White)}</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100">
                  <div
                    class="h-2 bg-[#095771]"
                    style="width: {((statsData.by_race.all_stops.White / statsData.total_stops) * 100).toFixed(1)}%"
                  ></div>
                </div>
              </div>

              <!-- Black drivers -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-slate-700">Black drivers</span>
                  <div class="text-right">
                    <span class="text-lg font-bold text-slate-900">
                      {((statsData.by_race.all_stops.Black / statsData.total_stops) * 100).toFixed(1)}%
                    </span>
                    <span class="ml-2 text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.Black)}</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100">
                  <div
                    class="h-2 bg-[#2d898b]"
                    style="width: {((statsData.by_race.all_stops.Black / statsData.total_stops) * 100).toFixed(1)}%"
                  ></div>
                </div>
              </div>

              <!-- Hispanic drivers -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-slate-700">Hispanic drivers</span>
                  <div class="text-right">
                    <span class="text-lg font-bold text-slate-900">
                      {((statsData.by_race.all_stops.Hispanic / statsData.total_stops) * 100).toFixed(1)}%
                    </span>
                    <span class="ml-2 text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.Hispanic)}</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100">
                  <div
                    class="h-2 bg-[#219255]"
                    style="width: {((statsData.by_race.all_stops.Hispanic / statsData.total_stops) * 100).toFixed(1)}%"
                  ></div>
                </div>
              </div>

              <!-- Asian drivers -->
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-slate-700">Asian drivers</span>
                  <div class="text-right">
                    <span class="text-lg font-bold text-slate-900">
                      {((statsData.by_race.all_stops.Asian / statsData.total_stops) * 100).toFixed(1)}%
                    </span>
                    <span class="ml-2 text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.Asian)}</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100">
                  <div
                    class="h-2 bg-[#20a547]"
                    style="width: {((statsData.by_race.all_stops.Asian / statsData.total_stops) * 100).toFixed(1)}%"
                  ></div>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading data...</span>
            </div>
          {/if}
        </div>

        <!-- Box 2: Search Rate vs Hit Rate Scatter -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 flex flex-col min-h-[360px]">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              Officers searched 4.8% of stopped drivers, but found contraband in only 1 in 5 of those searches
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Each dot represents an agency. Agencies with higher search rates don't necessarily find more contraband—the search paradox in action.
            </p>
          </div>

          <div class="flex-grow flex flex-col justify-center">
            {#if scatterData && scatterData.length > 0}
              {@const maxX = Math.max(...scatterData.map(d => d.searchRate), 10)}
              {@const maxY = Math.max(...scatterData.map(d => d.hitRate), 30)}
              {@const padding = { top: 20, right: 20, bottom: 35, left: 45 }}
              {@const width = 100}
              {@const height = 100}
              <svg viewBox="0 0 {width + padding.left + padding.right} {height + padding.top + padding.bottom}" class="w-full h-48">
                <!-- Grid lines -->
                {#each [0, 25, 50, 75, 100] as tick}
                  <line
                    x1={padding.left}
                    y1={padding.top + (1 - tick/100) * height}
                    x2={padding.left + width}
                    y2={padding.top + (1 - tick/100) * height}
                    stroke="#e2e8f0"
                    stroke-width="0.5"
                  />
                {/each}

                <!-- Y-axis -->
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + height} stroke="#94a3b8" stroke-width="1" />
                <!-- X-axis -->
                <line x1={padding.left} y1={padding.top + height} x2={padding.left + width} y2={padding.top + height} stroke="#94a3b8" stroke-width="1" />

                <!-- Y-axis labels -->
                <text x={padding.left - 5} y={padding.top + 4} text-anchor="end" font-size="6" fill="#64748b">{maxY.toFixed(0)}%</text>
                <text x={padding.left - 5} y={padding.top + height/2 + 2} text-anchor="end" font-size="6" fill="#64748b">{(maxY/2).toFixed(0)}%</text>
                <text x={padding.left - 5} y={padding.top + height + 2} text-anchor="end" font-size="6" fill="#64748b">0%</text>

                <!-- X-axis labels -->
                <text x={padding.left} y={padding.top + height + 12} text-anchor="middle" font-size="6" fill="#64748b">0%</text>
                <text x={padding.left + width/2} y={padding.top + height + 12} text-anchor="middle" font-size="6" fill="#64748b">{(maxX/2).toFixed(0)}%</text>
                <text x={padding.left + width} y={padding.top + height + 12} text-anchor="middle" font-size="6" fill="#64748b">{maxX.toFixed(0)}%</text>

                <!-- Axis titles -->
                <text x={padding.left + width/2} y={padding.top + height + 26} text-anchor="middle" font-size="7" fill="#475569" font-weight="500">Search Rate</text>
                <text x={12} y={padding.top + height/2} text-anchor="middle" font-size="7" fill="#475569" font-weight="500" transform="rotate(-90, 12, {padding.top + height/2})">Hit Rate</text>

                <!-- Data points -->
                {#each scatterData as point}
                  <circle
                    cx={padding.left + (point.searchRate / maxX) * width}
                    cy={padding.top + (1 - point.hitRate / maxY) * height}
                    r="2"
                    fill="rgba(45, 137, 139, 0.5)"
                    stroke="rgba(45, 137, 139, 0.8)"
                    stroke-width="0.5"
                  />
                {/each}
              </svg>
              <p class="text-center text-[10px] text-slate-500 mt-1">{scatterData.length} agencies shown</p>
            {:else}
              <div class="flex h-48 items-center justify-center">
                <span class="text-sm text-slate-400">Loading scatter data...</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Box 3: Outcomes Flow - Stacked Column Chart -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 flex flex-col min-h-[360px]">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              Of {#if statsData}{formatStops(statsData.total_stops)}{/if} traffic stops, half resulted in no formal action at all
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Officers issued citations in 41% of cases, made arrests in 4%, and conducted searches in 5%. The remaining stops ended with no citation, arrest, or search.
            </p>
          </div>

          {#if statsData}
            {@const maxHeight = 120}
            {@const noActionRate = 100 - statsData.summary.citation_rate - statsData.summary.arrest_rate - statsData.summary.search_rate}
            {@const maxRate = Math.max(statsData.summary.citation_rate, noActionRate)}
            <div class="flex-grow flex flex-col justify-center">
              <!-- Vertical stacked columns -->
              <div class="flex items-end justify-center gap-8">
                <!-- Citations column -->
                <div class="flex flex-col items-center">
                  <div class="text-xs font-bold text-slate-700 mb-1">{statsData.summary.citation_rate.toFixed(0)}%</div>
                  <div
                    class="w-16 bg-[#227f63] rounded-t transition-all duration-500"
                    style="height: {(statsData.summary.citation_rate / maxRate) * maxHeight}px"
                  ></div>
                  <div class="mt-2 text-[10px] text-slate-600 text-center font-medium">Citations</div>
                  <div class="text-[9px] text-slate-500">{formatStops(statsData.by_race.citations.Total)}</div>
                </div>

                <!-- Searches column -->
                <div class="flex flex-col items-center">
                  <div class="text-xs font-bold text-slate-700 mb-1">{statsData.summary.search_rate.toFixed(1)}%</div>
                  <div
                    class="w-16 bg-[#2d898b] rounded-t transition-all duration-500"
                    style="height: {(statsData.summary.search_rate / maxRate) * maxHeight}px"
                  ></div>
                  <div class="mt-2 text-[10px] text-slate-600 text-center font-medium">Searches</div>
                  <div class="text-[9px] text-slate-500">{formatStops(statsData.by_race.searches.Total)}</div>
                </div>

                <!-- Arrests column -->
                <div class="flex flex-col items-center">
                  <div class="text-xs font-bold text-slate-700 mb-1">{statsData.summary.arrest_rate.toFixed(1)}%</div>
                  <div
                    class="w-16 bg-[#095771] rounded-t transition-all duration-500"
                    style="height: {(statsData.summary.arrest_rate / maxRate) * maxHeight}px"
                  ></div>
                  <div class="mt-2 text-[10px] text-slate-600 text-center font-medium">Arrests</div>
                  <div class="text-[9px] text-slate-500">{formatStops(statsData.by_race.arrests.Total)}</div>
                </div>

                <!-- No action column -->
                <div class="flex flex-col items-center">
                  <div class="text-xs font-bold text-slate-700 mb-1">{noActionRate.toFixed(0)}%</div>
                  <div
                    class="w-16 bg-slate-300 rounded-t transition-all duration-500"
                    style="height: {(noActionRate / maxRate) * maxHeight}px"
                  ></div>
                  <div class="mt-2 text-[10px] text-slate-600 text-center font-medium">No Action</div>
                  <div class="text-[9px] text-slate-500">{formatStops(statsData.total_stops - statsData.by_race.citations.Total - statsData.by_race.arrests.Total - statsData.by_race.searches.Total)}</div>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading data...</span>
            </div>
          {/if}
        </div>

        <!-- Box 4: Arrest Rate Comparison - Horizontal Lollipop -->
        <div class="rounded-lg border border-slate-200 bg-white p-6 flex flex-col min-h-[360px]">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              Black drivers were arrested at nearly double the rate of white drivers after traffic stops
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              {#if statsData}Black drivers faced arrest {((statsData.by_race.arrests.Black / statsData.by_race.all_stops.Black) * 100).toFixed(1)}% of the time, compared to {((statsData.by_race.arrests.White / statsData.by_race.all_stops.White) * 100).toFixed(1)}% for white drivers. Hispanic drivers were arrested at {((statsData.by_race.arrests.Hispanic / statsData.by_race.all_stops.Hispanic) * 100).toFixed(1)}%.{/if}
            </p>
          </div>

          {#if statsData}
            {@const blackRate = (statsData.by_race.arrests.Black / statsData.by_race.all_stops.Black) * 100}
            {@const hispanicRate = (statsData.by_race.arrests.Hispanic / statsData.by_race.all_stops.Hispanic) * 100}
            {@const whiteRate = (statsData.by_race.arrests.White / statsData.by_race.all_stops.White) * 100}
            {@const maxRate = Math.max(blackRate, hispanicRate, whiteRate) * 1.15}
            <div class="flex-grow flex flex-col justify-center space-y-5 px-2">
              <!-- Black drivers -->
              <div class="flex items-center gap-3">
                <div class="w-20 text-right text-xs font-medium text-slate-600 shrink-0">Black</div>
                <div class="flex-1 relative h-6 flex items-center">
                  <div class="absolute inset-y-2.5 left-0 right-0 bg-slate-100 rounded-full h-1"></div>
                  <div
                    class="absolute inset-y-2.5 left-0 rounded-full h-1 bg-[#2d898b] transition-all duration-500"
                    style="width: {(blackRate / maxRate) * 100}%"
                  ></div>
                  <div
                    class="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-[#2d898b] transition-all duration-500"
                    style="left: calc({(blackRate / maxRate) * 100}% - 8px)"
                  ></div>
                </div>
                <div class="w-16 text-right shrink-0">
                  <span class="text-sm font-bold text-[#2d898b]">{blackRate.toFixed(1)}%</span>
                </div>
              </div>

              <!-- Hispanic drivers -->
              <div class="flex items-center gap-3">
                <div class="w-20 text-right text-xs font-medium text-slate-600 shrink-0">Hispanic</div>
                <div class="flex-1 relative h-6 flex items-center">
                  <div class="absolute inset-y-2.5 left-0 right-0 bg-slate-100 rounded-full h-1"></div>
                  <div
                    class="absolute inset-y-2.5 left-0 rounded-full h-1 bg-[#219255] transition-all duration-500"
                    style="width: {(hispanicRate / maxRate) * 100}%"
                  ></div>
                  <div
                    class="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-[#219255] transition-all duration-500"
                    style="left: calc({(hispanicRate / maxRate) * 100}% - 8px)"
                  ></div>
                </div>
                <div class="w-16 text-right shrink-0">
                  <span class="text-sm font-bold text-[#219255]">{hispanicRate.toFixed(1)}%</span>
                </div>
              </div>

              <!-- White drivers -->
              <div class="flex items-center gap-3">
                <div class="w-20 text-right text-xs font-medium text-slate-600 shrink-0">White</div>
                <div class="flex-1 relative h-6 flex items-center">
                  <div class="absolute inset-y-2.5 left-0 right-0 bg-slate-100 rounded-full h-1"></div>
                  <div
                    class="absolute inset-y-2.5 left-0 rounded-full h-1 bg-[#095771] transition-all duration-500"
                    style="width: {(whiteRate / maxRate) * 100}%"
                  ></div>
                  <div
                    class="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm bg-[#095771] transition-all duration-500"
                    style="left: calc({(whiteRate / maxRate) * 100}% - 8px)"
                  ></div>
                </div>
                <div class="w-16 text-right shrink-0">
                  <span class="text-sm font-bold text-[#095771]">{whiteRate.toFixed(1)}%</span>
                </div>
              </div>

              <!-- Scale and overall rate -->
              <div class="mt-4 pt-4 border-t border-slate-100">
                <div class="flex items-center justify-between text-[10px] text-slate-400 px-[92px] mb-3">
                  <span>0%</span>
                  <span>{(maxRate / 2).toFixed(1)}%</span>
                  <span>{maxRate.toFixed(1)}%</span>
                </div>
                <div class="text-center">
                  <span class="text-xs text-slate-500">Overall arrest rate: </span>
                  <span class="text-sm font-bold text-slate-700">{statsData.summary.arrest_rate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading data...</span>
            </div>
          {/if}
        </div>
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
            href="/data/agency_index.json"
            download
            class="inline-block rounded-lg bg-[#28AF57] px-6 py-3 font-semibold text-white no-underline transition-colors hover:bg-[#229647]"
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
          <a
            href="/data/agency_index.json"
            download
            class="inline-block rounded-lg border-2 border-[#28AF57] bg-white px-6 py-3 font-semibold text-[#28AF57] no-underline transition-colors hover:bg-green-50"
          >
            Coming soon
          </a>
        </div>
      </div>

      <div class="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h3 class="mb-3 font-semibold text-slate-900">
          Data format and usage
        </h3>
        <ul class="space-y-2 text-sm text-slate-600">
          <li>• Data is provided in JSON format</li>
          <li>• Includes agency metadata, stop counts, demographics, and detailed metrics</li>
          <li>• Free to use for journalism, research, and public interest projects</li>
          <li>• Attribution appreciated when using this data</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- About the Data -->
  <section id="about" class="border-t border-slate-200 bg-slate-50 py-12">
    <div class="mx-auto max-w-4xl px-6">
      <div class="prose prose-slate max-w-none prose-headings:text-slate-900 prose-h1:text-3xl prose-h1:font-bold prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-8 prose-p:text-slate-700 prose-p:leading-relaxed prose-ul:text-slate-700 prose-li:text-slate-700">
        {@html aboutDataHtml}
      </div>

      <div class="mt-12 rounded-lg border-2 border-green-100 bg-green-50 p-6">
        <p class="mb-4 text-lg font-semibold text-slate-900">
          {m.home_footer_cta()}
        </p>
        <a
          id="donate"
          href="mailto:contact@example.com"
          class="inline-block rounded-lg bg-[#28AF57] px-6 py-3 font-semibold text-white no-underline transition-colors hover:bg-[#229647]"
        >
          {m.home_footer_contact()}
        </a>
      </div>
    </div>
  </section>
</main>
