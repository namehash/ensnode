/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      backgroundImage: {
        hero_bg:
          "linear-gradient(-90deg, rgba(16,18,223,1) 0%, rgba(18,19,117,1) 66%, rgba(0,0,0,1) 100%)",
        hero_bg_sm:
          "linear-gradient(180deg, rgba(16,18,223,1) 0%, rgba(18,19,115,1) 75%, rgba(0,0,0,1) 100%)",
        hero_background:
            "linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(18,19,97,1) 50%)",
        video_bg: "linear-gradient(94deg, rgba(2,2,6,1) 0%, rgba(4,0,116,1) 100%)",
        video_bg_sm: "linear-gradient(180deg, rgba(2,2,6,1) 0%, rgba(4,0,116,1) 100%)",
      },
      boxShadow: {
        hero_button_shd: "inset 0px 0px 12px 0px rgba(255,255,255,1)",
      },
      screens: {
        super_wide_hero: "1550px"
      }
    },
  },
  plugins: [],
};
