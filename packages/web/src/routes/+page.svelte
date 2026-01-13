<script>
  import StickyHeader from "$lib/components/StickyHeader.svelte";
  import LocationPicker from "$lib/components/LocationPicker.svelte";
  import AgencyRateScatter from "$lib/components/AgencyRateScatter.svelte";
  import * as m from "$lib/paraglide/messages";
  import { onMount } from "svelte";

  export let data;

  let selectedLocation = null;
  let aboutDataHtml = "";
  let statsData = null;

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
  });

  const formatStops = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return "0";
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

<StickyHeader />

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

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Box 1: Who Gets Stopped - Bar Chart -->
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              Black Drivers: 17% of Stops, 11% of Population
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              In Berkeley, 86% of stops were Black drivers. Statewide, Black Missourians are stopped at nearly double their population share—{#if statsData}{formatStops(statsData.by_race.all_stops.Black)}{/if} of {#if statsData}{formatStops(statsData.total_stops)}{/if} total stops.
            </p>
          </div>

          {#if statsData}
            <div class="space-y-3">
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
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              4.8% of Stops Searched, 21.8% Find Contraband
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Each dot represents an agency. Notice how agencies with higher search rates (moving right) don't necessarily find more contraband (moving up)—the search paradox in action.
            </p>
          </div>

          <AgencyRateScatter
            selectedYear={2024}
            title=""
            xLabel="Search Rate (%)"
            yLabel="Hit Rate (%)"
            xMetricKey="rates-by-race--rates--search-rate"
            yMetricKey="rates-by-race--rates--contraband-hit-rate"
            xColumn="Total"
            yColumn="Total"
            sizeByStops={false}
            showMeanLines={true}
            dotRadiusScale={0.7}
          />
        </div>

        <!-- Box 3: Outcomes Flow - Stacked Bar -->
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              532K Citations, 49K Arrests from 1.3M Stops
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              From {#if statsData}{formatStops(statsData.total_stops)}{/if} traffic stops in 2024, officers issued citations in 41% of cases, made arrests in 4%, conducted searches in 5%, and took no formal action in half of all stops.
            </p>
          </div>

          {#if statsData}
            <div class="space-y-6">
              <!-- Stacked horizontal bar -->
              <div class="relative h-16 w-full flex overflow-hidden rounded">
                <!-- Citations: 41.5% -->
                <div
                  class="flex items-center justify-center bg-[#227f63] text-white"
                  style="width: {statsData.summary.citation_rate.toFixed(1)}%"
                >
                  <div class="text-center px-2">
                    <div class="text-sm font-bold">Citations</div>
                    <div class="text-xs">{statsData.summary.citation_rate.toFixed(1)}%</div>
                  </div>
                </div>
                <!-- Arrests: 3.9% -->
                <div
                  class="flex items-center justify-center bg-[#095771] text-white"
                  style="width: {statsData.summary.arrest_rate.toFixed(1)}%"
                >
                  <div class="text-center px-1">
                    <div class="text-[10px] font-bold">Arrests</div>
                    <div class="text-[9px]">{statsData.summary.arrest_rate.toFixed(1)}%</div>
                  </div>
                </div>
                <!-- Searches: 4.8% -->
                <div
                  class="flex items-center justify-center bg-[#2d898b] text-white"
                  style="width: {statsData.summary.search_rate.toFixed(1)}%"
                >
                  <div class="text-center px-1">
                    <div class="text-[10px] font-bold">Searches</div>
                    <div class="text-[9px]">{statsData.summary.search_rate.toFixed(1)}%</div>
                  </div>
                </div>
                <!-- No action: remainder -->
                <div
                  class="flex items-center justify-center bg-slate-200 text-slate-600"
                  style="width: {(100 - statsData.summary.citation_rate - statsData.summary.arrest_rate - statsData.summary.search_rate).toFixed(1)}%"
                >
                  <div class="text-center px-2">
                    <div class="text-sm font-bold">No Action</div>
                    <div class="text-xs">{(100 - statsData.summary.citation_rate - statsData.summary.arrest_rate - statsData.summary.search_rate).toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <!-- Legend with actual counts -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 bg-[#227f63]"></div>
                  <span><span class="font-bold">{formatStops(statsData.by_race.citations.Total)}</span> citations issued</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 bg-[#095771]"></div>
                  <span><span class="font-bold">{formatStops(statsData.by_race.arrests.Total)}</span> arrests made</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 bg-[#2d898b]"></div>
                  <span><span class="font-bold">{formatStops(statsData.by_race.searches.Total)}</span> searches conducted</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 bg-slate-200"></div>
                  <span><span class="font-bold">{formatStops(statsData.total_stops - statsData.by_race.citations.Total - statsData.by_race.arrests.Total - statsData.by_race.searches.Total)}</span> no formal action</span>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading data...</span>
            </div>
          {/if}
        </div>

        <!-- Box 4: Arrest Rate Comparison - Donut Chart -->
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              Black Drivers Arrested at 5.8%—Nearly Double White Drivers
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              When officers make traffic stops, arrest rates vary significantly by race. Black and Hispanic drivers face arrest at rates nearly double that of white drivers—{#if statsData}{((statsData.by_race.arrests.Black / statsData.by_race.all_stops.Black) * 100).toFixed(1)}%{/if} and {#if statsData}{((statsData.by_race.arrests.Hispanic / statsData.by_race.all_stops.Hispanic) * 100).toFixed(1)}%{/if} compared to {#if statsData}{((statsData.by_race.arrests.White / statsData.by_race.all_stops.White) * 100).toFixed(1)}%{/if}.
            </p>
          </div>

          {#if statsData}
            <div class="space-y-6">
              <!-- Circular comparison visualization -->
              <div class="flex items-center justify-center gap-6">
                <!-- Black drivers -->
                <div class="text-center">
                  <div class="relative mx-auto h-24 w-24">
                    <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <!-- Background circle -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e2e8f0"
                        stroke-width="12"
                        fill="none"
                      />
                      <!-- Progress circle -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#2d898b"
                        stroke-width="12"
                        fill="none"
                        stroke-dasharray="{(((statsData.by_race.arrests.Black / statsData.by_race.all_stops.Black) * 100) / 100) * 251.2} 251.2"
                        stroke-linecap="round"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xl font-bold text-[#2d898b]">
                        {((statsData.by_race.arrests.Black / statsData.by_race.all_stops.Black) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 text-xs font-medium text-slate-700">Black drivers</div>
                  <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.arrests.Black)} arrests</div>
                </div>

                <!-- Hispanic drivers -->
                <div class="text-center">
                  <div class="relative mx-auto h-24 w-24">
                    <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <!-- Background circle -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e2e8f0"
                        stroke-width="12"
                        fill="none"
                      />
                      <!-- Progress circle -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#219255"
                        stroke-width="12"
                        fill="none"
                        stroke-dasharray="{(((statsData.by_race.arrests.Hispanic / statsData.by_race.all_stops.Hispanic) * 100) / 100) * 251.2} 251.2"
                        stroke-linecap="round"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xl font-bold text-[#219255]">
                        {((statsData.by_race.arrests.Hispanic / statsData.by_race.all_stops.Hispanic) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 text-xs font-medium text-slate-700">Hispanic drivers</div>
                  <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.arrests.Hispanic)} arrests</div>
                </div>

                <!-- White drivers -->
                <div class="text-center">
                  <div class="relative mx-auto h-24 w-24">
                    <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <!-- Background circle -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#e2e8f0"
                        stroke-width="12"
                        fill="none"
                      />
                      <!-- Progress circle -->
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="#095771"
                        stroke-width="12"
                        fill="none"
                        stroke-dasharray="{(((statsData.by_race.arrests.White / statsData.by_race.all_stops.White) * 100) / 100) * 251.2} 251.2"
                        stroke-linecap="round"
                      />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <span class="text-xl font-bold text-[#095771]">
                        {((statsData.by_race.arrests.White / statsData.by_race.all_stops.White) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 text-xs font-medium text-slate-700">White drivers</div>
                  <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.arrests.White)} arrests</div>
                </div>
              </div>

              <!-- Overall arrest rate -->
              <div class="rounded-lg bg-slate-50 p-4 text-center">
                <div class="text-3xl font-extrabold text-slate-900">
                  {statsData.summary.arrest_rate.toFixed(1)}%
                </div>
                <div class="mt-1 text-xs text-slate-600">
                  Overall arrest rate across all {statsData.agency_count} agencies
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
