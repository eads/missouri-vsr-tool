import { error } from "@sveltejs/kit";

export async function load({ fetch, params }) {
  const slug = params.slug;
  const response = await fetch(`/data/agency_year/${slug}.json`);
  const baselineResponse = await fetch("/data/statewide_slug_baselines.json");

  if (!response.ok) {
    throw error(404, `Agency not found: ${slug}`);
  }

  const data = await response.json();
  const baselines = baselineResponse.ok ? await baselineResponse.json() : [];

  return {
    slug,
    data,
    baselines,
  };
}
