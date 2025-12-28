<script>
  import "../app.css";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import SearchBox from "$lib/components/SearchBox.svelte";

  export let data;
</script>

<header
  class="sticky top-0 z-50 flex h-14 flex-nowrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 md:bg-slate-50/95 md:backdrop-blur"
>
  <div class="flex items-center gap-3">
    <a href="/" class="text-lg font-semibold tracking-tight text-slate-900 no-underline">VSR</a>
    <LanguageSwitcher />
  </div>
  <div class="flex-1 min-w-0">
    <SearchBox agencies={data?.agencies ?? []} />
  </div>
</header>

<slot />
