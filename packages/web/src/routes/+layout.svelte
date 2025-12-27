<script>
  import "../app.css";
  import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
  import SearchBox from "$lib/components/SearchBox.svelte";

  export let data;
</script>

<header
  class="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur md:flex-row md:items-center md:justify-between"
>
  <div class="flex items-center gap-3">
    <a href="/" class="text-lg font-semibold tracking-tight text-slate-900 no-underline">VSR</a>
    <LanguageSwitcher />
  </div>
  <SearchBox agencies={data?.agencies ?? []} />
</header>

<slot />
