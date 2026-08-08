# Publishing pipeline

Airtable is the editorial desk. A submission is _considered_ there, edited there, and
approved there — and approving it is what publishes it. Nothing else is a publish button.

```
Tally "Stitched Stories Submissions" (WOe7pN)
        │  raw intake, no validation
        ▼
Airtable  base appI3b2eKqgY9XWuQ · table tblpfCliNwnlmUt8Y
        │  YOU: read · edit · fix the stitch · approve
        │  Status → Verified
        ▼
Airtable automation "Verified"  ──POST repository_dispatch──►  GitHub
        ▼
.github/workflows/deploy.yml  →  scripts/sync-airtable.mjs  →  npx quartz build
        ▼
GitHub Pages · https://stitchedstories.argoacademics.com.au/
```

No Zapier anywhere in this path.

## The three triggers on deploy.yml

| Trigger                                     | Fires when             | Use                  |
| ------------------------------------------- | ---------------------- | -------------------- |
| `repository_dispatch` (`airtable-verified`) | Airtable approval      | the normal path      |
| `workflow_dispatch`                         | you click Run workflow | force a rebuild      |
| `push` to `v4`                              | code changes           | design/template work |

## Before approving: check the stitch

The site turns the stitch into a link back to its source using an **exact substring match**
(`quartz/plugins/transformers/stitchphrase.ts`). If `Stitch` does not appear verbatim inside
`Story Body`, there is no link — and the link is the entire point of the archive.

The **Stitch Check** column in Airtable shows this per row:

- `OK — stitch links` — safe to approve
- `NO LINK — stitch not in body` — fix before approving
- `— missing` — Stitch or Story Body is empty

`sync-airtable.mjs` enforces the same rule: a Verified record that fails the check is
**skipped, not published**, and listed under `HELD BACK` in the Actions log. Fix the record
in Airtable and re-approve to publish it.

Common causes: the writer paraphrased the stitch; curly vs straight quotes; trailing
whitespace; capitalisation (`Once Upon a` vs `once upon a` — the match is case-sensitive).

## Manual setup step (one-off, Airtable UI)

The final hop cannot be created via API — Airtable's outbound-request action must be added
by hand. The automation **"Verified"** (`wflWDl6APX7ibLqel`) already exists with the correct
trigger (`Status = Verified`) and no actions. To finish it:

1. Create a GitHub **fine-grained personal access token**
   - repository access: `argoacademics/cento-site` only
   - permission: **Contents → Read and write** (this is what `repository_dispatch` requires)
   - copy the token; it is shown once

2. In Airtable → Automations → **Verified** → add action → **Send request**
   - Method: `POST`
   - URL: `https://api.github.com/repos/argoacademics/cento-site/dispatches`
   - Headers:
     | Key | Value |
     |---|---|
     | `Accept` | `application/vnd.github+json` |
     | `Authorization` | `Bearer YOUR_TOKEN_HERE` |
     | `X-GitHub-Api-Version` | `2022-11-28` |
     | `Content-Type` | `application/json` |
   - Body (JSON):
     ```json
     { "event_type": "airtable-verified" }
     ```

3. **Test** the action. A success is HTTP **204 No Content** — GitHub returns an empty body,
   which Airtable may display as a blank response. That is correct, not a failure.

4. Turn the automation **on** (it is currently undeployed).

### Verifying it works

Flip a record's Status to Verified, then check
<https://github.com/argoacademics/cento-site/actions> — a run titled
_Deploy Quartz site to GitHub Pages_ should appear within a few seconds.

### If it fires too often

The trigger is `recordMatchesConditions` on `Status = Verified`, so editing an
already-Verified record can re-fire it. Each run is ~45s and idempotent, so this is harmless
— but if it becomes noisy, add a `Published at` field and condition the automation on it
being empty.

## Token rotation

The Airtable automation holds the only copy of the GitHub token. If it is rotated or expires,
the publish path fails silently from Airtable's side (the automation run log shows a 401).
Publishing still works via **Run workflow** in the Actions tab meanwhile.
