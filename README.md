# Cento

A provenance graph for stitched micro-fiction. Each piece carries a phrase — *the stitch* —
extracted from a source text and transplanted into new work. The stitch is rendered as a live
link back to its origin, so every line of inheritance stays traceable.

**Live:** https://stitchedstories.argoacademics.com.au/
A LODESTAR instrument · part of **ARGO Academics**

---

## How a piece becomes a page

Content is authored in **Airtable**, not in this repo. On every push to `v4`, CI runs
`scripts/sync-airtable.mjs`, which pulls records where `Status = "Verified"` and writes them
into `content/{Source Reference}/{title}-{recordId}.md`.

Required Airtable fields:

| Field | Role |
|---|---|
| `Title` | Page title; slugified into the filename |
| `Source Reference` | **Load-bearing.** Sets the directory, builds `parent_node`, defines provenance. Must exactly match an existing node folder (e.g. `SS-0003`) |
| `Stitch` | The inherited phrase. **Must appear verbatim in `Story Body`** |
| `Story Body` | The fiction. First letter gets a drop cap |
| `Explainer Body` | Optional "Cultural Explainer" section |
| `Name` | Written to both `submitter` and `author` |
| `Affiliation`, `Tags` | Optional metadata |

Requires the `AIRTABLE_STITCHED_PT` secret (repo Actions secret + local env for dry runs).

### The one failure mode to watch

`StitchPhrase` matches the stitch with a literal `indexOf`
(`quartz/plugins/transformers/stitchphrase.ts:48`). If `Stitch` does not appear **verbatim inside
`Story Body`**, the link does not render — the page still builds and still shows the callout, so
the failure is invisible unless you look for the anchor.

Note the callout occurrence does not count: the transformer deliberately skips text preceded by a
quotation mark (`stitchphrase.ts:51-54`) so the callout's own quoted copy isn't linked. The phrase
must also appear, unquoted, in the prose itself.

`scripts/sync-airtable.mjs` now warns at build time for every record where this is true — check the
CI log after a sync. As of the last audit, **all 8 verified records failed this check**, so no page
in the archive has ever rendered a stitch link.

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

Push to **`v4`** → `.github/workflows/deploy.yml` → Airtable sync → `npx quartz build` →
GitHub Pages. `v4` is the default branch and the only deploy trigger.

---

Built on [Quartz v4](https://quartz.jzhao.xyz/) by Jacky Zhao (MIT). Upstream `package.json`
metadata is intentionally left unchanged to preserve attribution.
