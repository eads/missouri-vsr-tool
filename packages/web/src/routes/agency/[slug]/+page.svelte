<svelte:head>
  <title>{data.data?.agency ?? data.slug} | {agency_title_suffix()}</title>
</svelte:head>

<script>
  import AgencyMap from "$lib/components/AgencyMap.svelte";
  import MetricChartModal from "$lib/components/MetricChartModal.svelte";
  import { onMount } from "svelte";
  import * as m from "$lib/paraglide/messages";
  import {
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
    race_native_american,
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
  const numberFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
  });
  const percentFormatter = new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  });

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
  let selectedYear = "";
  let selectedEntries = [];
  let metricGroups = [];
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

  $: if (years.length && (!selectedYear || !years.includes(selectedYear))) {
    selectedYear = years[0];
  }

  $: selectedEntries = selectedYear ? rowsByYear[selectedYear] ?? [] : [];
  $: metricGroups = getMetricGroups(selectedEntries);

  const formatValue = (value, { isPercentage = false } = {}) => {
    if (value === null || value === undefined) return "—";
    const formatNumeric = (numeric) =>
      isPercentage ? percentFormatter.format(numeric) : numberFormatter.format(numeric);
    if (typeof value === "number" && Number.isFinite(value)) {
      return formatNumeric(value);
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      if (value.trim() !== "" && Number.isFinite(numeric)) {
        return formatNumeric(numeric);
      }
      return value;
    }
    if (typeof value === "boolean") {
      return String(value);
    }
    return JSON.stringify(value);
  };

  const columnKeys = [
    "Total",
    "White",
    "Black",
    "Hispanic",
    "Native American",
    "Asian",
    "Other",
  ];
  const chartRaceKeys = columnKeys.filter((label) => label !== "Total");
  const priorityPrefix = "rates--totals-";

  const metricKeyForSlug = (slug) =>
    `metric_${slug}`
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase();

  const titleToken = (token) => {
    const lower = token.toLowerCase();
    if (lower === "acs") return "ACS";
    if (lower === "bac") return "BAC";
    if (lower === "dwi") return "DWI";
    if (lower === "hwy") return "Hwy";
    if (lower === "pct") return "Pct";
    if (lower === "us") return "US";
    return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
  };

  const humanizeMetricSlug = (slug) => {
    let leaf = slug;
    if (slug.includes("--")) {
      const parts = slug.split("--");
      leaf = parts[parts.length - 1];
    } else if (slug.startsWith("rates-")) {
      leaf = slug.slice("rates-".length);
    } else if (slug.startsWith("search-")) {
      leaf = slug.slice("search-".length);
    } else if (slug.startsWith("stops-")) {
      leaf = slug.slice("stops-".length);
    }

    const rawTokens = leaf.split("-").filter(Boolean);
    const tokens = [];

    for (let i = 0; i < rawTokens.length; i += 1) {
      const token = rawTokens[i];
      const nextToken = rawTokens[i + 1];
      if (/^\d+$/.test(token) && /^\d+$/.test(nextToken)) {
        tokens.push(`${token}-${nextToken}`);
        i += 1;
        continue;
      }
      tokens.push(titleToken(token));
    }

    return tokens.join(" ");
  };

  const metricLabelForKey = (slug) => {
    const key = metricKeyForSlug(slug);
    const labelFn = m?.[key];
    return labelFn ? labelFn() : humanizeMetricSlug(slug);
  };

  const sectionLabel = () =>
    typeof m.agency_section_label === "function" ? m.agency_section_label() : "Section";
  const tableLabel = () =>
    typeof m.agency_table_label === "function" ? m.agency_table_label() : "Table";

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
      case "Native American":
        return race_native_american();
      case "Asian":
        return race_asian();
      case "Other":
        return race_other();
      default:
        return key;
    }
  };

  const metricSuffixes = [
    { suffix: "-percentage", type: "percentage", priority: 0 },
    { suffix: "-rank", type: "rank", priority: 0 },
    { suffix: "-rank-no-mshp", type: "rank", priority: 1 },
    { suffix: "-percentile", type: "percentile", priority: 0 },
    { suffix: "-percentile-no-mshp", type: "percentile", priority: 1 },
  ];

  const getMetricGroups = (entries) => {
    const groups = {};

    (entries || []).forEach((entry) => {
      const key = entry?.slug;
      if (!key) return;
      let baseKey = key;
      let type = "base";
      let priority = 0;

      for (const suffix of metricSuffixes) {
        if (key.endsWith(suffix.suffix)) {
          baseKey = key.slice(0, -suffix.suffix.length);
          type = suffix.type;
          priority = suffix.priority;
          break;
        }
      }

      if (!groups[baseKey]) {
        groups[baseKey] = {
          key: baseKey,
          base: undefined,
          percentage: undefined,
          rank: undefined,
          percentile: undefined,
          percentagePriority: Infinity,
          rankPriority: Infinity,
          percentilePriority: Infinity,
        };
      }

      const group = groups[baseKey];

      if (type === "base") {
        group.base = entry;
      } else if (type === "percentage") {
        if (priority < group.percentagePriority) {
          group.percentage = entry;
          group.percentagePriority = priority;
        }
      } else if (type === "rank") {
        if (priority < group.rankPriority) {
          group.rank = entry;
          group.rankPriority = priority;
        }
      } else if (type === "percentile") {
        if (priority < group.percentilePriority) {
          group.percentile = entry;
          group.percentilePriority = priority;
        }
      }
    });

    return Object.values(groups)
      .filter((group) => group.base !== undefined)
      .sort((a, b) => {
        const aPriority = a.key.startsWith(priorityPrefix) ? 0 : 1;
        const bPriority = b.key.startsWith(priorityPrefix) ? 0 : 1;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return compareStrings(a.key, b.key);
      });
  };

  const normalizeMetric = (value, { isPercentage = false } = {}) => {
    const base = {
      Total: "—",
      White: "—",
      Black: "—",
      Hispanic: "—",
      "Native American": "—",
      Asian: "—",
      Other: "—",
    };

    if (value === null || value === undefined) {
      return base;
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      return { ...base, Total: formatValue(value, { isPercentage }) };
    }

    const record = value;
    return {
      Total: formatValue(record.Total ?? record.total, { isPercentage }),
      White: formatValue(record.White ?? record.white, { isPercentage }),
      Black: formatValue(record.Black ?? record.black, { isPercentage }),
      Hispanic: formatValue(record.Hispanic ?? record.hispanic, { isPercentage }),
      "Native American": formatValue(
        record["Native American"] ?? record.native_american ?? record["native american"],
        { isPercentage }
      ),
      Asian: formatValue(record.Asian ?? record.asian, { isPercentage }),
      Other: formatValue(record.Other ?? record.other, { isPercentage }),
    };
  };

  const hasSupplementValue = (value) =>
    value !== null && value !== undefined && value !== "—" && value !== "";

  const getMetricValue = (entry, label) => {
    if (entry === null || entry === undefined) return null;
    if (typeof entry !== "object" || Array.isArray(entry)) return entry;
    if (label === "Native American") {
      return entry["Native American"] ?? entry.native_american ?? entry["native american"];
    }
    const lower = label.toLowerCase();
    return entry[label] ?? entry[lower];
  };

  const formatPercentile = (value) => {
    const numeric = typeof value === "string" ? Number(value) : value;
    if (!Number.isFinite(numeric)) return formatValue(value);
    const rounded = Math.round(numeric);
    const mod100 = rounded % 100;
    let suffix = "th";
    if (mod100 < 11 || mod100 > 13) {
      const mod10 = rounded % 10;
      if (mod10 === 1) suffix = "st";
      else if (mod10 === 2) suffix = "nd";
      else if (mod10 === 3) suffix = "rd";
    }
    return `${rounded}${suffix}`;
  };

  let activeMetricKey = "";
  let activeMetricLabel = "";

  const hasMetricKey = (metricKey) => rows.some((row) => row?.slug === metricKey);

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
    activeMetricLabel = metricLabelForKey(metricKey);
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

  const selectYear = (year) => {
    selectedYear = year;
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
      <details class="rounded-xl border border-slate-200 bg-white p-4">
        <summary class="cursor-pointer text-sm font-semibold text-slate-900">
          {agency_metadata_heading()}
        </summary>
        <dl class="mt-4 grid gap-3">
          {#each metadataEntries as [key, value]}
            <div
              class="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(160px,1fr)_2fr] md:gap-4"
            >
              <dt class="text-sm font-semibold text-slate-700">{key}</dt>
              <dd class="text-sm text-slate-600">{formatValue(value)}</dd>
            </div>
          {/each}
        </dl>
      </details>
    </section>
  {/if}

  <section class="mb-10">
    <h2 class="mb-4 text-xl font-semibold text-slate-900">{agency_yearly_data_heading()}</h2>
    {#if years.length === 0}
      <p class="text-sm text-slate-500">{agency_no_rows()}</p>
    {:else}
      <article class="relative mb-8">
        {#if metricGroups.length === 0}
          <p class="mt-4 text-sm text-slate-500">{agency_no_rows()}</p>
        {:else}
          <div class="mb-6 max-w-full overflow-x-auto overflow-y-visible rounded-xl border border-slate-200 bg-white md:mx-[calc(50%-50vw+2rem)] md:w-[calc(100vw-4rem)] md:max-w-none">
            <div
              class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-4"
              role="tablist"
              aria-label={agency_yearly_data_heading()}
            >
              {#each years as year}
                <button
                  type="button"
                  role="tab"
                  aria-selected={year === selectedYear}
                  class={`rounded-full border px-3 py-1 text-[11px] font-semibold transition sm:text-xs ${
                    year === selectedYear
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                  on:click={() => selectYear(year)}
                >
                  {year}
                </button>
              {/each}
            </div>
            <table class="w-full min-w-full table-auto border-separate border-spacing-0 sm:min-w-max">
              <thead class="bg-slate-100">
                <tr>
                  <th
                    class="w-px bg-slate-100 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:text-xs"
                  >
                    {sectionLabel()}
                  </th>
                  <th
                    class="w-[180px] max-w-[220px] bg-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-700 sm:px-4 sm:text-sm"
                  >
                    {agency_metric_header()}
                  </th>
                  {#each columnKeys as label}
                    <th
                      class="min-w-[120px] bg-slate-100 px-2 py-2 text-left text-xs font-semibold text-slate-700 sm:px-4 sm:text-sm"
                    >
                      {raceLabel(label)}
                    </th>
                  {/each}
                  <th
                    class="min-w-[160px] bg-slate-100 px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-4 sm:text-xs"
                  >
                    {tableLabel()}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
              {#each metricGroups as metric}
                {@const isPercentageMetric = metric.key.endsWith("-percentage")}
                {@const columns = normalizeMetric(metric.base, { isPercentage: isPercentageMetric })}
                {@const percentageColumns = metric.percentage
                  ? normalizeMetric(metric.percentage, { isPercentage: true })
                  : null}
                <tr
                  class="cursor-pointer hover:bg-slate-50"
                  role="button"
                  tabindex="0"
                  on:click={() => openMetric(metric.key)}
                  on:keydown={(event) => handleRowKeydown(event, metric.key)}
                >
                  <td
                    class="w-px px-2 py-2 align-top text-[10px] text-slate-500 sm:px-4 sm:py-3 sm:text-xs whitespace-normal break-words leading-tight"
                  >
                    {formatValue(metric.base?.section)}
                  </td>
                  <td
                    class="w-[180px] max-w-[220px] px-2 py-2 align-top text-xs font-medium text-slate-700 sm:px-4 sm:py-3 sm:text-sm whitespace-normal break-words leading-tight"
                  >
                    {metric.base?.metric ? formatValue(metric.base?.metric) : metricLabelForKey(metric.key)}
                  </td>
                  {#each columnKeys as label}
                    {@const percentageValue = percentageColumns?.[label]}
                    {@const rankValue = getMetricValue(metric.rank, label)}
                    {@const percentileValue = getMetricValue(metric.percentile, label)}
                    {@const showPctTot = hasSupplementValue(percentageValue)}
                    {@const showRank = hasSupplementValue(rankValue)}
                    {@const showPercentile = hasSupplementValue(percentileValue)}
                    <td class="min-w-[120px] px-2 py-2 align-top sm:px-4 sm:py-3">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-sm font-mono text-slate-900 tabular-nums whitespace-nowrap sm:text-base">
                          {columns[label]}
                        </span>
                        {#if showPctTot || showRank || showPercentile}
                          <span class="text-[10px] text-slate-500 sm:text-xs sm:text-slate-500">
                            {#if showPctTot}
                              <span class="block">{percentageValue} of tot</span>
                            {/if}
                            {#if showRank}
                              <span class="block">
                                rank: {formatValue(rankValue)}
                              </span>
                            {/if}
                            {#if showPercentile}
                              <span class="block">
                                %tile: {formatPercentile(percentileValue)}
                              </span>
                            {/if}
                          </span>
                        {/if}
                      </div>
                    </td>
                  {/each}
                  <td class="min-w-[160px] px-2 py-2 align-top text-[10px] text-slate-500 sm:px-4 sm:py-3 sm:text-xs">
                    {formatValue(metric.base?.table)}
                  </td>
                </tr>
              {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </article>
    {/if}
  </section>

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
