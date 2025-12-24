<svelte:head>
  <title>{data.data?.agency ?? data.slug} | Agency</title>
</svelte:head>

<script>
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  /** @type {import('./$types').PageData} */
  export let data;

  const compareStrings = (a, b) => (a === b ? 0 : a < b ? -1 : 1);

  const sortValue = (value) => {
    if (Array.isArray(value)) {
      return value.map(sortValue);
    }
    if (value && typeof value === "object") {
      return Object.keys(value)
        .sort(compareStrings)
        .reduce((acc, key) => {
          acc[key] = sortValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  };

  const stableStringify = (value) => JSON.stringify(sortValue(value), null, 2);

  let MapLibre;
  let Marker;
  let mapReady = false;

  let agencyData;
  let metadata;
  let geocodeResponse;
  let metadataFields = {};
  let metadataEntries = [];
  let rows = [];
  let rowsByYear = {};
  let years = [];
  let center = null;

  const mapStyle = "https://tiles.openfreemap.org/styles/bright";
  const defaultCenter = [-92.6037607, 38.5767017];

  onMount(async () => {
    if (!browser) return;
    const mod = await import("svelte-maplibre-gl");
    MapLibre = mod.MapLibre;
    Marker = mod.Marker;
    mapReady = true;
  });

  $: agencyData = data.data;
  $: metadata = agencyData?.agency_metadata;
  $: ({ geocode_response: geocodeResponse, ...metadataFields } = metadata || {});

  $: {
    const location = geocodeResponse?.results?.[0]?.location;
    const lng = location?.lng != null ? Number(location.lng) : null;
    const lat = location?.lat != null ? Number(location.lat) : null;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      center = [lng, lat];
    } else {
      center = defaultCenter;
    }
  }

  $: metadataEntries = Object.entries(metadataFields || {}).sort(([keyA], [keyB]) =>
    compareStrings(keyA, keyB)
  );

  $: rows = Array.isArray(agencyData?.rows) ? agencyData.rows : [];
  $: rowsByYear = rows.reduce((acc, row) => {
    const year = row?.year ?? "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(row);
    return acc;
  }, {});

  $: years = Object.keys(rowsByYear).sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    if (Number.isFinite(numA) && Number.isFinite(numB)) return numB - numA;
    return compareStrings(String(a), String(b));
  });

  const formatValue = (value) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number" && Number.isFinite(value)) {
      if (Number.isInteger(value)) return String(value);
      return value
        .toFixed(2)
        .replace(/\.?0+$/, "");
    }
    if (typeof value === "string" || typeof value === "boolean") {
      return String(value);
    }
    return JSON.stringify(value);
  };

  const columnLabels = ["Total", "White", "Black", "Hispanic", "Asian", "Other"];
  const priorityPrefix = "rates--totals-";

  const getSortedEntries = (entry) =>
    Object.entries(entry)
      .filter(([key]) => key !== "year")
      .sort(([keyA], [keyB]) => {
        const aPriority = keyA.startsWith(priorityPrefix) ? 0 : 1;
        const bPriority = keyB.startsWith(priorityPrefix) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return compareStrings(keyA, keyB);
      });

  const normalizeMetric = (value) => {
    const base = {
      Total: "—",
      White: "—",
      Black: "—",
      Hispanic: "—",
      Asian: "—",
      Other: "—",
    };

    if (value === null || value === undefined) {
      return base;
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return { ...base, Total: formatValue(value) };
    }

    const record = value;
    return {
      Total: formatValue(record.Total ?? record.total),
      White: formatValue(record.White ?? record.white),
      Black: formatValue(record.Black ?? record.black),
      Hispanic: formatValue(record.Hispanic ?? record.hispanic),
      Asian: formatValue(record.Asian ?? record.asian),
      Other: formatValue(record.Other ?? record.other),
    };
  };
</script>

<main>
  <header>
    <p class="eyebrow">Agency preview</p>
    <h1>{agencyData?.agency ?? data.slug}</h1>
    <p class="slug">Slug: {data.slug}</p>
  </header>

  <section class="map-section">
    <h2>Location</h2>
    {#if mapReady && MapLibre && center}
      <div class="map-wrapper">
        <svelte:component
          this={MapLibre}
          class="map"
          inlineStyle="height: 100%; width: 100%;"
          style={mapStyle}
          center={center}
          zoom={11}
        >
          <svelte:component this={Marker} lnglat={center} color="#1d4ed8" />
        </svelte:component>
      </div>
    {:else}
      <p class="empty">Map loading…</p>
    {/if}
  </section>

  {#if metadata && metadataEntries.length > 0}
    <section class="meta">
      <h2>Agency metadata</h2>
      <dl>
        {#each metadataEntries as [key, value]}
          <div class="meta-row">
            <dt>{key}</dt>
            <dd>{formatValue(value)}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  {#if geocodeResponse}
    <section class="meta">
      <h2>Geocode response</h2>
      <details class="json-collapsible">
        <summary>View geocode JSON</summary>
        <div class="json">
          <pre>{stableStringify(geocodeResponse)}</pre>
        </div>
      </details>
    </section>
  {/if}

  <section class="rows">
    <h2>Yearly data</h2>
    {#if years.length === 0}
      <p class="empty">No row data found.</p>
    {:else}
      {#each years as year}
        <article class="year-block">
          <h3>{year}</h3>
          {#each rowsByYear[year] as entry, entryIndex}
            {#if rowsByYear[year].length > 1}
              <p class="entry-label">Entry {entryIndex + 1}</p>
            {/if}
            <table>
              <thead>
                <tr>
                  <th class="metric-col">Metric</th>
                  {#each columnLabels as label}
                    <th class="value-col">{label}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each getSortedEntries(entry) as [key, value]}
                  {@const columns = normalizeMetric(value)}
                  <tr>
                    <td class="metric-col">{key}</td>
                    {#each columnLabels as label}
                      <td class="value value-col">{columns[label]}</td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          {/each}
        </article>
      {/each}
    {/if}
  </section>

  <details class="json-collapsible">
    <summary>View full JSON</summary>
    <div class="json">
      <pre>{stableStringify(agencyData)}</pre>
    </div>
  </details>
</main>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap");

  :global(body) {
    margin: 0;
    font-family: "Space Grotesk", sans-serif;
    background: #f8fafc;
    color: #0f172a;
  }

  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 3rem 1.5rem 4rem;
  }

  header {
    margin-bottom: 2rem;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.7rem;
    color: #64748b;
    margin: 0 0 0.75rem;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: clamp(2rem, 4vw, 3rem);
  }

  .slug {
    margin: 0;
    color: #64748b;
    font-size: 0.8rem;
    font-family: "IBM Plex Mono", "Fira Mono", ui-monospace, SFMono-Regular, SFMono-Regular,
      Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    letter-spacing: 0.02em;
  }

  .meta,
  .rows,
  .map-section {
    margin-bottom: 2.5rem;
  }

  h2 {
    margin: 0 0 1rem;
    font-size: 1.4rem;
  }

  dl {
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  .meta-row {
    display: grid;
    grid-template-columns: minmax(140px, 1fr) 2fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  dt {
    font-weight: 600;
    color: #1e293b;
  }

  dd {
    margin: 0;
    color: #334155;
  }

  .empty {
    color: #64748b;
  }

  .map-wrapper {
    height: 360px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    background: #e2e8f0;
  }

  .year-block {
    margin-bottom: 2rem;
    position: relative;
    --year-height: 2.75rem;
    --sticky-offset: var(--year-height);
  }

  h3 {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.1;
    height: var(--year-height);
    display: flex;
    align-items: center;
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
    background: #f8fafc;
    padding: 0 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    width: 100%;
    box-sizing: border-box;
  }

  .entry-label {
    margin: 0 0 0.5rem;
    color: #64748b;
    font-size: 0.85rem;
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  th,
  td {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }

  th {
    background: #f1f5f9;
    font-weight: 600;
    color: #0f172a;
    position: sticky;
    top: var(--sticky-offset);
    z-index: 2;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .value {
    word-break: break-word;
    font-family: "IBM Plex Mono", "Fira Mono", ui-monospace, SFMono-Regular, SFMono-Regular,
      Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.98rem;
  }

  .metric-col {
    width: 40%;
  }

  .value-col {
    width: 10%;
    white-space: nowrap;
  }

  .json {
    background: #0f172a;
    color: #e2e8f0;
    padding: 1.5rem;
    border-radius: 12px;
    overflow-x: auto;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  }

  .json-collapsible {
    border-radius: 12px;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
    color: #0f172a;
    list-style: none;
    margin-bottom: 0.75rem;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::before {
    content: "▸";
    display: inline-block;
    margin-right: 0.5rem;
    transition: transform 0.2s ease;
  }

  details[open] summary::before {
    transform: rotate(90deg);
  }

  pre {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  @media (max-width: 600px) {
    main {
      padding: 2rem 1rem 3rem;
    }

    .meta-row {
      grid-template-columns: 1fr;
    }

    table {
      display: block;
      overflow-x: auto;
    }

    .json {
      padding: 1rem;
    }
  }
</style>
