<script>
  import * as m from "$lib/paraglide/messages";
  import { onMount } from "svelte";
  import { QuickScore } from "quick-score";
  import { goto } from "$app/navigation";

  export let agencies = [];

  let currentLang = "en";
  let query = "";
  let results = [];
  let selectedIndex = -1;

  onMount(() => {
    const path = window.location.pathname;
    currentLang = path.startsWith("/es") ? "es" : "en";
  });

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/(en|es)/, `/${newLang}`);
    window.location.href = newPath;
  };

  const toLabel = (item) => item?.canonical_name || item?.names?.[0] || item?.agency_slug;
  const formatStops = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return null;
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(numeric);
  };

  $: enrichedAgencies = (agencies || []).map((item) => ({
    ...item,
    search: [item?.canonical_name, ...(item?.names || []), item?.county, item?.county_name, item?.city]
      .filter(Boolean)
      .join(" "),
  }));

  $: scorer = enrichedAgencies.length ? new QuickScore(enrichedAgencies, ["search"]) : null;

  $: if (query.trim() && scorer) {
    results = scorer.search(query.trim()).slice(0, 8);
  } else {
    results = [];
  }

  const handleSelect = (item) => {
    query = "";
    results = [];
    goto(`/agency/${item.agency_slug}`);
  };

  const handleKeydown = (event) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % results.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + results.length) % results.length;
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[selectedIndex]?.item || results[0]?.item;
      if (selected) handleSelect(selected);
    } else if (event.key === "Escape") {
      query = "";
      results = [];
    }
  };
</script>

<header class="sticky top-0 z-50 border-b-6 border-b-[#2c9166] bg-white/95 backdrop-blur-sm shadow-sm">
  <div class="mx-auto max-w-7xl px-6">
    <div class="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:gap-4">
      <a href="/" class="shrink-0 text-2xl font-bold text-[#2c9166] no-underline md:text-3xl">
        {m.home_header_title()}
      </a>

      <div class="relative w-full md:flex-1 md:max-w-2xl md:mx-auto">
        <input
          type="search"
          placeholder={m.search_placeholder()}
          bind:value={query}
          onkeydown={handleKeydown}
          aria-label={m.search_aria_label()}
          autocomplete="off"
          class="w-full rounded-lg border-2 border-[#2c9166] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c9166] focus:ring-offset-1"
        />
        {#if results.length}
          <ul class="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {#each results as result, index}
              {@const stops = formatStops(result.item.all_stops_total)}
              <li>
                <button
                  type="button"
                  onclick={() => handleSelect(result.item)}
                  class={`flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-green-50 ${index === selectedIndex ? "bg-green-50" : ""}`}
                >
                  <span class="font-medium text-slate-900">{toLabel(result.item)}</span>
                  {#if stops || result.item.county_name}
                    <span class="flex items-center gap-2 text-xs text-slate-500">
                      {#if stops}
                        <span>{stops} {m.search_stops_label()}</span>
                      {/if}
                      {#if result.item.county_name}
                        <span>• {result.item.county_name}</span>
                      {/if}
                    </span>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="flex items-center justify-end gap-3 md:justify-start">
        <select
          bind:value={currentLang}
          onchange={handleLanguageChange}
          class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-700 focus:border-[#2c9166] focus:outline-none"
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <a
          href="#donate"
          class="rounded-lg bg-[#2c9166] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[#216d4d]"
        >
          {m.home_donate_button()}
        </a>
      </div>
    </div>
  </div>
</header>
