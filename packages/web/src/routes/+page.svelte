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
  <section class="bg-white px-6 py-10 md:py-16">
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

  <!-- Footer / About / CTA -->
  <section id="about" class="border-t border-slate-200 bg-white py-12">
    <div class="mx-auto max-w-4xl px-6">
      <h2 class="mb-4 text-2xl font-bold text-slate-900">
        {m.home_footer_heading()}
      </h2>
      <p class="mb-6 text-lg leading-relaxed text-slate-700">
        {m.home_footer_text()}
      </p>

      <div class="rounded-lg border-2 border-green-100 bg-green-50 p-6">
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

      <div class="mt-8 space-y-4 border-t border-slate-200 pt-8">
        <h3 class="font-semibold text-slate-900">
          {m.home_about_heading()}
        </h3>
        <div class="space-y-3 text-sm text-slate-600">
          <p>{m.home_about_what_is_content()}</p>
          <p>{m.home_about_how_collected_content()}</p>
          <p>{m.home_about_how_to_use_content()}</p>
        </div>
      </div>
    </div>
  </section>
</main>
