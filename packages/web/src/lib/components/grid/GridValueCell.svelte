<script lang="ts">
  export let value: string | number | null | undefined = "";
  export let pct: string | number | null | undefined = "";
  export let rank: string | number | null | undefined = "";
  export let percentile: string | number | null | undefined = "";
  export let metricKey: string = "";
  export let onOpen: ((key: string) => void) | undefined;
  export let isGroupByHeader = false;

  let displayValue = "—";
  let pctDisplay = "";
  let rankDisplay = "";
  let percentileDisplay = "";
  $: displayValue =
    value === null || value === undefined || value === "" ? "—" : String(value);
  $: pctDisplay = pct === null || pct === undefined || pct === "" ? "" : String(pct);
  $: rankDisplay = rank === null || rank === undefined || rank === "" ? "" : String(rank);
  $: percentileDisplay =
    percentile === null || percentile === undefined || percentile === ""
      ? ""
      : String(percentile);

  const handleClick = () => {
    if (!isGroupByHeader && onOpen && metricKey) {
      onOpen(metricKey);
    }
  };
</script>

<button type="button" class="block w-full text-left" on:click={handleClick}>
  <div class="flex flex-col gap-0.5">
    <span class="text-sm font-mono text-slate-900 tabular-nums whitespace-nowrap sm:text-base">
      {displayValue}
    </span>
    {#if pctDisplay || rankDisplay || percentileDisplay}
      <span class="text-[10px] text-slate-500 sm:text-xs">
        {#if pctDisplay}
          <span class="block">{pctDisplay} of tot</span>
        {/if}
        {#if rankDisplay}
          <span class="block">rank: {rankDisplay}</span>
        {/if}
        {#if percentileDisplay}
          <span class="block">%tile: {percentileDisplay}</span>
        {/if}
      </span>
    {/if}
  </div>
</button>
