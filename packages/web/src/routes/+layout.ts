export async function load({ fetch }) {
  const response = await fetch("/data/dist/agency_index.json");

  if (!response.ok) {
    return {
      agencies: [],
    };
  }

  return {
    agencies: await response.json(),
  };
}
