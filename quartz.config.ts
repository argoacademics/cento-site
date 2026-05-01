import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Stitched Stories",
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
      typography: {
        title: "Cinzel",
        header: "Cinzel",
        body: { name: "Playfair Display", includeItalic: true },
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#0e0e0e",
          lightgray: "#2a2a2a",
          gray: "#8a7040",
          darkgray: "#f0ead6",
          dark: "#f0ead6",
          secondary: "#8b1a1a",
          tertiary: "#c9a84c",
          highlight: "rgba(139, 26, 26, 0.12)",
          textHighlight: "rgba(201, 168, 76, 0.25)",
        },
        darkMode: {
          light: "#0e0e0e",
          lightgray: "#2a2a2a",
          gray: "#8a7040",
          darkgray: "#f0ead6",
          dark: "#f0ead6",
          secondary: "#8b1a1a",
          tertiary: "#c9a84c",
          highlight: "rgba(139, 26, 26, 0.12)",
          textHighlight: "rgba(201, 168, 76, 0.25)",
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
