import { useEffect } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../components/ui/dialog.tsx"
import { GLOSSARY, glossaryById } from "../content/glossary.ts"
import { BackLink } from "../components/BackLink.tsx"

export function EncyclopediaPage() {
  const { termId } = useParams()
  const [params] = useSearchParams()
  const back = params.get("from")
  const entry = termId ? glossaryById(termId) : undefined

  useEffect(() => {
    document.title = entry ? `${entry.term} · 百科` : "百科 · 私人知识图书馆"
  }, [entry])

  return (
    <div className="page shelf glossary-page">
      <nav className="detail-route" aria-label="词条导航">
        {back && /^\/read\/[\w-]+(?:#[^/]+)?$/.test(back)
          ? <Link className="back-control" replace to={back}>← 返回原文</Link>
          : <BackLink fallback={termId ? "/library/llm/encyclopedia" : "/library/llm"} />}
        <Link to="/library/llm">大模型</Link><span aria-hidden="true">/</span>
        {termId ? <Link to="/library/llm/encyclopedia">百科</Link> : <span>百科</span>}
      </nav>
      {entry ? (
        <article className="entry-page">
          <h1>{entry.term}</h1>
          <p className="lede">{entry.gloss}</p>
          <p><b>例如 </b>{entry.example}</p>
          {(entry.formula || entry.more) ? (
            <details>
              <summary>公式与进一步说明</summary>
              {entry.formula ? <p className="formula">{entry.formula}</p> : null}
              {entry.more ? <p>{entry.more}</p> : null}
            </details>
          ) : null}
        </article>
      ) : (
        <>
          <h1>百科</h1>
          <ul className="entry-list">
            {GLOSSARY.map((item) => (
              <li key={item.id}>
                <Link to={`/library/llm/encyclopedia/${item.id}`}><strong>{item.term}</strong><span>{item.gloss}</span><i aria-hidden="true">›</i></Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export function TermPopover({
  termId,
  from,
  onClose,
}: {
  termId: string
  from: string
  onClose: () => void
}) {
  const entry = glossaryById(termId)
  if (!entry) return null
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}><DialogContent>
      <p className="kicker">释义</p>
      <DialogTitle>{entry.term}</DialogTitle>
      <DialogDescription>{entry.gloss}</DialogDescription>
      <p className="meta">例如：{entry.example}</p>
      <p className="row">
        <Link to={`/library/llm/encyclopedia/${entry.id}?from=${encodeURIComponent(from)}`}>完整词条</Link>
        <button type="button" className="btn" onClick={onClose}>回到原文</button>
      </p>
    </DialogContent></Dialog>
  )
}
