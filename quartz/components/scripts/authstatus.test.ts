/**
 * Cookie/claims parsing for the LODESTAR account chip.
 * Run: npx tsx --test quartz/components/scripts/authstatus.test.ts
 *
 * These cover the two things that silently break the bridge: Supabase's
 * chunked cookies, and an expired token rendering as still-signed-in.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { readCookie, claimsFrom, escapeHtml } from "./authstatus-claims"

/** Builds a session cookie value shaped like @supabase/ssr writes it. */
function sessionCookie(claims: Record<string, unknown>, exp: number): string {
  const payload = Buffer.from(JSON.stringify({ ...claims, exp })).toString(
    "base64url",
  )
  const token = `header.${payload}.signature`
  return "base64-" + Buffer.from(JSON.stringify({ access_token: token })).toString("base64")
}

const future = Math.floor(Date.now() / 1000) + 3600
const past = Math.floor(Date.now() / 1000) - 3600

test("reads an unchunked cookie", () => {
  const jar = "sb-ref-auth-token=hello; other=1"
  assert.equal(readCookie(jar, "sb-ref-auth-token"), "hello")
})

test("rejoins chunked cookies in index order", () => {
  // Supabase splits large sessions; out-of-order jars are normal.
  const jar = "sb-ref-auth-token.1=world; sb-ref-auth-token.0=hello"
  assert.equal(readCookie(jar, "sb-ref-auth-token"), "helloworld")
})

test("returns null when the cookie is absent", () => {
  assert.equal(readCookie("other=1", "sb-ref-auth-token"), null)
})

test("extracts the email claim from a live session", () => {
  const raw = sessionCookie({ email: "a@b.com", sub: "uid-1" }, future)
  assert.deepEqual(claimsFrom(raw), { email: "a@b.com", sub: "uid-1" })
})

test("an expired token reads as signed out", () => {
  const raw = sessionCookie({ email: "a@b.com", sub: "uid-1" }, past)
  assert.equal(claimsFrom(raw), null)
})

test("garbage never throws", () => {
  assert.equal(claimsFrom("not-a-cookie"), null)
  assert.equal(claimsFrom("base64-!!!"), null)
  assert.equal(claimsFrom(""), null)
})

test("email is escaped before it reaches innerHTML", () => {
  // The cookie is unverified, so a hostile email must not inject markup.
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  )
})
