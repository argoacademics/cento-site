// @ts-ignore
import authStatusScript from "./scripts/authstatus.inline"
import styles from "./styles/authstatus.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface Options {
  /**
   * LODESTAR app origin, e.g. https://app.lodestar.ink — the only place that
   * mints or clears the shared session. Empty string disables the chip
   * entirely, which is the correct behaviour before the domain cutover.
   */
  lodestarAppUrl: string
  /**
   * LODESTAR's Supabase project ref (the `<ref>` in `sb-<ref>-auth-token`).
   * CENTO reads that cookie to know whether someone is signed in.
   */
  supabaseRef: string
}

/**
 * Signed-in state for the current LODESTAR account.
 *
 * CENTO is a STATIC site — there is no server request to read a cookie on, the
 * way ELIDE's /api/auth/me does. So this renders an empty shell and a small
 * inline script fills it in from `document.cookie` after load. That difference
 * is the whole reason this component exists rather than porting ELIDE's.
 *
 * What we can and cannot do here matters:
 *  - we can see THAT a session cookie exists, and read the unverified `email`
 *    claim out of its payload, purely to render "signed in as …";
 *  - we CANNOT verify the JWT signature in a static page, and we do not try.
 *
 * That is acceptable because this chip gates NOTHING. It is an affordance, not
 * an authorisation. Anything that actually depends on identity (submitting a
 * stitch, owning a corpus) is checked server-side by the service that owns the
 * data, against LODESTAR's JWKS — never by this component. Auth stays additive:
 * the archive reads exactly the same signed out.
 */
export default ((opts?: Partial<Options>) => {
  const AuthStatus: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    // Nothing to offer until LODESTAR is configured — before the domain
    // cutover the cookie cannot reach us, so showing "Sign in" would be a lie.
    if (!opts?.lodestarAppUrl || !opts?.supabaseRef) return null

    return (
      <div
        class={classNames(displayClass, "auth-status")}
        data-lodestar-app={opts.lodestarAppUrl}
        data-supabase-ref={opts.supabaseRef}
        // Filled in by authstatus.inline.ts; hidden until then so signed-out
        // users never see a flash of the wrong state.
        aria-live="polite"
      ></div>
    )
  }

  AuthStatus.afterDOMLoaded = authStatusScript
  AuthStatus.css = styles
  return AuthStatus
}) satisfies QuartzComponentConstructor<Partial<Options>>
