<script lang="ts">
  export let value: string | number | null | undefined = "";
  export let metricKey: string = "";
  export let onOpen: ((key: string) => void) | undefined;
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

<button
  type="button"
  class="block w-full text-left text-xs font-medium text-slate-700 whitespace-normal break-words leading-tight sm:text-sm"
  on:click={handleClick}
>
  {displayValue}
</button>
