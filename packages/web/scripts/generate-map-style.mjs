import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { layers } from "@protomaps/basemaps";

const pmtilesUrl =
  process.argv[2] ||
  process.env.PMTILES_URL ||
  "https://pmtiles.grupovisual.org/latest.pmtiles";
const lang = process.argv[3] || process.env.MAP_LANG || "en";
const outputName = process.argv[4] || process.env.MAP_STYLE_OUTPUT || `style.${lang}.json`;

const bio = {
  background: "#dddddd",
  earth: "#ededed",
  park_a: "#bfc99c",
  park_b: "#bfc99c",
  hospital: "#ffeae8",
  industrial: "#f8ffed",
  school: "#f2fef9",
  wood_a: "#bfc99c",
  wood_b: "#bfc99c",
  pedestrian: "#eef0f0",
  scrub_a: "#bfc99c",
  scrub_b: "#bfc99c",
  glacier: "#ffffff",
  sand: "#ebe7da",
  beach: "#ebe7da",
  aerodrome: "#dbe7e7",
  runway: "#d1d9d9",
  water: "#84b7cf",
  zoo: "#ebe6ed",
  military: "#ebe6ed",
  minor: "#fff2bb",
  major: "#ffdf59",
  highway: "#e9ac77",
  city_label: "#3c3c3c",
  city_label_halo: "#ffffff",
  state_label: "#777777",
  state_label_halo: "#ffffff",
};

const style = {
  version: 8,
  glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
  sources: {
    protomaps: {
      type: "vector",
      url: `pmtiles://${pmtilesUrl}`,
    },
  },
  layers: layers("protomaps", bio, { lang }),
};

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(here, "../static/map", outputName);

await writeFile(outputPath, JSON.stringify(style, null, 2));
console.log(`Wrote ${outputPath} (lang=${lang})`);
