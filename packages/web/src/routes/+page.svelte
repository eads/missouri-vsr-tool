<svelte:head>
  <title>VSR Hello</title>
</svelte:head>

<main>
  <h1>Hello world</h1>
  <p>VSR SvelteKit + SST is live.</p>
</main>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap");

  :global(body) {
    margin: 0;
    background: radial-gradient(circle at top, #f8fafc, #e2e8f0);
    color: #0f172a;
  }

  main {
    min-height: 100vh;
    display: grid;
    place-content: center;
    gap: 0.75rem;
    font-family: "Space Grotesk", sans-serif;
    text-align: center;
    padding: 2rem;
  }

  h1 {
    font-size: clamp(2.5rem, 4vw, 4rem);
    margin: 0;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: #334155;
    font-size: 1.1rem;
  }
</style>
