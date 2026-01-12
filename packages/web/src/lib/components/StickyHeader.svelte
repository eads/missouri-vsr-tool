<script>
  import * as m from "$lib/paraglide/messages";
  import { onMount } from "svelte";
  import LocationPicker from "$lib/components/LocationPicker.svelte";

  export let showTitle = true;
  export let agencies = [];
  export let onSelect = () => {};

  let currentLang = "en";

  onMount(() => {
    const path = window.location.pathname;
    currentLang = path.startsWith("/es") ? "es" : "en";
  });

  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/(en|es)/, `/${newLang}`);
    window.location.href = newPath;
  };
</script>

<header class="sticky top-0 z-50 border-b-4 border-b-[#1E8E4F] bg-white/95 backdrop-blur-sm shadow-sm">
  <div class="mx-auto max-w-7xl px-4 md:px-6">
    <div class="flex items-center gap-4 py-3">
      {#if showTitle}
        <a href="/" class="shrink-0 text-lg font-bold text-[#1E8E4F] no-underline">
          {m.home_header_title()}
        </a>
        <div class="flex-1 max-w-md">
          <LocationPicker {agencies} {onSelect} compact={true} />
        </div>
      {/if}

      <div class="flex items-center gap-3" class:ml-auto={!showTitle}>
        <select
          bind:value={currentLang}
          onchange={handleLanguageChange}
          class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase text-slate-700 focus:border-[#1E8E4F] focus:outline-none"
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
        <a
          href="#donate"
          class="rounded-lg bg-[#1E8E4F] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[#166B3C]"
        >
          {m.home_donate_button()}
        </a>
      </div>
    </div>
  </div>
</header>
