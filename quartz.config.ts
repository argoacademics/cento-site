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
    baseUrl: "stitchedstories.argoacademics.com.au",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      // All four bespoke CENTOS faces + IBM Plex Mono are self-hosted via
      // @font-face in quartz/styles/centos-tokens.scss, so use local origin
      // (no third-party font requests — also cleaner for embedding).
      fontOrigin: "local",
      cdnCaching: true,
      // CENTOS "Furnace & Soil" typography:
      //   Zina (logo) · Bonny (display) · Pardal (body/UI) · Dirtyline (ornament)
      typography: {
        title: "Zina",
        header: "Bonny",
        body: "Pardal",
        code: "IBM Plex Mono",
      },
      // CENTOS "Furnace & Soil" palette — dark soil ground lit by furnace heat.
      // secondary = oxblood stitch (--accent-stitch), tertiary = ember.
      colors: {
        lightMode: {
          light: "#20160d", // paper / soil ground — lifted
          lightgray: "#33230f", // loam-700 — borders / rules
          gray: "#b4905b", // loam-300 — muted text
          darkgray: "#e3d1b2", // ash-200 — body text
          dark: "#f4e8d3", // ash-100 — strong text / headings
          secondary: "#732b3e", // wine stitch
          tertiary: "#db6a23", // ember
          highlight: "rgba(219, 106, 35, 0.12)", // ember wash
          textHighlight: "rgba(115, 43, 62, 0.25)", // wine wash
        },
        darkMode: {
          light: "#20160d",
          lightgray: "#33230f",
          gray: "#b4905b",
          darkgray: "#e3d1b2",
          dark: "#f4e8d3",
          secondary: "#732b3e",
          tertiary: "#db6a23",
          highlight: "rgba(219, 106, 35, 0.12)",
          textHighlight: "rgba(115, 43, 62, 0.25)",
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
      // CustomOgImages disabled: it renders social cards via Satori by
      // fetching fonts from Google by name, which fails for the self-hosted
      // bespoke CENTOS faces (Zina/Bonny/Pardal/Dirtyline aren't on Google).
      // Re-enable only if OG cards are restyled to use a Google-hosted face.
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
