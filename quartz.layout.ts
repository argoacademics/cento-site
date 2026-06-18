import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.HomeButton()],
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
