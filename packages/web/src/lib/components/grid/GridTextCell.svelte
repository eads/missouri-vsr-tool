<script lang="ts">
  export let value: string | number | null | undefined = "";
  export let id: string | number | null | undefined = "";
  export let metricKey: string = "";
  export let onOpen: ((key: string) => void) | undefined;
  export let variant: "section" | "table" | "default" = "default";
  export let isGroupByHeader = false;

  let displayValue = "—";
  $: displayValue =
    value === null || value === undefined || value === "" ? "—" : String(value);

  const handleClick = () => {
    if (!isGroupByHeader && onOpen && metricKey) {
      onOpen(metricKey);
    }
  };
</script>

{#if isGroupByHeader}
  <span class="text-xs font-semibold text-slate-600" data-group-id={id}>{displayValue}</span>
{:else}
  <button
    type="button"
    class={`block w-full text-left ${
      variant === "section"
        ? "text-[10px] text-slate-500 whitespace-normal break-words leading-tight sm:text-xs"
        : variant === "table"
        ? "text-[10px] text-slate-500 sm:text-xs"
        : "text-xs text-slate-600"
    }`}
    on:click={handleClick}
  >
    {displayValue}
  </button>
{/if}
