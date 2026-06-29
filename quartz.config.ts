import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Cento",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      // CENTOS "Furnace & Soil" typography.
      // Substitute Google Fonts stand in for the four bespoke faces until the
      // real OTF/TTF binaries are self-hosted:
      //   Zina (logo) → Cinzel · Bonny (display) → Fraunces
      //   Pardal (body/UI) → Hanken Grotesk · Dirtyline (ornament) → Fraunces
      typography: {
        title: "Cinzel",
        header: { name: "Fraunces", weights: [400, 600, 900], includeItalic: true },
        body: { name: "Hanken Grotesk", weights: [300, 400, 500, 600, 700], includeItalic: true },
        code: "IBM Plex Mono",
      },
      // CENTOS "Furnace & Soil" palette — dark soil ground lit by furnace heat.
      // secondary = oxblood stitch (--accent-stitch), tertiary = ember.
      colors: {
        lightMode: {
          light: "#171009", // paper / soil ground
          lightgray: "#33230f", // loam-700 — borders / rules
          gray: "#b4905b", // loam-300 — muted text
          darkgray: "#e3d1b2", // ash-200 — body text
          dark: "#f4e8d3", // ash-100 — strong text / headings
          secondary: "#8f2f39", // oxblood stitch
          tertiary: "#db6a23", // ember
          highlight: "rgba(219, 106, 35, 0.12)", // ember wash
          textHighlight: "rgba(143, 47, 57, 0.25)", // oxblood wash
        },
        darkMode: {
          light: "#171009",
          lightgray: "#33230f",
          gray: "#b4905b",
          darkgray: "#e3d1b2",
          dark: "#f4e8d3",
          secondary: "#8f2f39",
          tertiary: "#db6a23",
          highlight: "rgba(219, 106, 35, 0.12)",
          textHighlight: "rgba(143, 47, 57, 0.25)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-dark",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.StitchPhrase(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
