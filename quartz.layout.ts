import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// LODESTAR account bridge. Both must be set at BUILD time (GitHub Actions env)
// for the account chip to appear; unset, CENTO builds exactly as before and
// stays fully anonymous. Auth is additive — it never gates reading the archive.
//   LODESTAR_APP_URL      e.g. https://app.lodestar.ink
//   LODESTAR_SUPABASE_REF the <ref> in LODESTAR's sb-<ref>-auth-token cookie
const lodestarAppUrl = process.env.LODESTAR_APP_URL ?? ""
const lodestarSupabaseRef = process.env.LODESTAR_SUPABASE_REF ?? ""

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.HomeButton(),
    Component.AuthStatus({
      lodestarAppUrl,
      supabaseRef: lodestarSupabaseRef,
    }),
  ],
  afterBody: [Component.OnboardingOverlay(), Component.StoryNav()],
  footer: Component.Footer(),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta(), Component.TagList()],
  left: [],
  right: [
    Component.Graph({
      localGraph: {
        showTags: false,
        depth: -1,
        enableRadial: true,
        focusOnHover: true,
        repelForce: 0.5,
        centerForce: 0.3,
        linkDistance: 40,
        fontSize: 0.5,
        opacityScale: 1,
      },
      globalGraph: {
        showTags: false,
        depth: -1,
        enableRadial: true,
      },
    }),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left: [],
  right: [
    Component.Graph({
      localGraph: {
        showTags: false,
        depth: -1,
        enableRadial: true,
      },
      globalGraph: {
        showTags: false,
        depth: -1,
      },
    }),
  ],
}
