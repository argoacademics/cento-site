import { QuartzComponent, QuartzComponentConstructor } from "./types"

const OnboardingOverlay: QuartzComponent = () => {
  return (
    <div id="ss-onboarding-overlay" class="ss-onboarding-overlay" aria-hidden="true" aria-modal="true" role="dialog">
      <div class="ss-onboarding-stage">

        {/* Threaded rule — animates in first */}
        <div class="ss-onboarding-rule" aria-hidden="true">
          <span class="ss-rule-line ss-rule-line--left" />
          <span class="ss-rule-diamond" />
          <span class="ss-rule-line ss-rule-line--right" />
        </div>

        {/* Kicker */}
        <p class="ss-onboarding-kicker">A literary archive</p>

        {/* Title — letters stagger in */}
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

        {/* Body copy — three lines, each fading in */}
        <div class="ss-onboarding-body">
          <p class="ss-body-line" style="--li:0">
            Every story is threaded to its source.
          </p>
          <p class="ss-body-line" style="--li:1">
            A phrase migrates. A line resurfaces in another hand.
          </p>
          <p class="ss-body-line" style="--li:2">
            This is the archive of those migrations.
          </p>
        </div>

        {/* CTA */}
        <div class="ss-onboarding-cta">
          <a id="ss-onboarding-enter" href="/SS-0003/SS-0003" class="ss-onboarding-btn" role="button">
            <span class="ss-btn-text">Trace the thread</span>
            <span class="ss-btn-arrow" aria-hidden="true">→</span>
          </a>
        </div>

        {/* Bottom rule mirror */}
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

    // Always show on first load; respect localStorage for subsequent navigations
    var seen = localStorage.getItem("ss-archive-entered");

    if (seen) {
      overlay.setAttribute("aria-hidden", "true");
      return;
    }

    // Small rAF delay so the page beneath has painted
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("ss-onboarding-visible");
        overlay.setAttribute("aria-hidden", "false");
      });
    });

    var btn = document.getElementById("ss-onboarding-enter");
    if (btn) {
      btn.addEventListener("click", function (e) {
        localStorage.setItem("ss-archive-entered", "1");
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
