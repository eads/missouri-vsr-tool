<script lang="ts">
  export let value: string | number | null | undefined = "";
  export let rank: string | number | null | undefined = "";
  export let metricKey: string = "";
  export let onOpen: ((key: string) => void) | undefined;
  export let isGroupByHeader = false;

  let displayValue = "—";
  let rankDisplay = "";
  $: displayValue =
    value === null || value === undefined || value === "" ? "—" : String(value);
  $: rankDisplay = rank === null || rank === undefined || rank === "" ? "" : String(rank);

  const handleClick = () => {
    if (!isGroupByHeader && onOpen && metricKey) {
      onOpen(metricKey);
    }
  };
</script>

<button type="button" class="block w-full text-left" on:click={handleClick}>
  <div class="flex flex-col gap-0.5">
    <span class="text-base font-mono text-slate-900 tabular-nums whitespace-nowrap sm:text-lg">
      {displayValue}
    </span>
    {#if rankDisplay}
      <span class="text-[10px] text-slate-500 sm:text-xs">
        {#if rankDisplay}
          <span class="block">{rankDisplay}</span>
        {/if}
      </span>
    {/if}
  </div>
</button>
