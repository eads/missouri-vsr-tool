<svelte:head>
  <title>{data.data?.agency ?? data.slug} | {agency_title_suffix()}</title>
</svelte:head>

<script>
  import AgencyMap from "$lib/components/AgencyMap.svelte";
  import MetricChartModal from "$lib/components/MetricChartModal.svelte";
  import { onMount } from "svelte";
  import {
    agency_entry_label,
    agency_geocode_summary,
    agency_location_heading,
    agency_map_loading,
    agency_metadata_heading,
    agency_metric_header,
    agency_no_rows,
    agency_preview_label,
    agency_slug_label,
    agency_title_suffix,
    agency_view_full_json,
    agency_yearly_data_heading,
    race_asian,
    race_black,
    race_hispanic,
    race_other,
    race_total,
    race_white,
  } from "$lib/paraglide/messages";

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
  let geocodeAddressResponse;
  let geocodeJurisdictionResponse;
  let metadataFields = {};
  let metadataEntries = [];
  let baselines = [];
  let rows = [];
  let rowsByYear = {};
  let years = [];
  let geocodeBlocks = [];

  $: agencyData = data.data;
  $: baselines = Array.isArray(data.baselines) ? data.baselines : [];
  $: metadata = agencyData?.agency_metadata;
  $: ({
    geocode_address_response: geocodeAddressResponse,
    geocode_jurisdiction_response: geocodeJurisdictionResponse,
    ...metadataFields
  } = metadata || {});

  $: geocodeBlocks = [
    { label: "Address geocode response", data: geocodeAddressResponse },
    { label: "Jurisdiction geocode response", data: geocodeJurisdictionResponse },
  ].filter((entry) => entry.data);

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

  const columnKeys = ["Total", "White", "Black", "Hispanic", "Asian", "Other"];
  const chartRaceKeys = columnKeys.filter((label) => label !== "Total");
  const priorityPrefix = "rates--totals-";

  const raceLabel = (key) => {
    switch (key) {
      case "Total":
        return race_total();
      case "White":
        return race_white();
      case "Black":
        return race_black();
      case "Hispanic":
        return race_hispanic();
      case "Asian":
        return race_asian();
      case "Other":
        return race_other();
      default:
        return key;
    }
  };

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

  let activeMetricKey = "";
  let activeMetricLabel = "";

  const hasMetricKey = (metricKey) =>
    rows.some((row) => row && Object.prototype.hasOwnProperty.call(row, metricKey));

  const setHash = (metricKey) => {
    if (typeof window === "undefined") return;
    if (!metricKey) return;
    const encoded = encodeURIComponent(metricKey);
    if (window.location.hash === `#${encoded}`) return;
    window.location.hash = encoded;
  };

  const clearHash = () => {
    if (typeof window === "undefined") return;
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", `${pathname}${search}`);
  };

  const openMetric = (metricKey, { updateHash = true } = {}) => {
    if (!metricKey) return;
    activeMetricKey = metricKey;
    activeMetricLabel = metricKey;
    if (updateHash) {
      setHash(metricKey);
    }
  };

  const closeMetric = ({ updateHash = true } = {}) => {
    activeMetricKey = "";
    activeMetricLabel = "";
    if (updateHash) {
      clearHash();
    }
  };

  const handleRowKeydown = (event, metricKey) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMetric(metricKey);
    }
  };

  const getHashMetric = () => {
    if (typeof window === "undefined") return "";
    const raw = window.location.hash.replace(/^#/, "");
    return raw ? decodeURIComponent(raw) : "";
  };

  const syncFromHash = () => {
    const metricKey = getHashMetric();
    if (metricKey && hasMetricKey(metricKey)) {
      openMetric(metricKey, { updateHash: false });
    } else if (!metricKey && activeMetricKey) {
      closeMetric({ updateHash: false });
    }
  };

  onMount(() => {
    syncFromHash();
    const handleHashChange = () => syncFromHash();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  });

  $: if (typeof window !== "undefined" && rows.length) {
    syncFromHash();
  }
</script>

<main class="mx-auto w-full max-w-5xl px-4 pb-16 pt-12 sm:px-6">
  <header class="mb-10">
    <p class="text-xs uppercase tracking-[0.12em] text-slate-500">
      {agency_preview_label()}
    </p>
    <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
      {agencyData?.agency ?? data.slug}
    </h1>
    <p class="mt-2 text-xs font-mono tracking-[0.08em] text-slate-500">
      {agency_slug_label()}: {data.slug}
    </p>
  </header>

  <AgencyMap
    heading={agency_location_heading()}
    loadingLabel={agency_map_loading()}
    addressResponse={geocodeAddressResponse}
  />

  {#if metadata && metadataEntries.length > 0}
    <section class="mb-10">
      <h2 class="mb-4 text-xl font-semibold text-slate-900">{agency_metadata_heading()}</h2>
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

  {#each geocodeBlocks as block}
    <section class="mb-10">
      <h2 class="mb-4 text-xl font-semibold text-slate-900">{block.label}</h2>
      <details class="rounded-xl border border-slate-200 bg-white p-4">
        <summary class="cursor-pointer text-sm font-semibold text-slate-900">
          {agency_geocode_summary()}
        </summary>
        <div class="mt-3 rounded-xl bg-slate-900 p-4 text-slate-200 shadow-lg">
          <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono">{stableStringify(block.data)}</pre>
        </div>
      </details>
    </section>
  {/each}

  <section class="mb-10">
    <h2 class="mb-4 text-xl font-semibold text-slate-900">{agency_yearly_data_heading()}</h2>
    {#if years.length === 0}
      <p class="text-sm text-slate-500">{agency_no_rows()}</p>
    {:else}
      {#each years as year}
        <article class="relative mb-8">
          <h3
            class="flex h-7 w-full items-center border-b border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900"
          >
            {year}
          </h3>
          {#each rowsByYear[year] as entry, entryIndex}
            {#if rowsByYear[year].length > 1}
              <p class="mb-2 mt-4 text-sm text-slate-500">
                {agency_entry_label()} {entryIndex + 1}
              </p>
            {/if}
            <div class="mb-6 max-w-full overflow-x-auto overflow-y-visible rounded-xl border border-slate-200 bg-white">
              <table class="min-w-full table-auto border-separate border-spacing-0">
                <thead class="bg-slate-100">
                  <tr>
                    <th
                      class="bg-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-700 sm:px-4 sm:text-sm"
                    >
                      {agency_metric_header()}
                    </th>
                    {#each columnKeys as label}
                      <th
                        class="bg-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-700 sm:px-4 sm:text-sm"
                      >
                        {raceLabel(label)}
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  {#each getSortedEntries(entry) as [key, value]}
                    {@const columns = normalizeMetric(value)}
                    <tr
                      class="cursor-pointer hover:bg-slate-50"
                      role="button"
                      tabindex="0"
                      on:click={() => openMetric(key)}
                      on:keydown={(event) => handleRowKeydown(event, key)}
                    >
                      <td
                        class="px-2 py-2 text-xs font-medium text-slate-700 sm:px-4 sm:py-3 sm:text-sm whitespace-normal break-words leading-tight"
                      >
                        {key}
                      </td>
                    {#each columnKeys as label}
                      <td
                        class="px-2 py-2 text-sm font-mono text-slate-900 tabular-nums whitespace-nowrap sm:px-4 sm:py-3 sm:text-base"
                      >
                        {columns[label]}
                      </td>
                    {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/each}
        </article>
      {/each}
    {/if}
  </section>

  <details class="rounded-xl border border-slate-200 bg-white p-4">
    <summary class="cursor-pointer text-sm font-semibold text-slate-900">
      {agency_view_full_json()}
    </summary>
    <div class="mt-3 rounded-xl bg-slate-900 p-4 text-slate-200 shadow-lg">
      <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed font-mono">{stableStringify(agencyData)}</pre>
    </div>
  </details>
</main>

<MetricChartModal
  open={Boolean(activeMetricKey)}
  metricKey={activeMetricKey}
  metricLabel={activeMetricLabel}
  rows={rows}
  raceKeys={chartRaceKeys}
  baselines={baselines}
  agencyName={agencyData?.agency ?? data.slug}
  on:close={closeMetric}
/>
