<script>
  import * as m from "$lib/paraglide/messages";

  export let title = "";
  export let description = "";
  export let preview = "";
  export let expandedContent = "";
  export let onClick = undefined;
  export let href = undefined;

  let isExpanded = false;
  let isHovered = false;

  const handleClick = (e) => {
    if (expandedContent && !href) {
      e.preventDefault();
      isExpanded = !isExpanded;
      if (onClick) onClick();
    } else if (onClick) {
      onClick();
    }
  };
</script>

{#if href}
  <a
    {href}
    on:mouseenter={() => isHovered = true}
    on:mouseleave={() => isHovered = false}
    class="group block rounded-lg border border-slate-200 bg-white p-6 transition-all hover:border-indigo-400 hover:shadow-md relative overflow-hidden"
  >
    <h3 class="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
      {title}
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

    {#if preview && isHovered}
      <div class="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-200">
        <p class="text-xs font-medium text-indigo-600">{preview}</p>
      </div>
    {/if}
  </a>
{:else}
  <button
    type="button"
    on:click={handleClick}
    on:mouseenter={() => isHovered = true}
    on:mouseleave={() => isHovered = false}
    class="group w-full rounded-lg border border-slate-200 bg-white p-6 text-left transition-all hover:border-indigo-400 hover:shadow-md"
  >
    <h3 class="text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
      {title}
    </h3>
    <p class="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

    {#if preview && isHovered && !isExpanded}
      <div class="mt-3 pt-3 border-t border-slate-200 animate-in fade-in duration-200">
        <p class="text-xs font-medium text-indigo-600">{preview}</p>
      </div>
    {/if}

    {#if expandedContent && isExpanded}
      <div class="mt-4 pt-4 border-t border-indigo-200 animate-in fade-in duration-300">
        <p class="text-sm text-slate-700 leading-relaxed">{expandedContent}</p>
        <p class="mt-2 text-xs font-medium text-indigo-600">{m.home_card_expand()}</p>
      </div>
    {/if}
  </button>
{/if}
