<script lang="ts">
  import { baseLocale, getLocale, locales, setLocale } from "$lib/paraglide/runtime";

  const languageNames: Record<string, string> = {
    en: "EN",
    es: "ES",
  };

  const readLocale = () => {
    try {
      return getLocale();
    } catch {
      return baseLocale;
    }
  };

  let currentLocale = readLocale();

  const handleChange = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement | null;
    const nextLocale = target?.value;
    if (!nextLocale || nextLocale === currentLocale) return;
    currentLocale = nextLocale;
    setLocale(nextLocale);
  };
</script>

<label class="sr-only" for="language-switcher">Language</label>
<select
  id="language-switcher"
  class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
  value={currentLocale}
  on:change={handleChange}
>
  {#each locales as lang}
    <option value={lang}>{languageNames[lang] || lang}</option>
  {/each}
</select>
