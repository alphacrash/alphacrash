import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "alphacrash",
  tagline: "A site by SUD",
  favicon: "img/favicon.ico",
  url: "https://codexsud.com/",
  baseUrl: "/",
  organizationName: "codexsud",
  projectName: "codexsud",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  plugins: ["./src/plugins/tailwindPlugin", "./src/plugins/sitePlugin"],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "ignore",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    navbar: {
      title: "alphacrash",
      items: [
        {
          type: "docSidebar",
          sidebarId: "dsa",
          position: "left",
          label: "DSA",
        },
        { to: "/sql", label: "SQL", position: "left" },
        {
          type: "docSidebar",
          sidebarId: "systemDesign",
          position: "left",
          label: "System Design",
        },
        {
          type: "docSidebar",
          sidebarId: "reference",
          position: "left",
          label: "Reference",
        },
        { to: "/blog", label: "Blog", position: "right" },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
