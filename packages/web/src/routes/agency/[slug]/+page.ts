import { error } from "@sveltejs/kit";

export async function load({ fetch, params }) {
  const slug = params.slug;
  const response = await fetch(`/data/agency_year/${slug}.json`);

  if (!response.ok) {
    throw error(404, `Agency not found: ${slug}`);
  }

  const data = await response.json();

  return {
    slug,
    data,
  };
}
