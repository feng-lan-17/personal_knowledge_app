import { useEffect, useRef } from "react"
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
}: {
  body: string
  layout: ArticleLayout
  highlights: Highlight[]
  onPlaced?: (unplaced: string[]) => void
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
            if (href?.startsWith("pkl:")) return <Link to={`/read/${href.slice(4)}`}>{children}</Link>
            if (href?.startsWith("/")) return <Link to={href}>{children}</Link>
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
          img: ({ src, alt }) => (
            <span className="figure">
              <img src={src ?? ""} alt={alt ?? ""} />
              {alt ? <span className="figcaption">{alt}</span> : null}
            </span>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
