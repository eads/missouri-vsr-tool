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
        <!-- Box 1: Who Gets Stopped -->
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            {#if statsData}
              <div class="mb-1 text-4xl font-extrabold text-slate-900">
                {formatStops(statsData.total_stops)}
              </div>
              <h3 class="text-lg font-bold text-slate-700">
                Traffic Stops in 2024
              </h3>
            {:else}
              <h3 class="text-xl font-bold text-slate-900">
                Who Gets Stopped
              </h3>
            {/if}
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              In Berkeley, 86% of stops were Black drivers. Statewide, the pattern is clear: Black Missourians are stopped at nearly double their population share.
            </p>
          </div>

          {#if statsData}
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center rounded-lg bg-slate-50 p-4">
                <div class="text-3xl font-extrabold text-[#095771]">
                  {((statsData.by_race.all_stops.White / statsData.total_stops) * 100).toFixed(1)}%
                </div>
                <div class="mt-1 text-xs font-medium text-slate-600">White drivers</div>
                <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.White)} stops</div>
              </div>

              <div class="text-center rounded-lg bg-slate-50 p-4">
                <div class="text-3xl font-extrabold text-[#2d898b]">
                  {((statsData.by_race.all_stops.Black / statsData.total_stops) * 100).toFixed(1)}%
                </div>
                <div class="mt-1 text-xs font-medium text-slate-600">Black drivers</div>
                <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.Black)} stops</div>
              </div>

              <div class="text-center rounded-lg bg-slate-50 p-4">
                <div class="text-3xl font-extrabold text-[#219255]">
                  {((statsData.by_race.all_stops.Hispanic / statsData.total_stops) * 100).toFixed(1)}%
                </div>
                <div class="mt-1 text-xs font-medium text-slate-600">Hispanic drivers</div>
                <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.Hispanic)} stops</div>
              </div>

              <div class="text-center rounded-lg bg-slate-50 p-4">
                <div class="text-3xl font-extrabold text-[#20a547]">
                  {((statsData.by_race.all_stops.Asian / statsData.total_stops) * 100).toFixed(1)}%
                </div>
                <div class="mt-1 text-xs font-medium text-slate-600">Asian drivers</div>
                <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.all_stops.Asian)} stops</div>
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
              The Search Paradox
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Agencies that search more often don't find more contraband. Each dot is an agency—notice how higher search rates (right) don't lead to higher hit rates (up).
            </p>
          </div>

          <AgencyRateScatter
            selectedYear={2024}
            title=""
            xLabel="Search Rate (%)"
            yLabel="Hit Rate (%)"
            xMetricKey="rates-by-race--totals--searches-rate"
            yMetricKey="rates-by-race--totals--contraband-hit-rate"
            xColumn="Total"
            yColumn="Total"
            xCountKey="rates-by-race--totals--searches"
            xCountColumn="Total"
            yCountKey="rates-by-race--totals--contraband"
            yCountColumn="Total"
            sizeByStops={false}
            showMeanLines={false}
            dotRadiusScale={0.7}
          />
        </div>

        <!-- Box 3: How Stops End - Outcomes -->
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              When Stops Turn Serious
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Most stops end with a citation or warning. But Black drivers face arrest at nearly double the rate: 5.8% compared to 3.4% for white drivers.
            </p>
          </div>

          {#if statsData}
            <div class="space-y-4">
              <div class="grid grid-cols-3 gap-3">
                <div class="text-center rounded-lg bg-[#2d898b]/10 p-3 border-2 border-[#2d898b]">
                  <div class="text-3xl font-extrabold text-[#2d898b]">
                    {((statsData.by_race.arrests.Black / statsData.by_race.all_stops.Black) * 100).toFixed(1)}%
                  </div>
                  <div class="mt-1 text-[10px] font-medium text-slate-600">Black drivers<br/>arrested</div>
                </div>

                <div class="text-center rounded-lg bg-slate-50 p-3">
                  <div class="text-3xl font-extrabold text-[#219255]">
                    {((statsData.by_race.arrests.Hispanic / statsData.by_race.all_stops.Hispanic) * 100).toFixed(1)}%
                  </div>
                  <div class="mt-1 text-[10px] font-medium text-slate-600">Hispanic drivers<br/>arrested</div>
                </div>

                <div class="text-center rounded-lg bg-slate-50 p-3">
                  <div class="text-3xl font-extrabold text-[#095771]">
                    {((statsData.by_race.arrests.White / statsData.by_race.all_stops.White) * 100).toFixed(1)}%
                  </div>
                  <div class="mt-1 text-[10px] font-medium text-slate-600">White drivers<br/>arrested</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-2">
                <div class="text-center rounded-lg bg-[#227f63]/10 p-4">
                  <div class="text-4xl font-extrabold text-[#227f63]">
                    {statsData.summary.citation_rate.toFixed(1)}%
                  </div>
                  <div class="mt-1 text-xs font-medium text-slate-600">end in citations</div>
                </div>
                <div class="text-center rounded-lg bg-slate-50 p-4">
                  <div class="text-4xl font-extrabold text-slate-700">
                    {statsData.summary.search_rate.toFixed(1)}%
                  </div>
                  <div class="mt-1 text-xs font-medium text-slate-600">lead to searches</div>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex h-48 items-center justify-center">
              <span class="text-sm text-slate-400">Loading data...</span>
            </div>
          {/if}
        </div>

        <!-- Box 4: 2024 Summary -->
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <div class="mb-4">
            <h3 class="text-xl font-bold text-slate-900">
              The Full Picture
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-slate-600">
              Across 441 Missouri agencies, officers documented every interaction. These numbers tell the story of who gets stopped, searched, and what happens next.
            </p>
          </div>

          {#if statsData}
            <div class="space-y-4">
              <div class="text-center">
                <div class="text-4xl font-extrabold text-slate-900">
                  {formatStops(statsData.total_stops)}
                </div>
                <div class="mt-1 text-xs font-medium text-slate-600">Total Stops</div>
                <div class="text-[10px] text-slate-500">Across {statsData.agency_count} agencies</div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">Searches</span>
                  <div class="text-right">
                    <div class="text-lg font-bold text-[#227f63]">{statsData.summary.search_rate.toFixed(1)}%</div>
                    <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.searches.Total)}</div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">Hit Rate</span>
                  <div class="text-right">
                    <div class="text-lg font-bold text-[#20a547]">{statsData.summary.hit_rate.toFixed(1)}%</div>
                    <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.contraband.Total)}</div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">Citations</span>
                  <div class="text-right">
                    <div class="text-lg font-bold text-[#2d898b]">{statsData.summary.citation_rate.toFixed(1)}%</div>
                    <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.citations.Total)}</div>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-700">Arrests</span>
                  <div class="text-right">
                    <div class="text-lg font-bold text-[#095771]">{statsData.summary.arrest_rate.toFixed(1)}%</div>
                    <div class="text-[10px] text-slate-500">{formatStops(statsData.by_race.arrests.Total)}</div>
                  </div>
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
