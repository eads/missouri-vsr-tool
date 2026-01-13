<script>
  import * as m from "$lib/paraglide/messages";
  import { getLocale, locales, setLocale } from "$lib/paraglide/runtime";

  let mobileMenuOpen = false;
  let currentLocale = getLocale();

  $: currentLocale = getLocale();

  const handleLocaleChange = (event) => {
    const nextLocale = event?.currentTarget?.value;
    if (!nextLocale || nextLocale === currentLocale) return;
    setLocale(nextLocale);
  };
</script>

<header class="sticky top-0 z-50 border-b-4 border-b-[#28AF57] bg-white/95 backdrop-blur-sm shadow-sm">
  <div class="mx-auto max-w-7xl px-6">
    <div class="flex items-center justify-between py-3">
      <!-- Left: Title + Navigation -->
      <div class="flex items-center gap-6">
        <h1 class="text-lg font-bold text-[#28AF57]">
          {m.home_header_title()}
        </h1>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-4 md:flex">
          <a
            href="#search"
            class="text-sm font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
          >
            Search
          </a>
          <span class="text-slate-300">•</span>
          <a
            href="#about"
            class="text-sm font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
          >
            {m.home_toc_learn()}
          </a>
          <span class="text-slate-300">•</span>
          <a
            href="#download"
            class="text-sm font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
          >
            {m.home_toc_download()}
          </a>
        </nav>
      </div>

      <!-- Right: Language switcher + Donate -->
      <div class="hidden items-center gap-3 md:flex">
        <select
          bind:value={currentLocale}
          onchange={handleLocaleChange}
          class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition-colors hover:border-[#28AF57] focus:border-[#28AF57] focus:outline-none"
        >
          {#each locales as locale}
            <option value={locale}>{locale.toUpperCase()}</option>
          {/each}
        </select>
        <a
          href="#donate"
          class="rounded-lg bg-[#28AF57] px-5 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#229647]"
        >
          {m.home_donate_button()}
        </a>
      </div>

      <!-- Mobile menu button -->
      <button
        type="button"
        onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
        class="flex items-center gap-2 text-sm font-medium text-slate-700 md:hidden"
        aria-label="Menu"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu dropdown -->
    {#if mobileMenuOpen}
      <nav class="border-t border-slate-200 pb-3 md:hidden">
        <a
          href="#search"
          class="block px-4 py-2 text-sm font-medium text-slate-700 no-underline transition-colors hover:bg-slate-50 hover:text-[#28AF57]"
        >
          Search
        </a>
        <a
          href="#about"
          class="block px-4 py-2 text-sm font-medium text-slate-700 no-underline transition-colors hover:bg-slate-50 hover:text-[#28AF57]"
        >
          {m.home_toc_learn()}
        </a>
        <a
          href="#download"
          class="block px-4 py-2 text-sm font-medium text-slate-700 no-underline transition-colors hover:bg-slate-50 hover:text-[#28AF57]"
        >
          {m.home_toc_download()}
        </a>
      </nav>
    {/if}
  </div>
</header>
