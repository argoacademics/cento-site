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

This is a **one-off setup**, not something you touch per submission. Once it is on, it runs by
itself on every record that reaches `Status = Verified`.

The final hop cannot be created via API — it must be added by hand. The automation
**"Verified"** (`wflWDl6APX7ibLqel`) already exists with the correct trigger
(`Status = Verified`) and no actions. To finish it:

1. Create a GitHub **fine-grained personal access token**
   at <https://github.com/settings/personal-access-tokens>
   - repository access: **Only select repositories** → `argoacademics/cento-site`
   - permission: **Contents → Read and write** (this is what `repository_dispatch` requires)
   - set a long expiry — when it lapses, publishing from Airtable stops (see Token rotation)
   - copy the token; it is shown once

2. In Airtable → **Automations** → **Verified** → **+ Add advanced logic or action** →
   **Run a script**

   (The action is called **Run a script**, not "Send request". It is available on all plans,
   including free, and its Variables sidebar supports **secrets** so the token is never stored
   as plain text.)

3. In the script editor's **Variables** sidebar, add a **secret**
   - name: `githubToken`
   - value: the token from step 1

4. Paste this as the script:

   ```js
   // Fire a repository_dispatch at cento-site so the archive rebuilds.
   // Runs whenever a submission is approved (Status = Verified).
   const token = input.secret.githubToken

   const res = await fetch("https://api.github.com/repos/argoacademics/cento-site/dispatches", {
     method: "POST",
     headers: {
       Accept: "application/vnd.github+json",
       Authorization: `Bearer ${token}`,
       "X-GitHub-Api-Version": "2022-11-28",
       "Content-Type": "application/json",
     },
     body: JSON.stringify({ event_type: "airtable-verified" }),
   })

   // GitHub answers 204 No Content on success — an empty body is correct, not a failure.
   if (res.status !== 204) {
     throw new Error(`GitHub dispatch failed: ${res.status} ${await res.text()}`)
   }
   console.log("Dispatched — build starting.")
   ```

5. Click **Run test**. Success prints `Dispatched — build starting.` A 401 means the token is
   wrong or expired; a 404 usually means the token lacks **Contents: Read and write** on this
   repo.

6. Turn the automation **on** (it is currently undeployed).

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
