import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

export default ((() => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>Stitched Stories</p>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor)
