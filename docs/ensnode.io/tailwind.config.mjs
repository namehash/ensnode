import starlightPlugin from "@astrojs/starlight-tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        hero_bg: "linear-gradient(94deg, rgba(2,2,6,1) 0%, rgba(4,0,116,1) 100%)",
        hero_bg_sm: "linear-gradient(180deg, rgba(2,2,6,1) 0%, rgba(4,0,116,1) 100%)",
      },
      screens: {
        super_wide_hero: "1550px",
      },
    },
  },
  plugins: [starlightPlugin()],
};
