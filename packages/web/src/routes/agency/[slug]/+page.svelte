<svelte:head>
  <title>{data.data?.agency ?? data.slug} | Agency</title>
</svelte:head>

<script>
  import AgencyMap from "$lib/components/AgencyMap.svelte";

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

  let agencyData;
  let metadata;
  let geocodeResponse;
  let geocodeAddressResponse;
  let metadataFields = {};
  let metadataEntries = [];
  let rows = [];
  let rowsByYear = {};
  let years = [];

  $: agencyData = data.data;
  $: metadata = agencyData?.agency_metadata;
  $: ({
    geocode_response: geocodeResponse,
    geocode_address_response: geocodeAddressResponse,
    ...metadataFields
  } = metadata || {});

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

<main class="mx-auto w-full max-w-5xl px-4 pb-16 pt-12 sm:px-6">
  <header class="mb-10">
    <p class="text-xs uppercase tracking-[0.12em] text-slate-500">Agency preview</p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
      {agencyData?.agency ?? data.slug}
    </h1>
    <p class="mt-2 text-xs font-mono tracking-[0.08em] text-slate-500">Slug: {data.slug}</p>
  </header>

  <AgencyMap
    heading="Location"
    addressResponse={geocodeAddressResponse}
    fallbackResponse={geocodeResponse}
  />

  {#if metadata && metadataEntries.length > 0}
    <section class="mb-10">
      <h2 class="mb-4 text-xl font-semibold text-slate-900">Agency metadata</h2>
      <dl class="grid gap-3">
        {#each metadataEntries as [key, value]}
          <div
            class="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(160px,1fr)_2fr] md:gap-4"
          >
            <dt class="text-sm font-semibold text-slate-700">{key}</dt>
            <dd class="text-sm text-slate-600">{formatValue(value)}</dd>
          </div>
        {/each}
      </dl>
    </section>
  {/if}

  {#if geocodeResponse}
    <section class="mb-10">
      <h2 class="mb-4 text-xl font-semibold text-slate-900">Geocode response</h2>
      <details class="rounded-xl border border-slate-200 bg-white p-4">
        <summary class="cursor-pointer text-sm font-semibold text-slate-900">
          View geocode JSON
        </summary>
        <div class="mt-3 rounded-xl bg-slate-900 p-4 text-slate-200 shadow-lg">
          <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono">{stableStringify(geocodeResponse)}</pre>
        </div>
      </details>
    </section>
  {/if}

  {#if geocodeAddressResponse}
    <section class="mb-10">
      <h2 class="mb-4 text-xl font-semibold text-slate-900">Address geocode response</h2>
      <details class="rounded-xl border border-slate-200 bg-white p-4">
        <summary class="cursor-pointer text-sm font-semibold text-slate-900">
          View address geocode JSON
        </summary>
        <div class="mt-3 rounded-xl bg-slate-900 p-4 text-slate-200 shadow-lg">
          <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono">{stableStringify(geocodeAddressResponse)}</pre>
        </div>
      </details>
    </section>
  {/if}

  <section class="mb-10">
    <h2 class="mb-4 text-xl font-semibold text-slate-900">Yearly data</h2>
    {#if years.length === 0}
      <p class="text-sm text-slate-500">No row data found.</p>
    {:else}
      {#each years as year}
        <article class="relative mb-8">
          <h3
            class="sticky top-[var(--site-header-height)] z-20 flex h-7 w-full items-center border-b border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900"
          >
            {year}
          </h3>
          {#each rowsByYear[year] as entry, entryIndex}
            {#if rowsByYear[year].length > 1}
              <p class="mb-2 mt-4 text-sm text-slate-500">Entry {entryIndex + 1}</p>
            {/if}
            <table class="mb-6 w-full table-auto border-separate border-spacing-0 rounded-xl border border-slate-200 bg-white">
              <thead class="bg-slate-100">
                <tr>
                  <th
                    class="sticky top-[calc(var(--site-header-height)+var(--year-header-height))] z-10 bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700"
                  >
                    Metric
                  </th>
                  {#each columnLabels as label}
                    <th
                      class="sticky top-[calc(var(--site-header-height)+var(--year-header-height))] z-10 bg-slate-100 px-4 py-2 text-left text-sm font-semibold text-slate-700"
                    >
                      {label}
                    </th>
                  {/each}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {#each getSortedEntries(entry) as [key, value]}
                  {@const columns = normalizeMetric(value)}
                  <tr>
                    <td class="px-4 py-3 text-sm font-medium text-slate-700">{key}</td>
                    {#each columnLabels as label}
                      <td class="px-4 py-3 text-base font-mono text-slate-900 tabular-nums whitespace-nowrap">
                        {columns[label]}
                      </td>
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

  <details class="rounded-xl border border-slate-200 bg-white p-4">
    <summary class="cursor-pointer text-sm font-semibold text-slate-900">View full JSON</summary>
    <div class="mt-3 rounded-xl bg-slate-900 p-4 text-slate-200 shadow-lg">
      <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono">{stableStringify(agencyData)}</pre>
    </div>
  </details>
</main>
