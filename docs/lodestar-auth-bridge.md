---
title: The LODESTAR auth bridge
---

CENTO does not have its own accounts. Signing in happens once, at LODESTAR, and
every instrument beneath it — CENTO, ELIDE, nthrhyme — reads that same session.
This page describes how that works and what remains to switch it on.

## How it works

The instruments are served from **shared-root subdomains**:

| Host | What it is |
| --- | --- |
| `app.lodestar.ink` | LODESTAR. Auth lives here, and only here. |
| `cento.lodestar.ink` | CENTO (this site). |
| `elide.lodestar.ink` | ELIDE. |

Because they share the parent domain `lodestar.ink`, LODESTAR can set its
Supabase session cookie with `Domain=.lodestar.ink`. The browser then sends that
cookie to every instrument automatically. **No token ever travels in a URL**,
there is no cross-origin handoff, and no open-redirect surface in the exchange.

LODESTAR is the sole writer of that cookie. CENTO is a pure reader.

### The one setting the whole thing rests on

`@supabase/ssr` sets a **host-only** cookie by default — readable at
`app.lodestar.ink` and nowhere else. Under that default LODESTAR looks signed in,
every instrument beneath looks signed out, and nothing errors. Scoping the cookie
to the parent domain is the actual mechanism:

- `lodestar-app/src/lib/supabase/cookie-domain.ts` — reads
  `NEXT_PUBLIC_LODESTAR_COOKIE_DOMAIN`, applied by the browser, server and
  middleware clients alike.

Unset, it falls back to host-only — which is exactly today's behaviour, so local
dev and `*.vercel.app` previews keep working.

## What CENTO does

CENTO is a **static** site. There is no server request to read a cookie on, the
way ELIDE's `/api/auth/me` does. So the account chip renders empty and a small
script fills it in after load:

- `quartz/components/AuthStatus.tsx` — the shell, mounted in the header.
- `quartz/components/scripts/authstatus.inline.ts` — reads the cookie, renders.
- `quartz/components/scripts/authstatus-claims.ts` — cookie/JWT parsing, unit
  tested. Separate module because a top-level `export` is a syntax error inside
  a Quartz inline script.

**The chip is display only.** A static page cannot verify a JWT signature, and
this one does not try: it reads the `email` claim to render a name. It therefore
gates *nothing*. Anything that genuinely depends on identity — submitting a
stitch, owning a corpus — must be checked server-side by the service that owns
the data, against LODESTAR's JWKS. Treat the cookie as attacker-controlled; the
email is HTML-escaped before it is rendered for exactly that reason.

Build-time configuration, set as env vars on the **Vercel** project `cento-site`
(Production + Preview). Both values are public — an app origin, and a project
ref already visible in any signed-in browser's cookie name:

    LODESTAR_APP_URL       https://app.lodestar.ink
    LODESTAR_SUPABASE_REF  <ref in LODESTAR's sb-<ref>-auth-token cookie>

Unset, the chip does not render at all and CENTO builds exactly as it does
today. Auth is additive: it never gates reading the archive.

## Cutover checklist

Code is done; these are infrastructure steps.

1. **DNS.** Point `app.lodestar.ink` at the `lodestar-app` Vercel project and
   `cento.lodestar.ink` at this site's Vercel project (`cento-site`). Add both
   as custom domains in Vercel.
2. **LODESTAR env** (Vercel, `lodestar-app`):
   `NEXT_PUBLIC_LODESTAR_COOKIE_DOMAIN=.lodestar.ink` (note the leading dot) and
   `NEXT_PUBLIC_LODESTAR_ROOT_DOMAIN=lodestar.ink`.
3. **Supabase Auth** — add `https://app.lodestar.ink/auth/callback` to the
   allowed redirect URLs.
4. **CENTO env** — `LODESTAR_APP_URL` and `LODESTAR_SUPABASE_REF` are already
   set on the `cento-site` Vercel project (Production + Preview). Redeploy to
   pick them up.
5. **Verify.** Sign in at `app.lodestar.ink`, then load `cento.lodestar.ink`:
   the chip should show your email. In devtools the cookie's Domain column must
   read `.lodestar.ink`. If it reads `app.lodestar.ink`, step 2 did not take —
   that is the silent failure this whole page is about.

Until step 1 lands, CENTO is still served from its old host, which is not
beneath `lodestar.ink`, so the cookie cannot reach it. The chip stays hidden and
nothing breaks.

## What this deliberately does not do

Branching — contributors creating their **own** corpora — is a separate and much
larger change. CENTO's stories currently live in Airtable and git-committed
markdown, built by Quartz into a single static site; provenance
(`stitch_phrase` → `parent_node`) is resolved at build time inside one content
tree. A second corpus under that model means a second Airtable base, a second
repo and a second deploy, and descent cannot cross corpora at all.

Making branching real means moving corpora into Postgres so a branch is a row
rather than a repo, and provenance a foreign key that can cross corpora. That
also forces an editorial question that is not technical: CENTO's verification
standard assumes Callum approves each piece, which does not survive strangers
running their own corpora. Settle that before the schema — it decides whether a
corpus needs its own moderation policy.

This bridge is the prerequisite either way: it establishes *who someone is*,
which branching then needs to record *what they own*.
