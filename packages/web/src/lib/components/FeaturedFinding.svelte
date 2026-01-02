<script>
  import { onMount } from "svelte";
  import * as m from "$lib/paraglide/messages";

  export let findings = [];

  let currentIndex = 0;
  let intervalId;

  const rotateFinding = () => {
    currentIndex = (currentIndex + 1) % findings.length;
  };

  const handleSurprise = () => {
    currentIndex = Math.floor(Math.random() * findings.length);
  };

  onMount(() => {
    if (findings.length > 1) {
      intervalId = setInterval(rotateFinding, 8000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });

  $: currentFinding = findings[currentIndex] || {};
</script>

{#if findings.length > 0}
  <div class="relative overflow-hidden rounded-lg border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6">
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {m.home_featured_heading()}
        </h3>
        <p class="mt-2 text-lg font-medium leading-relaxed text-slate-900">
          {currentFinding.text || ""}
        </p>
        {#if currentFinding.detail}
          <p class="mt-1 text-sm text-slate-600">{currentFinding.detail}</p>
        {/if}
      </div>
      <button
        type="button"
        on:click={handleSurprise}
        class="shrink-0 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition-all hover:border-indigo-300 hover:bg-indigo-50"
      >
        {m.home_surprise_button()}
      </button>
    </div>

    {#if findings.length > 1}
      <div class="mt-4 flex gap-1.5">
        {#each findings as _, index}
          <button
            type="button"
            on:click={() => currentIndex = index}
            class="h-1.5 flex-1 rounded-full transition-all {index === currentIndex
              ? 'bg-indigo-600'
              : 'bg-indigo-200 hover:bg-indigo-300'}"
            aria-label="View finding {index + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </div>
{/if}
