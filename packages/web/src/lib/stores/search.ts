import { writable } from "svelte/store";

export type SearchState = {
  query: string;
  results: Array<Record<string, unknown>>;
  selectedIndex: number;
};

export const searchState = writable<SearchState>({
  query: "",
  results: [],
  selectedIndex: -1,
});
