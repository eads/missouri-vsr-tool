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

  let MapLibre;
  let Marker;
  let mapReady = false;
  let center = null;

  const mapStyle = "https://tiles.openfreemap.org/styles/bright";
  const defaultCenter = [-92.6037607, 38.5767017];

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

  onMount(async () => {
    if (!browser) return;
    const mod = await import("svelte-maplibre-gl");
    MapLibre = mod.MapLibre;
    Marker = mod.Marker;
    mapReady = true;
  });
</script>

<section class={`mb-10 ${className}`.trim()}>
  {#if showHeading && heading}
    <h2 class="mb-4 text-xl font-semibold text-slate-900">{heading}</h2>
  {/if}
  {#if mapReady && MapLibre && center}
    <div class={`${heightClass} w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-200`}>
      <svelte:component
        this={MapLibre}
        class="h-full w-full"
        style={mapStyle}
        center={center}
        zoom={14}
      >
        <svelte:component this={Marker} lnglat={center} color="#1d4ed8" />
      </svelte:component>
    </div>
  {:else}
    <p class="text-sm text-slate-500">{loadingLabel}</p>
  {/if}
</section>
