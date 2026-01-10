<script>
  import StickyHeader from "$lib/components/StickyHeader.svelte";
  import LocationPicker from "$lib/components/LocationPicker.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let selectedLocation = null;

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
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <h3 class="text-xl font-bold text-slate-900">
            {m.home_highlight_1_title()}
          </h3>
          <p class="mt-3 leading-relaxed text-slate-600">
            {m.home_highlight_1_text()}
          </p>
          <!-- Chart placeholder -->
          <div class="mt-4 flex h-48 items-center justify-center rounded border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm text-slate-400">Chart placeholder</span>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <h3 class="text-xl font-bold text-slate-900">
            {m.home_highlight_2_title()}
          </h3>
          <p class="mt-3 leading-relaxed text-slate-600">
            {m.home_highlight_2_text()}
          </p>
          <!-- Chart placeholder -->
          <div class="mt-4 flex h-48 items-center justify-center rounded border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm text-slate-400">Chart placeholder</span>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <h3 class="text-xl font-bold text-slate-900">
            {m.home_highlight_3_title()}
          </h3>
          <p class="mt-3 leading-relaxed text-slate-600">
            {m.home_highlight_3_text()}
          </p>
          <!-- Chart placeholder -->
          <div class="mt-4 flex h-48 items-center justify-center rounded border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm text-slate-400">Chart placeholder</span>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <h3 class="text-xl font-bold text-slate-900">
            {m.home_highlight_4_title()}
          </h3>
          <p class="mt-3 leading-relaxed text-slate-600">
            {m.home_highlight_4_text()}
          </p>
          <!-- Chart placeholder -->
          <div class="mt-4 flex h-48 items-center justify-center rounded border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm text-slate-400">Chart placeholder</span>
          </div>
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
        {@html data.aboutDataHtml}
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
