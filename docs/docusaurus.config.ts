import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "nextjs-drizzle-gen",
  tagline: "Rails-like generators for Next.js + Drizzle ORM projects",
  favicon: "img/favicon.ico",

  url: "https://mantaskaveckas.github.io",
  baseUrl: "/nextjs-drizzle-gen/",

  organizationName: "mantaskaveckas",
  projectName: "nextjs-drizzle-gen",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "/",
          editUrl:
            "https://github.com/mantaskaveckas/nextjs-drizzle-gen/tree/main/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: "nextjs-drizzle-gen",
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: "https://github.com/mantaskaveckas/nextjs-drizzle-gen",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/",
            },
            {
              label: "CLI Reference",
              to: "/cli-reference",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/mantaskaveckas/nextjs-drizzle-gen",
            },
            {
              label: "npm",
              href: "https://www.npmjs.com/package/nextjs-drizzle-gen",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} nextjs-drizzle-gen. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash"],
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
