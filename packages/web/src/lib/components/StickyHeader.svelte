<script>
  import * as m from "$lib/paraglide/messages";
  import { goto } from "$app/navigation";
  import { QuickScore } from "quick-score";
  import { getLocale, locales, setLocale } from "$lib/paraglide/runtime";

  export let agencies = [];

  let query = "";
  let results = [];
  let selectedIndex = -1;
  let previousQuery = "";
  let mobileMenuOpen = false;
  let copied = false;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      // Clipboard API failed
    }
  };

  $: currentLocale = getLocale();

  const toLabel = (item) =>
    item?.canonical_name || item?.names?.[0] || item?.agency_slug || "Unknown agency";
  const toStops = (item) => item?.all_stops_total;
  const formatStops = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return null;
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric);
  };
  const toSubLabel = (item) => [item?.city].filter(Boolean).join(" • ");
  const toSlug = (item) => item?.agency_slug || item?.slug || item?.id;

  $: searchableAgencies = (agencies || []).map((item) => ({
    ...item,
    search: [
      item?.canonical_name,
      item?.agency_slug,
      ...(item?.names || []),
      item?.city,
      item?.zip,
    ]
      .filter(Boolean)
      .join(" "),
  }));

  $: scorer = searchableAgencies.length ? new QuickScore(searchableAgencies, ["search"]) : null;

  $: if (query.trim() !== previousQuery) {
    previousQuery = query.trim();
    selectedIndex = -1;
  }

  $: if (query.trim() && scorer) {
    const scored = scorer.search(query.trim());
    const reranked = scored
      .slice(0, 25)
      .sort((a, b) => {
        const aStops = toStops(a.item);
        const bStops = toStops(b.item);
        const aValue = typeof aStops === "string" ? Number(aStops) : aStops ?? 0;
        const bValue = typeof bStops === "string" ? Number(bStops) : bStops ?? 0;
        if (bValue !== aValue) return bValue - aValue;
        return b.score - a.score;
      })
      .slice(0, 10);
    results = reranked;
  } else {
    results = [];
  }

  const resetSearch = () => {
    query = "";
    results = [];
    selectedIndex = -1;
  };

  const handleSelect = (item) => {
    const slug = toSlug(item);
    if (!slug) return;
    resetSearch();
    goto(`/agency/${slug}`).catch(() => {
      window.location.href = `/agency/${slug}`;
    });
  };

  const handleKeydown = (event) => {
    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIndex = (selectedIndex + 1) % results.length;
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + results.length) % results.length;
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = results[selectedIndex]?.item || results[0]?.item;
      if (selected) handleSelect(selected);
      return;
    }

    if (event.key === "Escape") {
      resetSearch();
    }
  };

  const handleLocaleChange = (event) => {
    const nextLocale = event?.currentTarget?.value;
    if (!nextLocale || nextLocale === currentLocale) return;
    setLocale(nextLocale);
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
          on:keydown={handleKeydown}
          aria-label={m.search_aria_label()}
          autocomplete="off"
          class="w-full rounded-lg border-2 border-[#2c9166] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2c9166] focus:ring-offset-1"
        />
        {#if results.length}
          <ul class="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {#each results as result, index}
              {@const slug = toSlug(result.item)}
              {@const href = slug ? `/agency/${slug}` : "#"}
              {@const stops = formatStops(toStops(result.item))}
              <li role="option">
                <a
                  {href}
                  on:click={slug ? resetSearch : undefined}
                  aria-disabled={!slug}
                  class="flex flex-col gap-1 px-4 py-2 text-sm text-slate-900 no-underline hover:bg-[#2c9166]/10 {index === selectedIndex ? 'bg-[#2c9166]/10' : ''}"
                >
                  <span class="font-semibold text-slate-900">{toLabel(result.item)}</span>
                  {#if stops || toSubLabel(result.item)}
                    <span class="flex items-center gap-2 text-xs text-slate-500">
                      {#if stops}
                        <span class="font-semibold text-slate-800">{stops} stops</span>
                      {/if}
                      {#if toSubLabel(result.item)}
                        <span class="opacity-60">•</span>
                        <span>{toSubLabel(result.item)}</span>
                      {/if}
                    </span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Right: Share + Language switcher + Donate -->
      <div class="flex items-center gap-3">
        <!-- Share button with dropdown -->
        <div class="share-menu-container relative">
          <button
            type="button"
            on:click={toggleShareMenu}
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-[#2c9166] hover:text-[#2c9166] focus:outline-none focus:ring-2 focus:ring-[#2c9166] focus:ring-offset-1"
            aria-label="Share"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span class="hidden sm:inline">Share</span>
          </button>

          {#if shareMenuOpen}
            <div class="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                on:click={shareOnTwitter}
                class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Post on X
              </button>
              <button
                type="button"
                on:click={shareOnFacebook}
                class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Share on Facebook
              </button>
              <button
                type="button"
                on:click={shareOnLinkedIn}
                class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Share on LinkedIn
              </button>
              <hr class="my-1 border-slate-200" />
              <button
                type="button"
                on:click={copyLink}
                class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {#if copied}
                  <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="text-green-600">Copied!</span>
                {:else}
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy link
                {/if}
              </button>
            </div>
          {/if}
        </div>

        <select
          bind:value={currentLocale}
          on:change={handleLocaleChange}
          class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition-colors hover:border-[#2c9166] focus:border-[#2c9166] focus:outline-none"
        >
          {#each locales as locale}
            <option value={locale}>{locale.toUpperCase()}</option>
          {/each}
        </select>
        <a
          href="#donate"
          class="rounded-lg bg-[#2c9166] px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#216d4d]"
        >
          {m.home_donate_button()}
        </a>
      </div>
    </div>
  </div>
</header>
