import starlightPlugin from "@astrojs/starlight-tailwind";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        telegram_bg: "linear-gradient(90deg, #F9FAFB 0%, #F3F5F7 100%)"
      },
      screens: {
        super_wide_hero: "1550px",
      },
    },
  },
  plugins: [starlightPlugin()],
};
