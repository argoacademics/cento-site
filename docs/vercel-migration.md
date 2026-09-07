---
title: Moving CENTO from GitHub Pages to Vercel
---

CENTO is built and served by **Vercel**. GitHub Pages is retired.

Everything else in the stack (ARGO, the portal, LODESTAR, ELIDE, STRATA) is on
Vercel already; Pages was the odd one out, with its own env-var mechanism
(`vars.*` in Actions) that nothing else used.

## What changed

| Before                                    | After                                     |
| ----------------------------------------- | ----------------------------------------- |
| GitHub Actions builds, Pages serves       | Vercel builds and serves                  |
| Build vars in Actions → Variables         | Env vars on the Vercel project            |
| 30-minute cron polling Airtable           | **Gone** — Deploy Hook publishes at once  |
| `repository_dispatch` → build in Actions  | `repository_dispatch` → POST Deploy Hook  |
| Push to `v4` triggers the workflow        | Vercel's git integration picks it up      |
| No preview builds                         | A preview deploy per pull request         |

The 30-minute cron only ever existed because Actions minutes are free on public
repos and Airtable's script action is paid-plan-only. A Deploy Hook removes the
reason for it: approval publishes immediately rather than up to half an hour
later.

## How the build works now

`package.json` has a `build` script — `node scripts/sync-airtable.mjs && npx
quartz build` — and `vercel.json` points Vercel at it, with `public` as the
output directory.

`cleanUrls: true` is **required, not cosmetic.** Quartz emits `SS-0001.html` but
links to it as `./SS-0001/SS-0001`, so without clean URLs every internal link
404s.

### Preview builds degrade instead of failing

`sync-airtable.mjs` exits 1 when `AIRTABLE_STITCHED_PT` is missing, which is
right for production: a publish without content is broken. But Vercel preview
deploys do not get production env, so on a non-production `VERCEL_ENV` the sync
is skipped with a warning and the build proceeds with whatever is committed.
A pull request still builds and can be looked at; production still fails loudly.

## Env vars on the Vercel project

Already set (`cento-site`, team `admin-72706388s-projects`):

| Var                     | Environments        | Value                      |
| ----------------------- | ------------------- | -------------------------- |
| `CENTO_BASE_URL`        | Production          | `cento.lodestar.ink`       |
| `LODESTAR_APP_URL`      | Production, Preview | `https://app.lodestar.ink` |
| `LODESTAR_SUPABASE_REF` | Production, Preview | `nxptgterbkuxodjcpldz`     |

`baseUrl` in `quartz.config.ts` reads `CENTO_BASE_URL`, then `VERCEL_URL`, then
falls back to the old domain. On a preview, `VERCEL_URL` keeps absolute links
(RSS, OG tags, sitemap) pointing at the preview rather than production.

**Still to add — the one credential that cannot be copied automatically:**

    AIRTABLE_STITCHED_PT   (Production only)

It lives in GitHub Secrets, which is write-only by design, so it cannot be read
back out. Copy it from wherever you originally generated it (Airtable → Builder
hub → Personal access tokens) into the Vercel project's env. **Production only:**
adding it to Preview would let any pull request build pull live submissions.

## Remaining steps

1. **Connect the repo.** Vercel dashboard → `cento-site` → Settings → Git →
   connect `argoacademics/cento-site`, production branch **`v4`** (not `main`).
2. **Add `AIRTABLE_STITCHED_PT`** to Production env (above).
3. **Create a Deploy Hook.** Settings → Git → Deploy Hooks, branch `v4`. Copy the
   URL and add it to the GitHub repo as secret **`VERCEL_DEPLOY_HOOK_URL`** —
   `deploy.yml` reads it. The URL is itself the credential; anyone holding it can
   trigger a build, so it is a secret, not a variable, and the workflow never
   echoes it.
4. **Add the domain** `cento.lodestar.ink` to the project, and point DNS at
   Vercel.
5. **Verify** the Vercel deploy serves correctly — check an internal link
   (`/SS-0001/SS-0001`) resolves, proving `cleanUrls`.
6. **Only then** disable GitHub Pages (Settings → Pages → Source: None) and
   repoint `stitchedstories.argoacademics.com.au`, either to Vercel as a redirect
   or retire it.

Leave Pages serving until step 5 passes. Two things serving the same site briefly
is harmless; a gap is not.

## What did not change

The Airtable half is untouched: same base (`appI3b2eKqgY9XWuQ`), same table, same
`Stitch Check` formula field, same "Verified" automation firing
`repository_dispatch: airtable-verified` at the repo. The one-off manual step
recorded in [publishing-pipeline.md](publishing-pipeline.md) — adding the
Run-a-script action to that automation — is still outstanding and still the same
step.
