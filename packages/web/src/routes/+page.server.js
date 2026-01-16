import { readFileSync } from "fs";
import { join } from "path";
import { compile } from "mdsvex";

export async function load() {
  const path = join(process.cwd(), "content", "about-the-data.md");
  const markdown = readFileSync(path, "utf-8");
  const compiled = await compile(markdown);

  return {
    aboutDataHtml: compiled.code,
  };
}
