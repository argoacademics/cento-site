import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, resolveRelative, simplifySlug } from "../util/path"

const StoryNav: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
  const currentSlug = fileData.slug as FullSlug
  if (!currentSlug) return <nav class="story-nav"></nav>

  // Resolve Source link from parent_node frontmatter
  const parentNodeRaw = (fileData.frontmatter as Record<string, unknown>)?.parent_node as
    | string
    | null
    | undefined
  let sourceHref: string | null = null
  let sourceTitle = "Source"

  if (parentNodeRaw && typeof parentNodeRaw === "string") {
    const wikilinkMatch = parentNodeRaw.match(/^\[\[(.+?)\]\]$/)
    const targetId = wikilinkMatch ? wikilinkMatch[1].trim() : parentNodeRaw.trim()
    const matchFile = allFiles.find((f) => {
      if (!f.slug) return false
      const simple = simplifySlug(f.slug as FullSlug)
      return simple === targetId || simple.endsWith("/" + targetId)
    })
    if (matchFile?.slug) {
      sourceHref = resolveRelative(currentSlug, simplifySlug(matchFile.slug as FullSlug))
      sourceTitle =
        ((matchFile.frontmatter as Record<string, unknown>)?.title as string | undefined) ??
        targetId
    }
  }

  // Order prev/next by title, falling back to slug — a stable, catalogue-style
  // sequence (SS-0001 → SS-0002 → …).
  //
  // Deliberately NOT sorted by date: Airtable-synced pieces are all written by the
  // same CI run, so their mtimes are identical-to-arbitrary and the resulting order
  // shuffles between deploys. Title order is deterministic and survives a re-sync.
  const orderKey = (f: (typeof allFiles)[number]) =>
    (((f.frontmatter as Record<string, unknown> | undefined)?.title as string | undefined) ??
      (f.slug as string) ??
      "").toLowerCase()

  const contentFiles = allFiles
    .filter((f) => f.slug && !(f.slug as string).startsWith("tags/"))
    .sort((a, b) => {
      const cmp = orderKey(a).localeCompare(orderKey(b), undefined, { numeric: true })
      if (cmp !== 0) return cmp
      return ((a.slug as string) ?? "").localeCompare((b.slug as string) ?? "")
    })

  // Quartz emits two pages per node: the story itself (slug "SS-0001/SS-0001") and a
  // folder index ("SS-0001/index"). Comparing simplified slugs matches the story page
  // regardless of which form `fileData.slug` takes; folder indexes and 404 correctly
  // fall through to -1 and render no arrows.
  const currentSimple = simplifySlug(currentSlug)
  const currentIdx = contentFiles.findIndex(
    (f) => simplifySlug(f.slug as FullSlug) === currentSimple,
  )
  // If the current page isn't in the list at all (-1), show neither arrow rather
  // than silently falling through to the first file.
  const prevFile = currentIdx > 0 ? contentFiles[currentIdx - 1] : null
  const nextFile =
    currentIdx >= 0 && currentIdx < contentFiles.length - 1 ? contentFiles[currentIdx + 1] : null

  const prevHref = prevFile?.slug
    ? resolveRelative(currentSlug, simplifySlug(prevFile.slug as FullSlug))
    : null
  const nextHref = nextFile?.slug
    ? resolveRelative(currentSlug, simplifySlug(nextFile.slug as FullSlug))
    : null

  const prevTitle =
    ((prevFile?.frontmatter as Record<string, unknown> | undefined)?.title as string | undefined) ??
    ""
  const nextTitle =
    ((nextFile?.frontmatter as Record<string, unknown> | undefined)?.title as string | undefined) ??
    ""

  return (
    <nav class="story-nav">
      {prevHref ? (
        <a href={prevHref} class="story-nav-btn story-nav-prev" title={prevTitle}>
          ← Previous
        </a>
      ) : (
        <span class="story-nav-btn story-nav-disabled">← Previous</span>
      )}
      {sourceHref ? (
        <a href={sourceHref} class="story-nav-btn story-nav-source" title={sourceTitle}>
          ↑ Source
        </a>
      ) : (
        <span class="story-nav-btn story-nav-source story-nav-disabled">↑ Source</span>
      )}
      {nextHref ? (
        <a href={nextHref} class="story-nav-btn story-nav-next" title={nextTitle}>
          Next →
        </a>
      ) : (
        <span class="story-nav-btn story-nav-disabled">Next →</span>
      )}
    </nav>
  )
}

export default (() => StoryNav) satisfies QuartzComponentConstructor
