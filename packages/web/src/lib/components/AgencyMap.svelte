<script>
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  export let addressResponse = null;
  export let fallbackResponse = null;
  export let heading = "Location";
  export let loadingLabel = "Map loading…";
  export let showHeading = true;
  export let className = "";
  export let heightClass = "h-[360px]";
  export let agencyId = "";
  export let pmtilesUrl = "";
  export let pmtilesSourceLayer = "counties";
  export let agencyBoundaryBasePath = "/data/agency_boundaries";

  let MapLibre;
  let Marker;
  let VectorTileSource;
  let GeoJSONSource;
  let FillLayer;
  let LineLayer;

  let mapReady = false;
  let center = null;
  let mapInstance;
  let boundaryData = null;
  let boundaryBounds = null;
  let boundaryUrl = "";
  let lastBoundaryUrl = "";
  let lastBoundsKey = "";
  let pmtilesProtocol;
  let pmtilesReady = false;
  let pmtilesSourceUrl = "";

  const mapStyle = "https://tiles.openfreemap.org/styles/bright";
  const defaultCenter = [-92.6037607, 38.5767017];

  const boundaryFillPaint = {
    "fill-color": "#3b82f6",
    "fill-opacity": 0.25,
  };
  const boundaryLinePaint = {
    "line-color": "#1d4ed8",
    "line-width": 2,
  };
  const countiesLinePaint = {
    "line-color": "#94a3b8",
    "line-width": 0.6,
    "line-opacity": 0.35,
  };
  const placesLinePaint = {
    "line-color": "#cbd5f5",
    "line-width": 0.6,
    "line-opacity": 0.4,
  };

  const getLocation = (response) => response?.results?.[0]?.location;

  $: {
    const location = getLocation(addressResponse) ?? getLocation(fallbackResponse);
    const lng = location?.lng != null ? Number(location.lng) : null;
    const lat = location?.lat != null ? Number(location.lat) : null;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      center = [lng, lat];
    } else {
      center = defaultCenter;
    }
  }

  $: pmtilesSourceUrl = pmtilesUrl
    ? pmtilesUrl.startsWith("pmtiles://")
      ? pmtilesUrl
      : `pmtiles://${pmtilesUrl}`
    : "";

  onMount(async () => {
    if (!browser) return;
    const mod = await import("svelte-maplibre-gl");
    MapLibre = mod.MapLibre;
    Marker = mod.Marker;
    VectorTileSource = mod.VectorTileSource;
    GeoJSONSource = mod.GeoJSONSource;
    FillLayer = mod.FillLayer;
    LineLayer = mod.LineLayer;

    if (pmtilesUrl) {
      try {
        const pmtilesModule = await import("pmtiles");
        pmtilesProtocol = new pmtilesModule.Protocol();
        const maplibreModule = await import(/* @vite-ignore */ "maplibre-gl");
        maplibreModule.addProtocol?.("pmtiles", pmtilesProtocol.tile);
        pmtilesReady = true;
      } catch (error) {
        pmtilesReady = false;
      }
    }

    mapReady = true;
  });

  $: boundaryUrl = agencyId ? `${agencyBoundaryBasePath}/${agencyId}.geojson` : "";

  $: if (!boundaryUrl) {
    boundaryData = null;
    boundaryBounds = null;
    lastBoundaryUrl = "";
  }

  $: if (browser && boundaryUrl && boundaryUrl !== lastBoundaryUrl) {
    lastBoundaryUrl = boundaryUrl;
    fetch(boundaryUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        boundaryData = data;
      })
      .catch(() => {
        boundaryData = null;
      });
  }

  const updateBoundaryBounds = () => {
    if (!boundaryData) {
      boundaryBounds = null;
      return;
    }
    const coords = [];
    const pushCoords = (geomCoords) => {
      if (!Array.isArray(geomCoords)) return;
      if (typeof geomCoords[0] === "number") {
        coords.push(geomCoords);
        return;
      }
      geomCoords.forEach(pushCoords);
    };
    const features = boundaryData?.features || [];
    features.forEach((feature) => {
      const geometry = feature?.geometry;
      if (!geometry) return;
      pushCoords(geometry.coordinates);
    });
    if (!coords.length) {
      boundaryBounds = null;
      return;
    }
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    coords.forEach(([lng, lat]) => {
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    });
    if (!Number.isFinite(minLng)) {
      boundaryBounds = null;
      return;
    }
    boundaryBounds = [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  };

  const fitToBounds = () => {
    if (!mapInstance || !boundaryBounds) return;
    const boundsKey = boundaryBounds.flat().join(",");
    if (boundsKey && boundsKey === lastBoundsKey) return;
    lastBoundsKey = boundsKey;
    const applyFit = () => {
      mapInstance.fitBounds(boundaryBounds, {
        padding: 32,
        duration: 0,
      });
      mapInstance.once("moveend", () => {
        mapInstance.zoomTo(mapInstance.getZoom() - 0.4, { duration: 0 });
      });
    };
    if (mapInstance.loaded?.()) {
      applyFit();
    } else {
      mapInstance.once("load", applyFit);
    }
  };

  $: if (boundaryData) {
    updateBoundaryBounds();
  }

  $: if (boundaryBounds && mapInstance) {
    fitToBounds();
  }
</script>

<section class={`mb-10 ${className}`.trim()}>
  {#if showHeading && heading}
    <h2 class="mb-4 text-xl font-semibold text-slate-900">{heading}</h2>
  {/if}
  {#if mapReady && MapLibre && center}
    <div class={`${heightClass} w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-200`}>
      <svelte:component
        this={MapLibre}
        bind:map={mapInstance}
        class="h-full w-full"
        style={mapStyle}
        center={center}
        zoom={14}
      >
        {#if pmtilesReady && pmtilesSourceUrl && VectorTileSource}
          <svelte:component this={VectorTileSource} id="mo-jurisdictions" url={pmtilesSourceUrl} />
          <svelte:component
            this={LineLayer}
            id="mo-jurisdictions-counties"
            source="mo-jurisdictions"
            source-layer="counties"
            paint={countiesLinePaint}
          />
          <svelte:component
            this={LineLayer}
            id="mo-jurisdictions-places"
            source="mo-jurisdictions"
            source-layer="places"
            paint={placesLinePaint}
          />
        {/if}

        {#if boundaryData && GeoJSONSource}
          <svelte:component this={GeoJSONSource} id="agency-boundary" data={boundaryData}>
            <svelte:component this={FillLayer} id="agency-boundary-fill" paint={boundaryFillPaint} />
            <svelte:component this={LineLayer} id="agency-boundary-line" paint={boundaryLinePaint} />
          </svelte:component>
        {/if}

        <svelte:component this={Marker} lnglat={center} color="#1d4ed8" />
      </svelte:component>
    </div>
  {:else}
    <p class="text-sm text-slate-500">{loadingLabel}</p>
  {/if}
</section>
