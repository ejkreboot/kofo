import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel({
    isr: {
      expiration: false,
    },
  }),
  integrations: [preact()],
  vite: {
    ssr: {
      external: ["@vercel/routing-utils"],
    },
  },
});
