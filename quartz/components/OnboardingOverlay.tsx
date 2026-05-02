import { QuartzComponent, QuartzComponentConstructor } from "./types"

const OnboardingOverlay: QuartzComponent = () => {
  return (
    <div id="ss-onboarding-overlay" class="ss-onboarding-overlay" aria-hidden="true">
      <div class="ss-onboarding-inner">
        <p class="ss-onboarding-kicker">A literary archive</p>
        <h2 class="ss-onboarding-title">Stitched Stories</h2>
        <p class="ss-onboarding-body">
          Every story is threaded to its source.
          <br />
          Follow the hem through the archive.
        </p>
        <button id="ss-onboarding-enter" class="ss-onboarding-btn">
          Enter the Archive
        </button>
      </div>
    </div>
  )
}

OnboardingOverlay.afterDOMLoaded = `
(function () {
  document.addEventListener("nav", function () {
    if (localStorage.getItem("ss-archive-entered")) return;
    var overlay = document.getElementById("ss-onboarding-overlay");
    if (!overlay) return;
    overlay.classList.add("ss-onboarding-visible");
    overlay.setAttribute("aria-hidden", "false");
    var btn = document.getElementById("ss-onboarding-enter");
    if (btn) {
      btn.addEventListener("click", function () {
        localStorage.setItem("ss-archive-entered", "1");
        overlay.classList.remove("ss-onboarding-visible");
        overlay.setAttribute("aria-hidden", "true");
      }, { once: true });
    }
  }, { once: true });
})();
`

export default (() => OnboardingOverlay) satisfies QuartzComponentConstructor
