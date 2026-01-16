import { error } from "@sveltejs/kit";

export async function load({ fetch, params }) {
  const slug = params.slug;
  const response = await fetch(`/data/dist/agency_year/${slug}.json`);

  if (!response.ok) {
    throw error(404, `Agency not found: ${slug}`);
  }

  const data = await response.json();
  const baselineResponse = await fetch("/data/dist/statewide_slug_baselines.json");
  const indexResponse = await fetch("/data/dist/agency_index.json");
  const agencyId =
    data?.agency_metadata?.agency_id || data?.agency_metadata?.agency_slug || slug;
  const boundaryResponse = await fetch(
    `/data/dist/agency_boundaries/${agencyId}.geojson`
  );
  const baselines = baselineResponse.ok ? await baselineResponse.json() : [];
  const agencies = indexResponse.ok ? await indexResponse.json() : [];
  const boundary = boundaryResponse.ok ? await boundaryResponse.json() : null;

  if (!boundaryResponse.ok) {
    console.warn(
      `[agency] boundary missing for ${agencyId} (${boundaryResponse.status})`
    );
  }

  return {
    slug,
    data,
    baselines,
    agencies,
    agencyCount: Array.isArray(agencies) ? agencies.length : 0,
    boundary,
  };
}
