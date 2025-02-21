import starlight from "@astrojs/starlight";
import {defineConfig} from "astro/config";
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    integrations: [
        starlight({
            title: "ENSRainbow Docs",
            social: {
                github: "https://github.com/namehash/ensnode/tree/main/apps/ensrainbow",
            },
            sidebar: [
                {
                    label: "Guides",
                    items: [
                        // Each item here is one entry in the navigation menu.
                        {
                            label: "Quick start",
                            slug: "guides/quick-start",
                        },
                    ],
                },
                {
                    label: "Reference",
                    autogenerate: {directory: "reference"},
                },
            ],
        }),
        react(),
    ],
});
