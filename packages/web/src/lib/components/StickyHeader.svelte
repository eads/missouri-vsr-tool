<script>
  import * as m from "$lib/paraglide/messages";
</script>

<header class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
  <div class="mx-auto max-w-7xl px-6 py-4">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-8">
        <h1 class="text-lg font-bold text-slate-900">
          {m.home_header_title()}
        </h1>
        <nav class="hidden items-center gap-6 md:flex">
          <a
            href="#about"
            class="text-sm font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
          >
            {m.home_toc_learn()}
          </a>
          <span class="text-slate-300">•</span>
          <a
            href="/data/agency_index.json"
            download
            class="text-sm font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
          >
            {m.home_toc_download()}
          </a>
          <span class="text-slate-300">•</span>
          <a
            href="#donate"
            class="text-sm font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
          >
            {m.home_toc_donate()}
          </a>
        </nav>
      </div>
      <a
        href="#donate"
        class="rounded-lg bg-[#28AF57] px-6 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#229647]"
      >
        {m.home_donate_button()}
      </a>
    </div>
    <!-- Mobile navigation -->
    <nav class="mt-3 flex items-center justify-center gap-6 md:hidden">
      <a
        href="#about"
        class="text-xs font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
      >
        {m.home_toc_learn()}
      </a>
      <span class="text-slate-300">•</span>
      <a
        href="/data/agency_index.json"
        download
        class="text-xs font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
      >
        {m.home_toc_download()}
      </a>
      <span class="text-slate-300">•</span>
      <a
        href="#donate"
        class="text-xs font-medium text-slate-700 no-underline transition-colors hover:text-[#28AF57]"
      >
        {m.home_toc_donate()}
      </a>
    </nav>
  </div>
</header>
