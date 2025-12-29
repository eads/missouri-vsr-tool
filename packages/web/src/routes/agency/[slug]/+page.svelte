<svelte:head>
  <title>{data.data?.agency ?? data.slug} | {agency_title_suffix()}</title>
</svelte:head>

<script>
  import { Grid, PlainTableCssTheme } from "@mediakular/gridcraft";
  import AgencyMap from "$lib/components/AgencyMap.svelte";
  import GridMetricCell from "$lib/components/grid/GridMetricCell.svelte";
  import GridTextCell from "$lib/components/grid/GridTextCell.svelte";
  import GridValueCell from "$lib/components/grid/GridValueCell.svelte";
  import MetricChartModal from "$lib/components/MetricChartModal.svelte";
  import { onMount } from "svelte";
  import * as m from "$lib/paraglide/messages";
  import {
    agency_geocode_summary,
    agency_location_heading,
    agency_map_loading,
    agency_address_label,
    agency_type_label,
    agency_phone_label,
    agency_jurisdiction_label,
    agency_metadata_heading,
    agency_metric_header,
    agency_no_rows,
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
  const stopCountFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
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
  let gridRows = [];
  let gridColumns = [];
  let gridFilters = [];
  let groupBy = "section_id";
  let metricSearch = "";
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
  $: gridRows = metricGroups.map((metric) => {
    const isPercentageMetric = metric.key.endsWith("-percentage");
    const columns = normalizeMetric(metric.base, { isPercentage: isPercentageMetric });
    const percentageColumns = metric.percentage
      ? normalizeMetric(metric.percentage, { isPercentage: true })
      : null;
    const sectionValue = metric.base?.section ?? "";
    const sectionId = metric.base?.section_id ?? sectionValue ?? "";
    const row = {
      id: metric.base?.row_id ?? metric.key,
      metricKey: metric.key,
      section: formatValue(sectionValue),
      section_id: sectionId === null || sectionId === undefined ? "" : String(sectionId),
      metric: metric.base?.metric ? formatValue(metric.base?.metric) : metricLabelForKey(metric.key),
      table: formatValue(metric.base?.table),
    };

    columnKeys.forEach((label) => {
      const percentageValue = percentageColumns?.[label];
      const rankValue = getMetricValue(metric.rank, label);
      const percentileValue = getMetricValue(metric.percentile, label);
      row[label] = {
        value: columns[label],
        pct: hasSupplementValue(percentageValue) ? percentageValue : "",
        rank: hasSupplementValue(rankValue) ? formatValue(rankValue) : "",
        percentile: hasSupplementValue(percentileValue) ? formatPercentile(percentileValue) : "",
      };
    });

    return row;
  });

  $: gridColumns = [
    {
      key: "section_id",
      title: sectionLabel(),
      accessor: (row) => ({
        value: row.section,
        id: row.section_id,
      }),
      sortValue: (row) => row.section ?? "",
      renderComponent: GridTextCell,
    },
    {
      key: "metric",
      title: agency_metric_header(),
      accessor: (row) => ({
        value: row.metric,
        metricKey: row.metricKey,
        onOpen: openMetric,
      }),
      renderComponent: GridMetricCell,
    },
    ...columnKeys.map((label) => ({
      key: label,
      title: raceLabel(label),
      accessor: (row) => ({
        ...row[label],
        metricKey: row.metricKey,
        onOpen: openMetric,
      }),
      renderComponent: GridValueCell,
    })),
    {
      key: "table",
      title: tableLabel(),
      accessor: (row) => ({
        value: row.table,
        metricKey: row.metricKey,
        onOpen: openMetric,
        variant: "table",
      }),
      renderComponent: GridTextCell,
    },
  ];

  $: {
    const trimmed = metricSearch.trim().toLowerCase();
    if (!trimmed) {
      gridFilters = [];
    } else {
      gridFilters = [
        {
          key: "metric-search",
          columns: ["metric"],
          filter: (columnValue) => {
            if (columnValue === null || columnValue === undefined) return false;
            const value =
              typeof columnValue === "object" && columnValue !== null
                ? columnValue.value
                : columnValue;
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(trimmed);
          },
          active: true,
        },
      ];
    }
  }

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

  const cleanMetadataValue = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value).trim();
    if (!stringValue || stringValue.toLowerCase() === "nan") return "";
    return stringValue;
  };

  let agencyType = "";
  let addressLine = "";
  let addressCityLine = "";
  let addressDisplay = [];
  let mapHref = "";
  let rawPhone = "";
  let phoneHref = "";
  let jurisdictionDisplay = "";
  let showJurisdiction = false;
  let addressState = "";
  let stopVolumeLead = "";
  let stopVolumeLeadPunctuation = ".";
  let stopVolumeSegmentLabel = "";
  let stopVolumeSegmentPrefix = "";
  let stopVolumeSegmentSuffix = "";
  let stopVolumeSegmentPunctuation = ".";
  let stopVolumeRankSentence = "";
  const formatPhone = (value) => {
    const digits = value.replace(/\D+/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return value;
  };
  $: agencyType = cleanMetadataValue(metadata?.AgencyType);
  $: {
    const typeKey = agencyType.toLowerCase();
    const cityValue =
      cleanMetadataValue(metadata?.AddressCity) ||
      cleanMetadataValue(metadata?.geocode_jurisdiction_response?.results?.[0]?.address_components?.city) ||
      cleanMetadataValue(metadata?.geocode_address_response?.results?.[0]?.address_components?.city);
    const countyValue =
      cleanMetadataValue(metadata?.geocode_jurisdiction_county) ||
      cleanMetadataValue(metadata?.geocode_address_county);
    const stateValue =
      cleanMetadataValue(metadata?.geocode_jurisdiction_response?.results?.[0]?.address_components?.state) ||
      cleanMetadataValue(metadata?.geocode_address_response?.results?.[0]?.address_components?.state) ||
      cleanMetadataValue(metadata?.geocode_address_response?.input?.address_components?.state);
    addressState = stateValue;
    const isRail = typeKey.includes("rail");
    const isAirport = typeKey.includes("airport");
    const isMunicipal = typeKey.includes("municipal");
    const isCounty = typeKey.includes("county");
    const isStateAgency = typeKey.includes("state");

    if (isRail) {
      jurisdictionDisplay = "";
      showJurisdiction = false;
    } else if (isAirport) {
      jurisdictionDisplay = "airport";
      showJurisdiction = true;
    } else if (isMunicipal) {
      jurisdictionDisplay = cityValue || countyValue || stateValue;
      showJurisdiction = Boolean(jurisdictionDisplay);
    } else if (isCounty) {
      jurisdictionDisplay = countyValue || cityValue || stateValue;
      showJurisdiction = Boolean(jurisdictionDisplay);
    } else if (isStateAgency) {
      jurisdictionDisplay = stateValue || "state";
      showJurisdiction = Boolean(jurisdictionDisplay);
    } else {
      jurisdictionDisplay = countyValue || cityValue || stateValue;
      showJurisdiction = Boolean(jurisdictionDisplay);
    }
  }
  $: {
    const line1 = cleanMetadataValue(metadata?.AddressLine1);
    const line2 = cleanMetadataValue(metadata?.AddressLine2);
    const city = cleanMetadataValue(metadata?.AddressCity);
    const zip = cleanMetadataValue(metadata?.AddressZip);
    addressLine = [line1, line2].filter(Boolean).join(" ");
    const cityState = [city, addressState].filter(Boolean).join(", ");
    addressCityLine = [cityState, zip].filter(Boolean).join(" ");
    addressDisplay = [addressLine, addressCityLine].filter(Boolean);
    const addressQuery =
      cleanMetadataValue(metadata?.geocode_address_query) ||
      [addressLine, cityState, zip].filter(Boolean).join(", ");
    mapHref = addressQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`
      : "";
  }
  $: rawPhone = cleanMetadataValue(metadata?.AgencyPhone);
  $: {
    const phoneDigits = rawPhone.replace(/\D+/g, "");
    phoneHref = phoneDigits ? `tel:${phoneDigits}` : "";
  }
  $: phoneDisplay = rawPhone ? formatPhone(rawPhone) : "";

  $: {
    const latestYear = years.find((year) => Number.isFinite(Number(year)));
    stopVolumeLead = "";
    stopVolumeLeadPunctuation = ".";
    stopVolumeSegmentLabel = "";
    stopVolumeSegmentPrefix = "";
    stopVolumeSegmentSuffix = "";
    stopVolumeSegmentPunctuation = ".";
    stopVolumeRankSentence = "";
    if (!latestYear) {
      stopVolumeLead = "";
    } else {
      const yearValue = Number(latestYear);
      const totalEntry = rows.find(
        (row) =>
          Number(row?.year) === yearValue && row?.slug === "rates--totals--all-stops"
      );
      const percentileEntry =
        rows.find(
          (row) =>
            Number(row?.year) === yearValue &&
            row?.slug === "rates--totals--all-stops-percentile"
        ) ||
        rows.find(
          (row) =>
            Number(row?.year) === yearValue &&
            row?.slug === "rates--totals--all-stops-percentile-no-mshp"
        );
      const rankEntry =
        rows.find(
          (row) =>
            Number(row?.year) === yearValue &&
            row?.slug === "rates--totals--all-stops-rank"
        ) ||
        rows.find(
          (row) =>
            Number(row?.year) === yearValue &&
            row?.slug === "rates--totals--all-stops-rank-no-mshp"
        );
      const totalValue = getMetricValue(totalEntry, "Total");
      const totalNumeric = typeof totalValue === "string" ? Number(totalValue) : totalValue;
      if (!Number.isFinite(totalNumeric)) {
        stopVolumeLead = "";
      } else {
        const agencyName = agencyData?.agency ?? data.slug;
        const totalStops = stopCountFormatter.format(totalNumeric);
        const leadFn = m?.agency_stop_volume_lead;
        const lead =
          typeof leadFn === "function"
            ? leadFn({ agency: agencyName, stops: totalStops, year: latestYear })
            : `${agencyName} had ${totalStops} stops in ${latestYear}`;
        stopVolumeLead = lead;
        stopVolumeLeadPunctuation = /[.!?]$/.test(lead.trim()) ? "" : ".";

        const percentileValue = getMetricValue(percentileEntry, "Total");
        const percentileNumeric =
          typeof percentileValue === "string" ? Number(percentileValue) : percentileValue;
        let segmentSentence = "";
        let segmentLabel = "";
        if (Number.isFinite(percentileNumeric)) {
          const topThreshold = 80;
          const bottomThreshold = 20;
          let segmentKey = "middle";
          if (percentileNumeric >= topThreshold) segmentKey = "top";
          else if (percentileNumeric <= bottomThreshold) segmentKey = "bottom";
          segmentLabel =
            segmentKey === "top"
              ? typeof m?.agency_stop_volume_segment_top === "function"
                ? m.agency_stop_volume_segment_top()
                : "top 20%"
              : segmentKey === "bottom"
              ? typeof m?.agency_stop_volume_segment_bottom === "function"
                ? m.agency_stop_volume_segment_bottom()
                : "bottom 20%"
              : typeof m?.agency_stop_volume_segment_middle === "function"
              ? m.agency_stop_volume_segment_middle()
              : "middle 60%";
          const segmentFn = m?.agency_stop_volume_segment_sentence;
          segmentSentence =
            typeof segmentFn === "function"
              ? segmentFn({ segment: segmentLabel })
              : `putting it in the ${segmentLabel} of departments by stop volume`;
        }
        const rankValue = getMetricValue(rankEntry, "Total");
        const rankNumeric = typeof rankValue === "string" ? Number(rankValue) : rankValue;
        let rankSentence = "";
        if (Number.isFinite(rankNumeric)) {
          const rankRounded = Math.round(rankNumeric);
          if (rankRounded === 1) {
            const rankHighestFn = m?.agency_stop_volume_rank_highest;
            rankSentence =
              typeof rankHighestFn === "function"
                ? rankHighestFn()
                : "It is the highest volume agency in the state.";
          } else {
            const rankDisplay = stopCountFormatter.format(rankRounded);
            const agencyCount = Number(data?.agencyCount);
            const totalDisplay =
              Number.isFinite(agencyCount) && agencyCount > 0
                ? stopCountFormatter.format(agencyCount)
                : "";
            const rankFn = m?.agency_stop_volume_ranked;
            const rankSimpleFn = m?.agency_stop_volume_ranked_simple;
            if (totalDisplay) {
              rankSentence =
                typeof rankFn === "function"
                  ? rankFn({ rank: rankDisplay, total: totalDisplay })
                  : `Ranked #${rankDisplay} out of ${totalDisplay} departments.`;
            } else {
              rankSentence =
                typeof rankSimpleFn === "function"
                  ? rankSimpleFn({ rank: rankDisplay })
                  : `Ranked #${rankDisplay}.`;
            }
          }
        }

        if (segmentSentence && segmentLabel) {
          const segmentIndex = segmentSentence.indexOf(segmentLabel);
          if (segmentIndex >= 0) {
            stopVolumeSegmentPrefix = segmentSentence.slice(0, segmentIndex);
            stopVolumeSegmentLabel = segmentLabel;
            stopVolumeSegmentSuffix = segmentSentence.slice(
              segmentIndex + segmentLabel.length
            );
            stopVolumeSegmentPunctuation = stopVolumeSegmentSuffix.trim().endsWith(".")
              ? ""
              : ".";
          } else {
            stopVolumeSegmentPrefix = segmentSentence;
            stopVolumeSegmentLabel = "";
            stopVolumeSegmentSuffix = "";
            stopVolumeSegmentPunctuation = segmentSentence.trim().endsWith(".") ? "" : ".";
          }
        }
        stopVolumeRankSentence = rankSentence;
      }
    }
  }

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
    <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
      {agencyData?.agency ?? data.slug}
    </h1>
  </header>

  <section class="mb-10 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-start">
    <div class="rounded-2xl border border-slate-200 bg-white p-3">
      {#if stopVolumeLead}
        <p class="mb-4 text-xl font-normal text-slate-800 leading-snug">
          {stopVolumeLead}
          {#if stopVolumeSegmentLabel}
            {" "}
            {stopVolumeSegmentPrefix}<strong class="font-semibold text-slate-900"
              >{stopVolumeSegmentLabel}</strong
            >{stopVolumeSegmentSuffix}{stopVolumeSegmentPunctuation}
          {:else}
            {stopVolumeLeadPunctuation}
          {/if}
          {#if stopVolumeRankSentence}
            {" "}{stopVolumeRankSentence}
          {/if}
        </p>
      {/if}
      <dl class="divide-y divide-slate-100">
        {#if showJurisdiction}
          <div class="grid gap-1 py-1.5 grid-cols-[110px_1fr] items-start">
            <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {agency_jurisdiction_label()}
            </dt>
            <dd class="text-sm font-medium text-slate-700">
              {jurisdictionDisplay}
            </dd>
          </div>
        {/if}
        <div class="grid gap-1 py-1.5 grid-cols-[110px_1fr] items-start">
          <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {agency_type_label()}
          </dt>
          <dd class="text-sm font-medium text-slate-700">
            {agencyType || "—"}
          </dd>
        </div>
        <div class="grid gap-1 py-1.5 grid-cols-[110px_1fr] items-start">
          <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {agency_address_label()}
          </dt>
          <dd class="text-sm font-medium text-slate-700">
            {#if addressDisplay.length}
              {#if mapHref}
                <a
                  class="block"
                  href={mapHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {#each addressDisplay as line}
                    <span class="block">{line}</span>
                  {/each}
                </a>
              {:else}
                {#each addressDisplay as line}
                  <span class="block">{line}</span>
                {/each}
              {/if}
            {:else}
              —
            {/if}
          </dd>
        </div>
        <div class="grid gap-1 py-1.5 grid-cols-[110px_1fr] items-start">
          <dt class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {agency_phone_label()}
          </dt>
          <dd class="text-sm font-medium text-slate-700">
            {#if phoneDisplay}
              {#if phoneHref}
                <a href={phoneHref}>
                  {phoneDisplay}
                </a>
              {:else}
                {phoneDisplay}
              {/if}
            {:else}
              —
            {/if}
          </dd>
        </div>
      </dl>
    </div>
    <AgencyMap
      heading={agency_location_heading()}
      loadingLabel={agency_map_loading()}
      addressResponse={geocodeAddressResponse}
      showHeading={false}
      className="mb-0"
      heightClass="h-[280px]"
    />
  </section>


  <section class="mb-10">
    <h2 class="mb-4 text-xl font-semibold text-slate-900">{agency_yearly_data_heading()}</h2>
    {#if years.length === 0}
      <p class="text-sm text-slate-500">{agency_no_rows()}</p>
    {:else}
      <article class="relative mb-8">
        {#if metricGroups.length === 0}
          <p class="mt-4 text-sm text-slate-500">{agency_no_rows()}</p>
        {:else}
          <div class="mb-6 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white md:mx-[calc(50%-50vw+2rem)] md:w-[calc(100vw-4rem)] md:max-w-none">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 sm:px-4">
              <div role="tablist" aria-label={agency_yearly_data_heading()} class="flex flex-wrap items-center gap-2">
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
              <div class="flex w-full sm:w-auto">
                <input
                  type="search"
                  class="h-8 w-full rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none sm:w-52 sm:text-sm"
                  placeholder={m?.agency_metric_search_placeholder?.() ?? "Search metrics"}
                  aria-label={m?.agency_metric_search_label?.() ?? "Search metrics"}
                  bind:value={metricSearch}
                />
              </div>
            </div>
            <div
              class="gridcraft-table"
              style="
                --gc-main-color: #ffffff;
                --gc-secondary-color: #f8fafc;
                --gc-tertiary-color: #ffffff;
                --gc-text-color: #0f172a;
                --gc-th-font-size: 0.65rem;
                --gc-th-padding: 0.4rem 0.6rem;
                --gc-th-text-transform: uppercase;
                --gc-td-padding: 0.45rem 0.6rem;
                --gc-table-radius: 0px;
              "
            >
              <Grid
                data={gridRows}
                columns={gridColumns}
                filters={gridFilters}
                groupBy={groupBy}
                theme={PlainTableCssTheme}
              />
            </div>
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
