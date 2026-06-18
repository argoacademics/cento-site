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

  // Sort all content files by date (modified, then created, then slug) for prev/next
  const contentFiles = allFiles
    .filter((f) => f.slug && !(f.slug as string).startsWith("tags/"))
    .sort((a, b) => {
      const ad = (a as any).dates
      const bd = (b as any).dates
      const dateA =
        ad?.modified?.getTime() ?? ad?.created?.getTime() ?? ad?.published?.getTime() ?? 0
      const dateB =
        bd?.modified?.getTime() ?? bd?.created?.getTime() ?? bd?.published?.getTime() ?? 0
      if (dateA !== dateB) return dateA - dateB
      return ((a.slug as string) ?? "").localeCompare((b.slug as string) ?? "")
    })

  const currentIdx = contentFiles.findIndex((f) => f.slug === currentSlug)
  const prevFile = currentIdx > 0 ? contentFiles[currentIdx - 1] : null
  const nextFile = currentIdx < contentFiles.length - 1 ? contentFiles[currentIdx + 1] : null

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
