import { claimsFrom, escapeHtml, readCookie } from "./authstatus-claims"

/**
 * Renders the LODESTAR account chip on a static CENTO page.
 *
 * Reads the parent-domain session cookie LODESTAR sets (Domain=.lodestar.ink,
 * see lodestar-app/src/lib/supabase/cookie-domain.ts). Because CENTO is served
 * from a subdomain of that root, the browser sends the same cookie here — no
 * token in a URL, no cross-origin handoff.
 *
 * IMPORTANT — display only. The signature is NOT verified (a static page cannot
 * do it), so nothing here may gate access. It renders a name and two links.
 * Real authorisation happens server-side in whichever service owns the data,
 * against LODESTAR's JWKS. Parsing lives in ./authstatus-claims.ts because a
 * top-level `export` is a syntax error inside a Quartz inline script.
 */
function render() {
  const el = document.querySelector<HTMLElement>(".auth-status")
  if (!el) return

  const appUrl = el.dataset.lodestarApp
  const ref = el.dataset.supabaseRef
  if (!appUrl || !ref) return

  const raw = readCookie(document.cookie, `sb-${ref}-auth-token`)
  const claims = raw ? claimsFrom(raw) : null
  const here = window.location.href

  if (!claims) {
    // Names what an account is FOR rather than just offering one. The archive
    // reads identically signed out — an account carries your work across the
    // instruments, it does not unlock the reading. Keep this an offer, never a
    // wall: no modal, no dismissable banner, no interstitial.
    const login = `${appUrl}/login?next=${encodeURIComponent(here)}`
    el.innerHTML =
      `<a class="auth-status-link" href="${login}" ` +
      `title="One account across Cento, Elide and nthrhyme. ` +
      `Reading never requires it.">Sign in to keep your work</a>`
    return
  }

  const who = escapeHtml(claims.email ?? "your account")
  // Sign-out is a POST (a GET version would let any page log you out with an
  // <img> tag), so it is a small form rather than a link.
  el.innerHTML = `
    <span class="auth-status-who" title="${who}">${who}</span>
    <form class="auth-status-form" method="post"
          action="${appUrl}/auth/signout?next=${encodeURIComponent(here)}">
      <button class="auth-status-link" type="submit">Sign out</button>
    </form>
  `
}

// Quartz is an SPA — "nav" fires on first load and every client-side
// navigation, so the chip survives page transitions.
document.addEventListener("nav", render)
