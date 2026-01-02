<script>
  import LocationPicker from "$lib/components/LocationPicker.svelte";
  import DataCard from "$lib/components/DataCard.svelte";
  import FeaturedFinding from "$lib/components/FeaturedFinding.svelte";
  import * as m from "$lib/paraglide/messages";

  export let data;

  let selectedLocation = null;
  let aboutExpanded = false;

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

  const featuredFindings = [
    {
      text: "Search rates vary dramatically across departments",
      detail: "Some departments search vehicles 5x more often than others"
    },
    {
      text: "Traffic stops happen most on state highways",
      detail: "Interstate and US highways account for the majority of stops"
    },
    {
      text: "Stop outcomes differ widely by location",
      detail: "Arrest rates range from under 1% to over 15% depending on department"
    },
    {
      text: "614 law enforcement agencies report stop data",
      detail: "From small town departments to county sheriffs across Missouri"
    },
    {
      text: "Most stops result in warnings, not tickets",
      detail: "Citations are issued in less than half of all traffic stops statewide"
    }
  ];
</script>

<svelte:head>
  <title>{m.home_hero_headline()}</title>
</svelte:head>

<main class="min-h-screen bg-white">
  <!-- Hero Section -->
  <section class="border-b border-slate-200 bg-white px-6 py-10 md:py-16">
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
          <div class="mx-auto max-w-2xl rounded-lg border-2 border-indigo-600 bg-indigo-50 px-6 py-5 text-center">
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

      <div class="mt-6 flex flex-wrap items-center justify-center gap-4">
        <a
          href="#explore"
          class="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {m.home_explore_button()}
        </a>
        <a
          href="/data/agency_index.json"
          download
          class="rounded-lg border-2 border-slate-300 bg-white px-8 py-3 font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          {m.home_download_button()}
        </a>
      </div>
    </div>
  </section>

  <!-- Why It Matters Section -->
  <section class="border-b border-slate-200 bg-slate-50 py-10">
    <div class="mx-auto max-w-3xl px-6">
      <h2 class="mb-4 text-2xl font-bold text-slate-900">
        {m.home_why_heading()}
      </h2>
      <p class="text-lg leading-relaxed text-slate-700">
        {m.home_why_text()}
      </p>
    </div>
  </section>

  <!-- Featured Finding Section -->
  <section class="bg-white py-10">
    <div class="mx-auto max-w-4xl px-6">
      <FeaturedFinding findings={featuredFindings} />
    </div>
  </section>

  <!-- Data Cards Section -->
  <section id="explore" class="mx-auto max-w-6xl border-t border-slate-200 px-6 py-10">
    <h2 class="mb-6 text-3xl font-bold text-slate-900">
      {m.home_cards_heading()}
    </h2>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DataCard
        title={m.home_card_stops_title()}
        description={m.home_card_stops_description()}
        preview={m.home_card_preview_stops()}
      />
      <DataCard
        title={m.home_card_demographics_title()}
        description={m.home_card_demographics_description()}
        preview={m.home_card_preview_demographics()}
      />
      <DataCard
        title={m.home_card_outcomes_title()}
        description={m.home_card_outcomes_description()}
        preview={m.home_card_preview_outcomes()}
      />
      <DataCard
        title={m.home_card_searches_title()}
        description={m.home_card_searches_description()}
        preview={m.home_card_preview_searches()}
      />
      <DataCard
        title={m.home_card_geography_title()}
        description={m.home_card_geography_description()}
        preview={m.home_card_preview_geography()}
      />
      <DataCard
        title={m.home_card_trends_title()}
        description={m.home_card_trends_description()}
        preview={m.home_card_preview_trends()}
      />
    </div>
  </section>

  <!-- About/Methodology Section -->
  <section class="border-t border-slate-200 bg-white py-10">
    <div class="mx-auto max-w-4xl px-6">
      <button
        type="button"
        on:click={() => (aboutExpanded = !aboutExpanded)}
        class="flex w-full items-center justify-between py-3 text-left"
      >
        <h2 class="text-2xl font-bold text-slate-900">
          {m.home_about_heading()}
        </h2>
        <span class="text-sm font-medium text-indigo-600">
          {aboutExpanded ? m.home_about_collapse() : m.home_about_expand()}
        </span>
      </button>

      {#if aboutExpanded}
        <div class="mt-4 space-y-5 border-t border-slate-200 pt-4">
          <div>
            <h3 class="mb-2 font-semibold text-slate-900">
              {m.home_about_what_is_heading()}
            </h3>
            <p class="text-base leading-relaxed text-slate-600">
              {m.home_about_what_is_content()}
            </p>
          </div>

          <div>
            <h3 class="mb-2 font-semibold text-slate-900">
              {m.home_about_how_collected_heading()}
            </h3>
            <p class="text-base leading-relaxed text-slate-600">
              {m.home_about_how_collected_content()}
            </p>
          </div>

          <div>
            <h3 class="mb-2 font-semibold text-slate-900">
              {m.home_about_how_to_use_heading()}
            </h3>
            <p class="text-base leading-relaxed text-slate-600">
              {m.home_about_how_to_use_content()}
            </p>
          </div>
        </div>
      {/if}
    </div>
  </section>
</main>
