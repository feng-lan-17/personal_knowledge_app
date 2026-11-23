import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { COLUMN_NAME } from "../domain/labels.ts"
import type { Discovery } from "../domain/types.ts"
import { useLibrary } from "../library/context.tsx"

export function DiscoverPage() {
  const { id } = useParams()
  const lib = useLibrary()
  const [items, setItems] = useState<Discovery[]>([])

  useEffect(() => {
    document.title = "发现 · 私人知识图书馆"
    void lib.store.listDiscoveries().then(setItems)
  }, [lib.store])

  const current = items.find((item) => item.id === id)
  const latest = items.filter((item) => item.section === "latest").sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  const featured = items.filter((item) => item.section === "featured")

  return (
    <div className="page discover-page">
      {current ? (
        <article className="discovery-detail">
          <Link to="/discover">← 发现</Link>
          <p className="kicker">{current.section === "latest" ? "候选资料" : "精选来源"} · {current.addedAt}</p>
          <h1>{current.title}</h1>
          <p className="deck">{current.summary}</p>
          <p>{current.caution}</p>
          <div className="row">
            <a className="btn btn-solid" href={current.sourceUrl} target="_blank" rel="noreferrer">{current.sourceTitle} ↗</a>
            {current.columnHint ? <Link className="btn" to={`/library/${current.columnHint}`}>浏览{COLUMN_NAME[current.columnHint]}</Link> : null}
          </div>
        </article>
      ) : (
        <>
          <header className="search-hero">
            <h1>发现</h1>
            <p className="deck">浏览原始资料，找到值得进一步阅读的线索。</p>
          </header>
          <div className="discover-grid">
            <section className="section">
              <h2>候选资料</h2>
              <ItemList items={latest} />
            </section>
            <section className="section">
              <h2>精选来源</h2>
              <ItemList items={featured} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function ItemList({ items }: { items: Discovery[] }) {
  return (
    <ul className="plain-list">
      {items.map((item) => (
        <li key={item.id}>
          <p className="kicker">{item.columnHint ? COLUMN_NAME[item.columnHint] : item.sourceTitle} · {item.addedAt}</p>
          <Link to={`/discover/${item.id}`}>{item.title}</Link>
          <p className="meta">{item.summary}</p>
        </li>
      ))}
    </ul>
  )
}
