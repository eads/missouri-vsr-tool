<script>
  import { home_note, home_subtitle, home_title } from "$lib/paraglide/messages";
</script>

<svelte:head>
  <title>VSR Hello</title>
</svelte:head>

<main class="grid min-h-screen place-content-center gap-3 px-8 py-8 text-center">
  <h1 class="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
    {home_title()}
  </h1>
  <p class="text-base text-slate-600">{home_subtitle()}</p>
  <p class="text-base text-slate-500">{home_note()}</p>
</main>
