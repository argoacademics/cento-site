/**
 * Cookie/claims parsing for the LODESTAR account chip.
 *
 * Kept OUT of authstatus.inline.ts on purpose: Quartz concatenates `.inline.ts`
 * files into a single bare script, where a top-level `export` is a syntax error
 * ("Unexpected export" at build time). A normal module can be both imported by
 * the inline script and unit-tested under `node --test`.
 *
 * Everything here is display-only. The JWT signature is NOT verified — a static
 * page cannot do it — so no value returned by this module may gate access.
 */

export interface Claims {
  email?: string
  sub?: string
}

/**
 * Supabase chunks large cookies as `<name>.0`, `<name>.1`, … — rejoin in order.
 * Takes the raw cookie string rather than reading document.cookie directly so
 * it is testable outside a browser.
 */
export function readCookie(cookieString: string, name: string): string | null {
  const jar = cookieString ? cookieString.split("; ") : []
  const exact = jar.find((c) => c.startsWith(`${name}=`))
  if (exact) return decodeURIComponent(exact.slice(name.length + 1))

  const chunks = jar
    .filter((c) => c.startsWith(`${name}.`))
    .map((c) => {
      const eq = c.indexOf("=")
      const idx = Number(c.slice(name.length + 1, eq))
      return { idx, value: decodeURIComponent(c.slice(eq + 1)) }
    })
    .sort((a, b) => a.idx - b.idx)

  return chunks.length ? chunks.map((c) => c.value).join("") : null
}

/** base64 decode that works in the browser and under `node --test`. */
function b64decode(value: string): string {
  return typeof atob === "function"
    ? atob(value)
    : Buffer.from(value, "base64").toString("binary")
}

/** Pulls the display claims out of the session cookie. Never throws. */
export function claimsFrom(raw: string): Claims | null {
  try {
    // @supabase/ssr stores the session JSON, base64-encoded behind a marker.
    let json = raw
    if (raw.startsWith("base64-")) {
      json = b64decode(raw.slice("base64-".length))
    }
    const session = JSON.parse(json)
    const token: string | undefined = session?.access_token
    if (!token) return null

    // Decode the JWT payload for the email only. Signature intentionally
    // unverified — display only, see the file header.
    const payload = token.split(".")[1]
    if (!payload) return null
    const decoded = JSON.parse(
      b64decode(payload.replace(/-/g, "+").replace(/_/g, "/")),
    )
    // An expired token should read as signed out rather than showing a stale name.
    if (typeof decoded.exp === "number" && decoded.exp * 1000 < Date.now()) {
      return null
    }
    return { email: decoded.email, sub: decoded.sub }
  } catch {
    return null
  }
}

/**
 * Escapes text bound for innerHTML. The email arrives from a cookie whose
 * signature we deliberately do not verify, so it must be treated as attacker-
 * controlled: anyone who can set a cookie on the parent domain could otherwise
 * inject markup here.
 */
export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  )
}
