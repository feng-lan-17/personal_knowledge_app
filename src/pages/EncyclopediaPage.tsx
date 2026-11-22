import { useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { GLOSSARY, glossaryById } from "../content/glossary.ts"

export function EncyclopediaPage() {
  const { termId } = useParams()
  const [params] = useSearchParams()
  const back = params.get("from")
  const entry = termId ? glossaryById(termId) : undefined

  useEffect(() => {
    document.title = entry ? `${entry.term} · 百科` : "百科 · 私人知识图书馆"
  }, [entry])

  return (
    <div className="page shelf">
      <p className="kicker">大模型 · 百科</p>
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
          {back ? <p><Link to={back}>回到刚才的位置</Link></p> : <p><Link to="/library/llm/encyclopedia">全部词条</Link></p>}
        </article>
      ) : (
        <>
          <h1>百科</h1>
          <ul className="entry-list">
            {GLOSSARY.map((item) => (
              <li key={item.id}>
                <Link to={`/library/llm/encyclopedia/${item.id}`}>{item.term}</Link>
                <p>{item.gloss}</p>
                <p className="meta">例如：{item.example}</p>
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
  const [open, setOpen] = useState(true)
  if (!entry || !open) return null
  return (
    <aside className="term-pop" role="dialog" aria-label={entry.term}>
      <p className="kicker">释义</p>
      <strong>{entry.term}</strong>
      <p>{entry.gloss}</p>
      <p className="meta">例如：{entry.example}</p>
      <p className="row">
        <Link to={`/library/llm/encyclopedia/${entry.id}?from=${encodeURIComponent(from)}`}>完整词条</Link>
        <button type="button" onClick={() => { setOpen(false); onClose() }}>回到原文</button>
      </p>
    </aside>
  )
}
