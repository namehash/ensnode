/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        hero_bg:
          "linear-gradient(90deg, rgba(16,18,223,1) 0%, rgba(18,19,115,1) 75%, rgba(0,0,0,1) 100%)",
        hero_bg_sm:
          "linear-gradient(180deg, rgba(16,18,223,1) 0%, rgba(18,19,115,1) 75%, rgba(0,0,0,1) 100%)",
      },
    },
  },
  plugins: [],
};
