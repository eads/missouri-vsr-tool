<script>
  import "../app.css";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { QuickScore } from "quick-score";
  import { baseLocale, getLocale, locales, localizeHref } from "$lib/paraglide/runtime";

  export let data;

  let query = "";
  let results = [];
  let selectedIndex = -1;
  let previousQuery = "";
  let currentLocale = baseLocale;
  let currentPath = "/";

  const readLocale = () => {
    try {
      return getLocale();
    } catch {
      return baseLocale;
    }
  };

  $: currentLocale = readLocale();
  $: currentPath = `${$page.url.pathname}${$page.url.search}${$page.url.hash}`;

  const toLabel = (item) =>
    item?.canonical_name || item?.names?.[0] || item?.agency_slug || "Unknown agency";
  const toStops = (item) => item?.["rates--totals--all-stops"];
  const formatStops = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return null;
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numeric);
  };
  const toSubLabel = (item) => [item?.city].filter(Boolean).join(" • ");
  const toSlug = (item) => item?.agency_slug || item?.slug || item?.id;

  $: agencies = (data.agencies || []).map((item) => ({
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

  $: scorer = agencies.length ? new QuickScore(agencies, ["search"]) : null;

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
      query = "";
      results = [];
      selectedIndex = -1;
    }
  };

  const handleLocaleChange = (event) => {
    const nextLocale = event?.currentTarget?.value;
    if (!nextLocale || nextLocale === currentLocale) return;
    const href = localizeHref(currentPath, { locale: nextLocale });
    goto(href).catch(() => {
      window.location.href = href;
    });
  };
</script>

<header
  class="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur md:flex-row md:items-center md:justify-between"
>
  <div class="flex items-center gap-3">
    <a href="/" class="text-lg font-semibold tracking-tight text-slate-900 no-underline">VSR</a>
    <label class="sr-only" for="language-switcher">Language</label>
    <select
      id="language-switcher"
      class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
      value={currentLocale}
      on:change={handleLocaleChange}
    >
      {#each locales as locale}
        <option value={locale}>{locale}</option>
      {/each}
    </select>
  </div>
  <div class="relative w-full md:max-w-[520px]">
    <input
      type="search"
      placeholder="Search agencies"
      bind:value={query}
      on:keydown={handleKeydown}
      aria-label="Search agencies"
      autocomplete="off"
      spellcheck="false"
      class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
    />
    {#if results.length}
      <ul
        class="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 list-none overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
        role="listbox"
      >
        {#each results as result, index}
          {@const slug = toSlug(result.item)}
          {@const href = slug ? `/agency/${slug}` : "#"}
          {@const stops = formatStops(toStops(result.item))}
          <li role="option">
            <a
              href={href}
              on:click={slug ? resetSearch : undefined}
              aria-disabled={!slug}
              class={`flex flex-col gap-1 px-4 py-2 text-sm text-slate-900 no-underline hover:bg-indigo-100 ${
                index === selectedIndex ? "bg-indigo-100" : ""
              }`}
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
</header>

<slot />
