import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/graph.inline"
import style from "./styles/graph.scss"
import { classNames } from "../util/lang"

export interface D3Config {
  drag: boolean
  zoom: boolean
  depth: number
  scale: number
  repelForce: number
  centerForce: number
  linkDistance: number
  fontSize: number
  opacityScale: number
  removeTags: string[]
  showTags: boolean
  focusOnHover?: boolean
  enableRadial?: boolean
}

interface GraphOptions {
  localGraph: Partial<D3Config> | undefined
  globalGraph: Partial<D3Config> | undefined
}

const defaultOptions: GraphOptions = {
  localGraph: {
    drag: true,
    zoom: true,
    depth: -1,
    scale: 1.1,
    repelForce: 0.5,
    centerForce: 0.3,
    linkDistance: 40,
    fontSize: 0.5,
    opacityScale: 1,
    showTags: false,
    removeTags: [],
    focusOnHover: true,
    enableRadial: true,
  },
  globalGraph: {
    drag: true,
    zoom: true,
    depth: -1,
    scale: 0.9,
    repelForce: 0.5,
    centerForce: 0.2,
    linkDistance: 40,
    fontSize: 0.5,
    opacityScale: 1,
    showTags: false,
    removeTags: [],
    focusOnHover: true,
    enableRadial: true,
  },
}

export default ((opts?: Partial<GraphOptions>) => {
  const Graph: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const localGraph = { ...defaultOptions.localGraph, ...opts?.localGraph }
    const globalGraph = { ...defaultOptions.globalGraph, ...opts?.globalGraph }
    return (
      <div class={classNames(displayClass, "graph")}>
        <div class="graph-controls">
          <button class="graph-btn" id="graph-btn-randomise">
            Randomise
          </button>
          <button class="graph-btn" id="graph-btn-hem">
            Follow the hem
          </button>
          <input
            class="graph-search-input"
            id="graph-search-input"
            type="text"
            placeholder="Search nodes…"
          />
        </div>
        <div class="graph-outer">
          <div class="graph-container" data-cfg={JSON.stringify(localGraph)}></div>
        </div>
      </div>
    )
  }

  Graph.css = style
  Graph.afterDOMLoaded = script

  return Graph
}) satisfies QuartzComponentConstructor
