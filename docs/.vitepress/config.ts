import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "smart-enum",
  description:
    "Type-safe, feature-rich enumerations for TypeScript — lookup, serialization, database revival, and end-to-end GraphQL codegen.",

  // GitHub Project Pages are served from /<repo>/ — drop this if you move to a custom domain or user/org page.
  base: "/smart-enums/",

  cleanUrls: true,
  lastUpdated: true,

  head: [["meta", { name: "theme-color", content: "#7250e6" }]],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Guide", link: "/guide/introduction" },
      { text: "Core", link: "/core/creating-enums" },
      { text: "GraphQL", link: "/graphql/overview" },
      { text: "Database", link: "/database/revival" },
      { text: "Packages", link: "/packages/overview" },
    ],

    sidebar: [
      {
        text: "Getting started",
        items: [
          { text: "Introduction", link: "/guide/introduction" },
          { text: "Quick start", link: "/guide/quick-start" },
          { text: "Coming from TypeScript enums", link: "/guide/coming-from-enums" },
          { text: "Patterns & recipes", link: "/guide/patterns" },
          { text: "FAQ", link: "/guide/faq" },
        ],
      },
      {
        text: "Core library",
        items: [
          { text: "Creating enums", link: "/core/creating-enums" },
          { text: "Lookup & subsets", link: "/core/lookup" },
          { text: "Serialization & transport", link: "/core/serialization" },
          { text: "Type guards & entry points", link: "/core/guards-and-entry-points" },
          { text: "React", link: "/core/react" },
        ],
      },
      {
        text: "GraphQL",
        items: [
          { text: "Overview", link: "/graphql/overview" },
          { text: "Enum definitions (codegen)", link: "/graphql/codegen-enums" },
          { text: "Apollo type policies", link: "/graphql/type-policies" },
          { text: "The preset", link: "/graphql/preset" },
          { text: "@enumMeta metadata", link: "/graphql/enum-meta" },
        ],
      },
      {
        text: "Database",
        items: [
          { text: "Revival utilities", link: "/database/revival" },
          { text: "Knex adapter", link: "/database/knex" },
        ],
      },
      {
        text: "Packages",
        items: [{ text: "Ecosystem overview", link: "/packages/overview" }],
      },
      {
        text: "About",
        items: [{ text: "Design notes", link: "/about/design" }],
      },
    ],

    search: {
      provider: "local",
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/reharik/smart-enums" },
    ],

    editLink: {
      pattern: "https://github.com/reharik/smart-enums/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © reharik",
    },
  },
});
