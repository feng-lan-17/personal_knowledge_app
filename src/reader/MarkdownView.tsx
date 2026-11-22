import { isValidElement, useEffect, useRef, useState, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import { Link } from "react-router-dom"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import type { ArticleLayout, Highlight } from "../domain/types.ts"
import { applyHighlights } from "./applyHighlights.ts"

export function MarkdownView({
  body,
  layout,
  highlights,
  onPlaced,
  onTerm,
}: {
  body: string
  layout: ArticleLayout
  highlights: Highlight[]
  onPlaced?: (unplaced: string[]) => void
  onTerm?: (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const report = applyHighlights(ref.current, highlights)
    onPlaced?.(report.filter((item) => !item.placed).map((item) => item.id))
  }, [body, highlights, onPlaced])

  const prose = layout === "immersive" ? "prose prose-essay" : layout === "catalog" ? "prose prose-catalog" : "prose prose-tech"
  return (
    <div ref={ref} className={prose} data-testid={layout === "immersive" ? "reader-essay" : "reader-technical"}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSlug, rehypeKatex, rehypeHighlight]}
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith("term:")) {
              const id = href.slice(5)
              return (
                <button type="button" className="term" onClick={() => onTerm?.(id)}>
                  {children}
                </button>
              )
            }
            if (href?.startsWith("pkl:")) return <Link to={`/read/${href.slice(4)}`}>{children}</Link>
            if (href?.startsWith("/")) return <Link to={href}>{children}</Link>
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
          pre: ({ children }) => <CodeFrame>{children}</CodeFrame>,
          img: ({ src, alt }) => <ZoomFigure src={src} alt={alt} />,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

function ZoomFigure({ src, alt }: { src?: string; alt?: string }) {
  const [zoomed, setZoomed] = useState(false)
  return (
    <span className={zoomed ? "figure is-zoomed" : "figure"}>
      <button type="button" onClick={() => setZoomed((value) => !value)}>{zoomed ? "收回" : "放大"}</button>
      <img src={src ?? ""} alt={alt ?? ""} />
      {alt ? <span className="figcaption">{alt}</span> : null}
    </span>
  )
}

function CodeFrame({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState("")
  const lang = languageOf(children)
  return (
    <div className="code-frame">
      <div className="code-bar">
        <span>{lang}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(textOf(children)).then(
              () => setCopied("已复制"),
              () => setCopied("复制失败"),
            )
          }}
        >
          复制
        </button>
        {copied ? <em>{copied}</em> : null}
      </div>
      <pre>{children}</pre>
    </div>
  )
}

function languageOf(children: ReactNode): string {
  const child = Array.isArray(children) ? children[0] : children
  if (!isValidElement<{ className?: string }>(child)) return "text"
  const match = /language-([\w+#]+)/.exec(child.props.className ?? "")
  return match?.[1] ?? "text"
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map((item) => textOf(item)).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ""
}
