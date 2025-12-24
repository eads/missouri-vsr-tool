<script>
  import { goto } from "$app/navigation";
  import { QuickScore } from "quick-score";

  export let data;

  let query = "";
  let results = [];
  let selectedIndex = -1;
  let previousQuery = "";

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
</script>

<header class="site-header">
  <div class="brand">
    <a href="/">VSR</a>
  </div>
  <div class="search">
    <input
      type="search"
      placeholder="Search agencies"
      bind:value={query}
      on:keydown={handleKeydown}
      aria-label="Search agencies"
      autocomplete="off"
      spellcheck="false"
    />
    {#if results.length}
      <ul class="results" role="listbox">
        {#each results as result, index}
          {@const slug = toSlug(result.item)}
          {@const href = slug ? `/agency/${slug}` : "#"}
          {@const stops = formatStops(toStops(result.item))}
          <li
            class:selected={index === selectedIndex}
            role="option"
          >
            <a href={href} on:click={slug ? resetSearch : undefined} aria-disabled={!slug}>
              <span class="label">{toLabel(result.item)}</span>
              {#if stops || toSubLabel(result.item)}
                <span class="meta-row">
                  {#if stops}
                    <span class="meta stops">{stops} stops</span>
                  {/if}
                  {#if toSubLabel(result.item)}
                    <span class="meta dot">•</span>
                    <span class="meta">{toSubLabel(result.item)}</span>
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

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    gap: 1.5rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: rgba(248, 250, 252, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid #e2e8f0;
  }

  .brand a {
    text-decoration: none;
    color: #0f172a;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .search {
    position: relative;
    width: min(520px, 100%);
  }

  input {
    width: 100%;
    padding: 0.6rem 0.9rem;
    border: 1px solid #cbd5f5;
    border-radius: 12px;
    font-size: 0.95rem;
    background: #ffffff;
    color: #0f172a;
  }

  input:focus {
    outline: 2px solid #1d4ed8;
    outline-offset: 2px;
  }

  .results {
    position: absolute;
    top: calc(100% + 0.35rem);
    left: 0;
    right: 0;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
    padding: 0.5rem 0;
    margin: 0;
    list-style: none;
    max-height: 320px;
    overflow-y: auto;
  }

  .results li {
    padding: 0;
  }

  .results li:hover a,
  .results li.selected a {
    background: #e0e7ff;
  }

  .results a {
    display: flex;
    flex-direction: column;
    padding: 0.55rem 0.9rem;
    gap: 0.15rem;
    color: inherit;
    text-decoration: none;
  }

  .label {
    font-weight: 600;
    color: #0f172a;
  }

  .meta {
    font-size: 0.75rem;
    color: #64748b;
  }

  .meta-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .dot {
    opacity: 0.6;
  }

  .stops {
    font-weight: 600;
    color: #1e293b;
  }

  @media (max-width: 700px) {
    .site-header {
      flex-direction: column;
      align-items: stretch;
    }

    .search {
      width: 100%;
    }
  }
</style>
