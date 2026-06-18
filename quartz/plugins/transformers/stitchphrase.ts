import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Root as HTMLRoot, Element, Text, ElementContent } from "hast"
import { resolveRelative, simplifySlug, FullSlug, SimpleSlug } from "../../util/path"

export const StitchPhrase: QuartzTransformerPlugin = () => {
  return {
    name: "StitchPhrase",
    htmlPlugins(ctx) {
      return [
        () => {
          return (tree: HTMLRoot, file) => {
            const frontmatter = file.data.frontmatter
            const stitchPhrase = frontmatter?.stitch_phrase as string | undefined
            const parentNodeRaw = frontmatter?.parent_node as string | null | undefined

            if (!stitchPhrase || !parentNodeRaw || typeof parentNodeRaw !== "string") return

            // Parse [[SS-0001]] wikilink format → "SS-0001"
            const wikilinkMatch = parentNodeRaw.match(/^\[\[(.+?)\]\]$/)
            const targetId = wikilinkMatch ? wikilinkMatch[1].trim() : parentNodeRaw.trim()

            // Find full slug by matching the last path segment (shortest-path resolution)
            const matchSlug =
              ctx.allSlugs.find((s) => {
                const simple = simplifySlug(s)
                return simple === (targetId as SimpleSlug) || simple.endsWith("/" + targetId)
              }) ?? (targetId as FullSlug)

            const href = resolveRelative(file.data.slug! as FullSlug, simplifySlug(matchSlug))

            // Collect replacements in a first pass, then apply in reverse to preserve indices
            type Replacement = {
              parent: Element
              index: number
              newNodes: ElementContent[]
            }
            const replacements: Replacement[] = []

            visit(tree, "text", (node: Text, index: number | undefined, parent) => {
              if (index === undefined || !parent) return
              const parentEl = parent as Element
              // Skip code blocks, pre, existing anchors, headings
              const skipTags = ["code", "pre", "a", "h1", "h2", "h3", "h4", "h5", "h6"]
              if (skipTags.includes(parentEl.tagName ?? "")) return

              const text = node.value
              const phraseIdx = text.indexOf(stitchPhrase)
              if (phraseIdx === -1) return

              // Skip occurrences immediately preceded by a quotation mark —
              // the abstract callout wraps the phrase in quotes, e.g. **"He tested firstly"**
              const prevChar = phraseIdx > 0 ? text[phraseIdx - 1] : ""
              if (prevChar === '"' || prevChar === "“" || prevChar === "'") return

              const before = text.slice(0, phraseIdx)
              const after = text.slice(phraseIdx + stitchPhrase.length)

              const spanNode: Element = {
                type: "element",
                tagName: "a",
                properties: { href, className: ["stitch-phrase", "internal"] },
                children: [{ type: "text", value: stitchPhrase }],
              }

              const newNodes: ElementContent[] = []
              if (before) newNodes.push({ type: "text", value: before })
              newNodes.push(spanNode)
              if (after) newNodes.push({ type: "text", value: after })

              replacements.push({ parent: parentEl, index, newNodes })
            })

            // Apply in reverse order so earlier indices stay valid
            for (const { parent, index, newNodes } of replacements.reverse()) {
              parent.children.splice(index, 1, ...newNodes)
            }
          }
        },
      ]
    },
  }
}
