import { QuartzComponent, QuartzComponentConstructor } from "./types"

const HomeButton: QuartzComponent = () => {
  return (
    <div class="home-button">
      <a href="/" class="home-button-link">
        Stitched Stories
      </a>
    </div>
  )
}

export default (() => HomeButton) satisfies QuartzComponentConstructor
