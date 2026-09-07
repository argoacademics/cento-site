# Cento — archived

**CENTO has moved into LODESTAR.** This repository is no longer the site.

- **Read:** https://cento.lodestar.ink
- **Write and review:** https://app.lodestar.ink/cento
- **Code:** `argoacademics/lodestar-app`

Nothing was ported across. The nine Airtable records were test submissions
against synthetic specimen sources — placeholder content written to prove the
mechanism — so the new archive starts empty and the first real corpus is
authored in it.

## Why it moved

Quartz is a static-site generator for Obsidian vaults: a folder of markdown
becomes a browsable, backlinked site. That was an honest fit while CENTO *was*
a folder of markdown, and the graph view came free.

Three things justified it. By September 2026 two were gone:

| Quartz gave us | Then |
| --- | --- |
| Markdown → static site | Content moved to Postgres; files stopped being the source |
| Backlinks and a graph view | Still useful — rebuilt from data instead of wikilinks |
| Free GitHub Pages hosting | Replaced by Vercel |

The deciding reason was structural rather than aesthetic. Under Quartz,
**provenance resolved at build time inside one content tree** — a literal
`indexOf` over committed markdown. That made a corpus a *repository*, so a
second corpus meant a second repo, a second Airtable base and a second deploy.
Branching was impossible by construction, and letting anyone start their own
corpus was the point.

In LODESTAR a corpus is a row. A hundred corpora cost nothing, descent is a
foreign key, and the stitch check is a database constraint rather than a
build-time warning — which is what finally closed the failure this archive
carried for months: a piece could claim a phrase its source never contained,
publish anyway, and link to nothing.

## What is preserved here

The full history, including every version of the Quartz build, the Airtable
sync, and the specimen source texts. Nothing has been deleted — the working
tree still holds it, and `git log` reaches all of it.

Two pieces of design worth knowing were carried forward rather than abandoned:

- `quartz/plugins/transformers/stitchphrase.ts` → `src/lib/corpora/stitch.tsx`
  in lodestar-app, including its rule of skipping a quoted occurrence so the
  callout does not link to itself.
- `docs/publishing-pipeline.md` records the Airtable editorial desk as it
  worked, which is the design the dashboard's review queue replaces.
