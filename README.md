# Cento

A provenance graph for stitched micro-fiction. Each piece carries a phrase — _the stitch_ —
extracted from a source text and transplanted into new work. The stitch is rendered as a live
link back to its origin, so every line of inheritance stays traceable.

**Live:** https://cento.lodestar.ink/
A LODESTAR instrument · part of **ARGO Academics**

---

## How a piece becomes a page

Content is authored in **Airtable**, not in this repo. Airtable is the editorial desk:
submissions arrive there from Tally, are read and edited there, and **approving a record —
setting `Status` to `Verified` — is what publishes it.** Approval fires a
`repository_dispatch` at this repo, CI runs `scripts/sync-airtable.mjs`, and the piece goes
live. See **[docs/publishing-pipeline.md](docs/publishing-pipeline.md)** for the full path and
the one-off Airtable setup step.

The sync pulls records where `Status = "Verified"` and writes them into
`content/{Source Reference}/{title}-{recordId}.md`.

Required Airtable fields:

| Field                 | Role                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Title`               | Page title; slugified into the filename                                                                                                     |
| `Source Reference`    | **Load-bearing.** Sets the directory, builds `parent_node`, defines provenance. Must exactly match an existing node folder (e.g. `SS-0003`) |
| `Stitch`              | The inherited phrase. **Must appear verbatim in `Story Body`**                                                                              |
| `Story Body`          | The fiction. First letter gets a drop cap                                                                                                   |
| `Explainer Body`      | Optional "Cultural Explainer" section                                                                                                       |
| `Name`                | Written to both `submitter` and `author`                                                                                                    |
| `Affiliation`, `Tags` | Optional metadata                                                                                                                           |

Requires the `AIRTABLE_STITCHED_PT` secret (repo Actions secret + local env for dry runs).

### The one failure mode to watch

`StitchPhrase` matches the stitch with a literal `indexOf`
(`quartz/plugins/transformers/stitchphrase.ts:48`). If `Stitch` does not appear **verbatim inside
`Story Body`**, the link does not render — the page still builds and still shows the callout, so
the failure is invisible unless you look for the anchor.

Note the callout occurrence does not count: the transformer deliberately skips text preceded by a
quotation mark (`stitchphrase.ts:51-54`) so the callout's own quoted copy isn't linked. The phrase
must also appear, unquoted, in the prose itself.

Two things now catch this. In Airtable, the **Stitch Check** column shows the verdict per row
(`OK — stitch links` / `NO LINK — stitch not in body`) so it is visible _before_ you approve. In
CI, `sync-airtable.mjs` **skips** any Verified record that fails and lists it under `HELD BACK` —
a broken piece is no longer published silently.

Until 2026-08-08 **every record in the base failed this check**, so no page in the archive had
ever rendered a stitch link. All 9 were corrected in Airtable on that date and now read
`OK — stitch links`.

## Two kinds of content

Hand-authored nodes (`content/SS-0001/SS-0001.md` and siblings) are committed scaffolding: three
frontmatter keys, no stitch link, no drop cap. Airtable-synced pieces get the full eight keys and
all rendering features. The `-{recordId}` filename suffix means the sync can never overwrite a
hand-authored node, so the two coexist safely.

## Custom surface

Everything under `quartz/` is vendored upstream except:

- `quartz/plugins/transformers/stitchphrase.ts` — wraps the stitch phrase in a link to its parent
- `quartz/components/StoryNav.tsx` — prev / source / next bar
- `quartz/components/OnboardingOverlay.tsx` — first-visit framing
- `quartz/components/HomeButton.tsx` — masthead
- `quartz/components/Graph.tsx` + `quartz/components/scripts/graph.inline.ts` — the "hem" walk
- `quartz/styles/custom.scss`, `quartz/styles/centos-tokens.scss` — "Furnace & Soil" design system
- `scripts/sync-airtable.mjs`, `quartz.config.ts`, `quartz.layout.ts`

## Run locally

```bash
npm ci
npx quartz build --serve                                 # http://localhost:8080
AIRTABLE_STITCHED_PT=… node scripts/sync-airtable.mjs    # pull content first (optional)
```

## Deploy

Built and served by **Vercel**: `npm run build` = Airtable sync → `npx quartz build`,
output in `public/`. A push to `v4` deploys through Vercel's git integration.

**Airtable approval** publishes immediately: the automation fires
`repository_dispatch: airtable-verified`, and `.github/workflows/deploy.yml` forwards it
to a Vercel Deploy Hook. See [docs/vercel-migration.md](docs/vercel-migration.md).

---

Built on [Quartz v4](https://quartz.jzhao.xyz/) by Jacky Zhao (MIT). Upstream `package.json`
metadata is intentionally left unchanged to preserve attribution.
