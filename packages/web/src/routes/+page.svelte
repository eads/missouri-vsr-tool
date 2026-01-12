<script>
  import StickyHeader from "$lib/components/StickyHeader.svelte";
  import LocationPicker from "$lib/components/LocationPicker.svelte";
  import * as m from "$lib/paraglide/messages";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";

  export let data;

  let showHeaderTitle = false;
  let heroSection;

  onMount(() => {
    const handleScroll = () => {
      if (heroSection) {
        const heroBottom = heroSection.offsetHeight;
        showHeaderTitle = window.scrollY > heroBottom;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const handleLocationSelect = (location) => {
    if (location?.agency_slug) {
      goto(`/agency/${location.agency_slug}`);
    }
  };
</script>

<svelte:head>
  <title>{m.home_header_title()}</title>
</svelte:head>

<StickyHeader showTitle={showHeaderTitle} agencies={data.agencies} onSelect={handleLocationSelect} />

<main class="min-h-screen bg-gradient-to-b from-white to-slate-50">
  <!-- Hero -->
  <section bind:this={heroSection} class="bg-white px-6 py-16 md:py-24">
    <div class="mx-auto max-w-4xl text-center">
      <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
        {m.home_hero_headline()}
      </h1>
      <p class="mt-6 text-xl leading-relaxed text-slate-600 md:text-2xl">
        {m.home_hero_subheadline()}
      </p>
      <div class="mx-auto mt-10 max-w-xl">
        <LocationPicker agencies={data.agencies} onSelect={handleLocationSelect} />
      </div>
    </div>
  </section>

  <!-- Intro -->
  <section class="border-t border-slate-200 bg-slate-50 px-6 py-16">
    <div class="mx-auto max-w-4xl">
      <p class="text-center text-xl leading-relaxed text-slate-700">
        Traffic stops are how <strong>most</strong> people encounter police. This data shows <strong>who</strong> gets stopped, <strong>why</strong>, and <strong>what</strong> happens next—revealing disparities across Missouri's departments.
      </p>
    </div>
  </section>

  <!-- Highlights Grid -->
  <section class="border-t border-slate-200 bg-white py-20">
    <div class="mx-auto max-w-7xl px-6">
      <h2 class="mb-12 text-center text-4xl font-bold tracking-tight text-slate-900">
        {m.home_highlights_heading()}
      </h2>

      <div class="grid gap-8 md:grid-cols-2">
        <div class="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <h3 class="text-2xl font-semibold text-slate-900">
            {m.home_highlight_1_title()}
          </h3>
          <p class="mt-4 leading-relaxed text-slate-600">
            {m.home_highlight_1_text()}
          </p>
          <div class="mt-6 flex h-56 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm font-medium text-slate-400">Chart placeholder</span>
          </div>
        </div>

        <div class="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <h3 class="text-2xl font-semibold text-slate-900">
            {m.home_highlight_2_title()}
          </h3>
          <p class="mt-4 leading-relaxed text-slate-600">
            {m.home_highlight_2_text()}
          </p>
          <div class="mt-6 flex h-56 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm font-medium text-slate-400">Chart placeholder</span>
          </div>
        </div>

        <div class="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <h3 class="text-2xl font-semibold text-slate-900">
            {m.home_highlight_3_title()}
          </h3>
          <p class="mt-4 leading-relaxed text-slate-600">
            {m.home_highlight_3_text()}
          </p>
          <div class="mt-6 flex h-56 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm font-medium text-slate-400">Chart placeholder</span>
          </div>
        </div>

        <div class="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
          <h3 class="text-2xl font-semibold text-slate-900">
            {m.home_highlight_4_title()}
          </h3>
          <p class="mt-4 leading-relaxed text-slate-600">
            {m.home_highlight_4_text()}
          </p>
          <div class="mt-6 flex h-56 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <span class="text-sm font-medium text-slate-400">Chart placeholder</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Download Section -->
  <section id="download" class="border-t border-slate-200 bg-slate-50 py-20">
    <div class="mx-auto max-w-5xl px-6">
      <h2 class="mb-4 text-center text-4xl font-bold tracking-tight text-slate-900">
        {m.home_toc_download()}
      </h2>
      <p class="mb-12 text-center text-xl text-slate-600">
        Download the complete Missouri Vehicle Stop Report dataset for your own analysis.
      </p>

      <div class="grid gap-8 md:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 class="mb-4 text-2xl font-semibold text-slate-900">
            Agency Index
          </h3>
          <p class="mb-6 text-slate-600">
            Complete list of all law enforcement agencies in Missouri with summary statistics.
          </p>
          <a
            href="/data/agency_index.json"
            download
            class="inline-block rounded-lg bg-[#1E8E4F] px-6 py-3 font-semibold text-white no-underline transition-all hover:bg-[#166B3C] hover:shadow-md"
          >
            Download JSON
          </a>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 class="mb-4 text-2xl font-semibold text-slate-900">
            Full Dataset
          </h3>
          <p class="mb-6 text-slate-600">
            Raw vehicle stop records by agency and year, including demographics and outcomes.
          </p>
          <span class="inline-block rounded-lg border-2 border-slate-300 bg-slate-50 px-6 py-3 font-semibold text-slate-400">
            Coming soon
          </span>
        </div>
      </div>

      <div class="mt-10 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 class="mb-4 text-lg font-semibold text-slate-900">
          Data format and usage
        </h3>
        <ul class="space-y-2 text-slate-600">
          <li>• Data is provided in JSON format</li>
          <li>• Includes agency metadata, stop counts, demographics, and detailed metrics</li>
          <li>• Free to use for journalism, research, and public interest projects</li>
          <li>• Attribution appreciated when using this data</li>
        </ul>
      </div>
    </div>
  </section>

  <!-- About the Data -->
  <section id="about" class="border-t border-slate-200 bg-white py-20">
    <div class="mx-auto max-w-4xl px-6">
      <div class="prose prose-slate max-w-none prose-headings:text-slate-900 prose-h1:text-4xl prose-h1:font-bold prose-h1:tracking-tight prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-10 prose-p:text-lg prose-p:text-slate-700 prose-p:leading-relaxed prose-ul:text-slate-700 prose-li:text-slate-700">
        {@html data.aboutDataHtml}
      </div>

      <div class="mt-16 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-10 shadow-sm">
        <p class="mb-6 text-2xl font-semibold text-slate-900">
          {m.home_footer_cta()}
        </p>
        <a
          id="donate"
          href="mailto:contact@example.com"
          class="inline-block rounded-lg bg-[#1E8E4F] px-8 py-4 text-lg font-semibold text-white no-underline shadow-md transition-all hover:bg-[#166B3C] hover:shadow-lg"
        >
          {m.home_footer_contact()}
        </a>
      </div>
    </div>
  </section>
</main>
