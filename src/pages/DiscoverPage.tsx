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
  const latest = items.filter((item) => item.section === "latest")
  const featured = items.filter((item) => item.section === "featured")

  return (
    <div className="page">
      <header className="search-hero">
        <p className="kicker">发现</p>
        <h1>候选与入口</h1>
        <p className="caution">这里的条目不是经过审核的教材。教材在知识库里，并标有示例或书目的性质。</p>
      </header>
      {current ? (
        <section className="section">
          <p className="kicker">单条线索</p>
          <h2>{current.title}</h2>
          <p>{current.summary}</p>
          <p className="caution">{current.caution}</p>
          <p>
            <a href={current.sourceUrl} target="_blank" rel="noreferrer">
              {current.sourceTitle}
            </a>
          </p>
          <p className="meta">收录于 {current.addedAt}。之后没有自动巡检。</p>
          {current.columnHint ? <p><Link to={`/library/${current.columnHint}`}>回到{COLUMN_NAME[current.columnHint]}</Link></p> : null}
        </section>
      ) : null}
      <section className="section">
        <h2>最新发现</h2>
        <ItemList items={latest} />
      </section>
      <section className="section">
        <h2>精选分区</h2>
        <p className="meta">精选的是可以反复使用的入口，仍然不是教材。</p>
        <ItemList items={featured} />
      </section>
    </div>
  )
}

function ItemList({ items }: { items: Discovery[] }) {
  return (
    <ul className="plain-list">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={`/discover/${item.id}`}>{item.title}</Link>
          <p className="meta">{item.summary}</p>
        </li>
      ))}
    </ul>
  )
}
