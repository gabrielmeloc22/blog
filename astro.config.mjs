// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://gabrielmeloc22.github.io",
  base: "blog",
  integrations: [mdx(), sitemap(), tailwind()],
});
