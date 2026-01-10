import { writable } from "svelte/store";

export type ScatterDomainRange = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export const scatterDomainGroupStore = writable(new Map<string, ScatterDomainRange>());
