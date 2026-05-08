import { QuartzComponent, QuartzComponentConstructor } from "./types"

const OnboardingOverlay: QuartzComponent = () => {
  return (
    <div id="ss-onboarding-overlay" class="ss-onboarding-overlay" aria-hidden="true" aria-modal="true" role="dialog">
      <div class="ss-onboarding-stage">

        <div class="ss-onboarding-rule" aria-hidden="true">
          <span class="ss-rule-line ss-rule-line--left" />
          <span class="ss-rule-diamond" />
          <span class="ss-rule-line ss-rule-line--right" />
        </div>

        <p class="ss-onboarding-kicker">A literary archive</p>

        <h1 class="ss-onboarding-title" aria-label="Stitched Stories">
          <span class="ss-title-word" aria-hidden="true">
            {"Stitched".split("").map((ch, i) => (
              <span class="ss-title-char" style={`--i:${i}`}>{ch}</span>
            ))}
          </span>
          <span class="ss-title-space" aria-hidden="true">&nbsp;</span>
          <span class="ss-title-word" aria-hidden="true">
            {"Stories".split("").map((ch, i) => (
              <span class="ss-title-char" style={`--i:${i + 9}`}>{ch}</span>
            ))}
          </span>
        </h1>

        <div class="ss-onboarding-body">
          <p class="ss-body-line" style="--li:0">
            Every story begins somewhere — in a margin note, a misheard phrase,
            the slant of afternoon light through a window someone once described.
          </p>
          <p class="ss-body-line" style="--li:1">
            Literature does not end on the page where it was printed.
            It migrates. It settles into other mouths, other memories,
            other hands that reach for a pen because something they read
            years ago has finally surfaced as something they need to say.
          </p>
          <p class="ss-body-line" style="--li:2">
            This is a graph of those migrations. At its centre: source texts —
            the works that have travelled furthest, lodged most stubbornly
            in the cultural body. Radiating outward: the stories they made possible.
            Each connection is a stitch. Each stitch holds something together
            that would otherwise drift apart.
          </p>
          <p class="ss-body-line ss-body-line--closing" style="--li:3">
            What you are reading now is the knot at the centre of the thread.
            Pull gently.
          </p>
        </div>

        <div class="ss-onboarding-cta">
          <a id="ss-onboarding-enter" href="/" class="ss-onboarding-btn" role="button">
            <span class="ss-btn-text">Trace the thread</span>
            <span class="ss-btn-arrow" aria-hidden="true">→</span>
          </a>
        </div>

        <div class="ss-onboarding-rule ss-onboarding-rule--bottom" aria-hidden="true">
          <span class="ss-rule-line ss-rule-line--left" />
          <span class="ss-rule-diamond" />
          <span class="ss-rule-line ss-rule-line--right" />
        </div>

      </div>
    </div>
  )
}

OnboardingOverlay.afterDOMLoaded = `
(function () {
  document.addEventListener("nav", function onNav() {
    document.removeEventListener("nav", onNav);

    var overlay = document.getElementById("ss-onboarding-overlay");
    if (!overlay) return;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("ss-onboarding-visible");
        overlay.setAttribute("aria-hidden", "false");
      });
    });

    var btn = document.getElementById("ss-onboarding-enter");
    if (btn) {
      btn.addEventListener("click", function () {
        overlay.classList.add("ss-onboarding-leaving");
        overlay.addEventListener("animationend", function handler(ev) {
          if (ev.animationName !== "ss-overlay-out") return;
          overlay.removeEventListener("animationend", handler);
          overlay.classList.remove("ss-onboarding-visible", "ss-onboarding-leaving");
          overlay.setAttribute("aria-hidden", "true");
        });
      }, { once: true });
    }
  }, { once: true });
})();
`

export default (() => OnboardingOverlay) satisfies QuartzComponentConstructor
